import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { MainLayout } from "@/layouts/main-layout"
import { useAuth } from "@/hooks/use-auth"
import { useAuditLogger } from "@/hooks/use-audit-logger"
import { supabase } from "@/lib/supabase"
import {
  Search,
  ShieldCheck,
  UserPlus,
  CheckCircle2,
  XCircle,
  Key,
  Power,
  Edit2,
  Briefcase,
  Users,
  LayoutGrid,
  Loader2,
  Crown,
} from "lucide-react"

// shadcn UI Components
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { UsersTable } from "@/components/users/users-table"

const ROLE_OPTIONS: ComboboxOption[] = [
  { value: "All", label: "Role: All" },
  { value: "Super Admin", label: "Super Admin" },
  { value: "Recruiter", label: "Recruiter" },
  { value: "Hiring Manager", label: "Hiring Manager" },
  { value: "Viewer", label: "Viewer" },
]

type UserItem = {
  id: string
  name: string
  email: string
  role: "Super Admin" | "Recruiter" | "Hiring Manager" | "Viewer"
  status: "Active" | "Suspended"
  isOnline: boolean
  lastSeen: string
  sessionAccess: {
    canManageJobs: boolean
    canViewCandidates: boolean
    canEditProjects: boolean
    canManageUsers: boolean
  }
}

/** Small reusable toggle switch */
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? "bg-[#FF7F50]" : "bg-gray-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  )
}

const ROLE_BADGE_STYLES: Record<UserItem["role"], string> = {
  "Super Admin": "bg-purple-100 text-purple-800 rounded-sm font-semibold",
  Recruiter: "bg-blue-100 text-blue-800 rounded-sm font-semibold",
  "Hiring Manager": "bg-amber-100 text-amber-800 rounded-sm font-semibold",
  Viewer: "bg-slate-100 text-slate-700 rounded-sm font-semibold",
}

const AVATAR_GRADIENTS = [
  "from-[#0B192C] to-[#1F3A5F]",
  "from-[#FF7F50] to-[#e0663a]",
  "from-purple-600 to-indigo-800",
  "from-emerald-600 to-teal-800",
]

function avatarGradient(id: string) {
  const hash = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length]
}

function formatLastSeen(dateString?: string): string {
  if (!dateString) return "Offline"
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return "Offline"
  const now = new Date()
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffSec < 60) return "Just now"
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
  return `${Math.floor(diffSec / 86400)}d ago`
}

export function UserManagementPage() {
  const navigate = useNavigate()
  const { user: currentAuthUser, onlineUsers } = useAuth()
  const { logPageView, logStateMutation } = useAuditLogger()
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("All")
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [users, setUsers] = useState<UserItem[]>([])
  const [isSavingAccess, setIsSavingAccess] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Failed to load users:", error.message)
      return
    }

    const list: UserItem[] = (data || []).map((row) => {
      const isOnline =
        row.id === currentAuthUser?.id ||
        (!!currentAuthUser?.email && row.email?.toLowerCase() === currentAuthUser?.email?.toLowerCase()) ||
        (onlineUsers || []).some(
          (ou) => ou.user_id === row.id || (ou.email && ou.email.toLowerCase() === row.email?.toLowerCase())
        )

      return {
        id: row.id,
        name: row.full_name || row.email?.split("@")[0] || "User",
        email: row.email,
        role: row.role,
        status: row.status,
        isOnline: isOnline,
        lastSeen: isOnline ? "Just now" : formatLastSeen(row.created_at),
        sessionAccess: {
          canManageJobs: !!row.permissions?.canManageJobs,
          canViewCandidates: !!row.permissions?.canViewCandidates,
          canEditProjects: !!row.permissions?.canEditProjects,
          canManageUsers: !!row.permissions?.canManageUsers,
        },
      }
    })

    setUsers(list)
  }

  useEffect(() => {
    loadUsers()
    logPageView("User Management")
  }, [currentAuthUser, onlineUsers])

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === "All" || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const handleToggleStatus = async (userId: string) => {
    const target = users.find((u) => u.id === userId)
    if (!target) return
    const newStatus = target.status === "Active" ? "Suspended" : "Active"

    const { error } = await supabase.from("profiles").update({ status: newStatus }).eq("id", userId)
    if (error) {
      console.error("Failed to update status:", error.message)
      setToast({ message: `Failed to update status: ${error.message}`, type: "error" })
      setTimeout(() => setToast(null), 3000)
      return
    }

    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)))
    setToast({ message: `User status changed to ${newStatus}`, type: "success" })
    setTimeout(() => setToast(null), 3000)

    await logStateMutation({
      category: "Users",
      action: "User Access Status Modified",
      type: "update",
      targetEntity: `User: ${target.name} (${target.email})`,
      details: `Changed status from ${target.status} to ${newStatus}.`,
      changes: [{ field: "Status", from: target.status, to: newStatus }],
    })
  }

  const handleTogglePermission = (permissionKey: keyof UserItem["sessionAccess"]) => {
    if (!selectedUser) return
    const updatedAccess = {
      ...selectedUser.sessionAccess,
      [permissionKey]: !selectedUser.sessionAccess[permissionKey],
    }

    setSelectedUser({
      ...selectedUser,
      sessionAccess: updatedAccess,
    })
  }

  const handleSaveAccessRights = async () => {
    if (!selectedUser) return
    setIsSavingAccess(true)

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ permissions: selectedUser.sessionAccess })
        .eq("id", selectedUser.id)

      if (error) throw error

      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? { ...u, sessionAccess: selectedUser.sessionAccess } : u))
      )

      setIsModalOpen(false)
      setToast({
        message: `Permissions updated successfully for ${selectedUser.name}!`,
        type: "success",
      })

      setTimeout(() => setToast(null), 3000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update permissions"
      console.error("Failed to save permissions:", msg)
      setToast({
        message: msg,
        type: "error",
      })
      setTimeout(() => setToast(null), 4000)
    } finally {
      setIsSavingAccess(false)
    }
  }

  return (
    <MainLayout pageTitle="User & Access Management">
      <div className="flex flex-col gap-6 font-sans">
        {/* Top Header & Action (Matching Jobs Page) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">User & Access Management</h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Control team accounts, configure session access permissions, and monitor live presence.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate("/users/create")}
              className="h-10 bg-[#FF7F50] hover:bg-[#E56A3C] text-white font-bold text-xs rounded-sm shadow-xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4 mr-1.5" />
              <span>Create New User</span>
            </Button>
          </div>
        </div>

        {/* Filter Bar (Matching Jobs Page) */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80 flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user by name or email..."
              className="pl-9 h-9 text-xs rounded-sm bg-gray-50 border-gray-200"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Role Combobox */}
            <div className="w-[180px]">
              <Combobox
                options={ROLE_OPTIONS}
                value={roleFilter}
                onValueChange={(val) => setRoleFilter(val || "All")}
                placeholder="Role: All"
                searchPlaceholder="Search role..."
                className="h-9 text-xs font-semibold bg-gray-50 border-gray-200 rounded-sm"
                allowCustom={false}
              />
            </div>

            <span className="text-xs text-gray-400 font-medium">
              Showing {filteredUsers.length} of {users.length} Users
            </span>
          </div>
        </div>

        {/* Users Table */}
        <UsersTable
          users={filteredUsers}
          roleBadgeStyles={ROLE_BADGE_STYLES}
          avatarGradient={avatarGradient}
          setSelectedUser={setSelectedUser}
          setIsModalOpen={setIsModalOpen}
          handleToggleStatus={handleToggleStatus}
        />

        {/* Modal for Access Permissions */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          {selectedUser && (
            <DialogContent className="max-w-lg p-6 bg-white rounded-2xl">
              <DialogHeader>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-[#FF7F50]">
                    <Key className="w-4 h-4" />
                  </div>
                  <DialogTitle className="text-lg font-extrabold text-gray-900">Customize Access Permissions</DialogTitle>
                </div>
              </DialogHeader>

              {/* User Summary Card */}
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200/70 flex items-center justify-between mt-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarGradient(
                      selectedUser.id
                    )} text-white flex items-center justify-center font-bold text-xs uppercase shrink-0`}
                  >
                    {selectedUser.name.substring(0, 2)}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{selectedUser.name}</h4>
                    <p className="text-xs text-gray-500 font-mono">{selectedUser.email}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${ROLE_BADGE_STYLES[selectedUser.role]}`}>
                  {selectedUser.role}
                </span>
              </div>

              {/* Permission Toggles */}
              <div className="flex flex-col gap-3 mt-2">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Session Permissions & Privileges
                </h4>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl bg-white">
                  <div>
                    <span className="font-bold text-xs text-gray-900 block">Job Management Access</span>
                    <span className="text-[11px] text-gray-500">Create, edit, and publish job postings</span>
                  </div>
                  <Toggle
                    checked={selectedUser.sessionAccess.canManageJobs}
                    onChange={() => handleTogglePermission("canManageJobs")}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl bg-white">
                  <div>
                    <span className="font-bold text-xs text-gray-900 block">Candidate / Applications Access</span>
                    <span className="text-[11px] text-gray-500">Review, shortlist, and manage applicant profiles</span>
                  </div>
                  <Toggle
                    checked={selectedUser.sessionAccess.canViewCandidates}
                    onChange={() => handleTogglePermission("canViewCandidates")}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl bg-white">
                  <div>
                    <span className="font-bold text-xs text-gray-900 block">Project Editing Access</span>
                    <span className="text-[11px] text-gray-500">Create & modify recruitment campaign projects</span>
                  </div>
                  <Toggle
                    checked={selectedUser.sessionAccess.canEditProjects}
                    onChange={() => handleTogglePermission("canEditProjects")}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl bg-white">
                  <div>
                    <span className="font-bold text-xs text-gray-900 block">User & Admin Management</span>
                    <span className="text-[11px] text-gray-500">Grant or revoke permissions for other users</span>
                  </div>
                  <Toggle
                    checked={selectedUser.sessionAccess.canManageUsers}
                    onChange={() => handleTogglePermission("canManageUsers")}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 mt-2">
                <Button
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSavingAccess}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer"
                >
                  Close
                </Button>
                <Button
                  onClick={handleSaveAccessRights}
                  disabled={isSavingAccess}
                  className="bg-[#0B192C] hover:bg-[#152744] text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {isSavingAccess ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF7F50] mr-1.5" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Access Rights</span>
                  )}
                </Button>
              </div>
            </DialogContent>
          )}
        </Dialog>

        {/* Floating Toast Notification */}
        {toast && (
          <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 bg-[#0B192C] text-white rounded-xl shadow-2xl border border-gray-700 transition-all animate-in fade-in slide-in-from-top-4">
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-4.5 h-4.5 text-red-400 shrink-0" />
            )}
            <span className="text-xs font-bold tracking-tight">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
