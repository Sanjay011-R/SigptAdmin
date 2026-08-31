import {
  Users,
  Briefcase,
  LayoutGrid,
  CheckCircle2,
  XCircle,
  Edit2,
  Power,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export type UserItem = {
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

interface UsersTableProps {
  users: UserItem[]
  roleBadgeStyles: Record<UserItem["role"], string>
  avatarGradient: (id: string) => string
  setSelectedUser: (user: UserItem) => void
  setIsModalOpen: (open: boolean) => void
  handleToggleStatus: (userId: string) => void
}

export function UsersTable({
  users,
  roleBadgeStyles,
  avatarGradient,
  setSelectedUser,
  setIsModalOpen,
  handleToggleStatus,
}: UsersTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-visible">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-gray-600">
          <thead className="bg-gray-50/80 text-gray-700 font-bold border-b border-gray-200/70">
            <tr>
              <th className="py-3.5 px-5">User Profile</th>
              <th className="py-3.5 px-4">System Role</th>
              <th className="py-3.5 px-4">Module Privileges</th>
              <th className="py-3.5 px-4">Live Presence</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-medium">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 px-5 text-center text-gray-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Users className="w-8 h-8 text-gray-300" />
                    <p className="text-xs font-medium text-gray-500">
                      No users found.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr
                  key={u.id}
                  className="even:bg-gray-50/50 odd:bg-white hover:bg-orange-50/60 transition-colors"
                >
                  {/* 1. User Profile */}
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarGradient(
                          u.id
                        )} text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs shrink-0`}
                      >
                        {u.name.substring(0, 2)}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-gray-900 text-sm hover:text-[#FF7F50] transition-colors">
                          {u.name}
                        </span>
                        <span className="text-[11px] text-gray-400 font-mono">
                          {u.email}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* 2. System Role Badge */}
                  <td className="py-4 px-4">
                    <span
                      className={`px-2.5 py-1 text-[11px] ${roleBadgeStyles[u.role]}`}
                    >
                      {u.role}
                    </span>
                  </td>

                  {/* 3. Module Privileges */}
                  <td className="py-4 px-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          u.sessionAccess.canManageJobs
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-100 text-gray-400 line-through"
                        }`}
                      >
                        <Briefcase className="w-2.5 h-2.5" />
                        Jobs
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          u.sessionAccess.canViewCandidates
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-100 text-gray-400 line-through"
                        }`}
                      >
                        <Users className="w-2.5 h-2.5" />
                        Candidates
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          u.sessionAccess.canEditProjects
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-100 text-gray-400 line-through"
                        }`}
                      >
                        <LayoutGrid className="w-2.5 h-2.5" />
                        Projects
                      </span>
                    </div>
                  </td>

                  {/* 4. Live Presence */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          u.isOnline ? "bg-emerald-500 animate-pulse" : "bg-gray-300"
                        }`}
                      />
                      <span className="font-semibold text-gray-800">
                        {u.isOnline ? "Online" : "Offline"}
                      </span>
                      <span className="text-[11px] text-gray-400 font-mono">
                        ({u.lastSeen})
                      </span>
                    </div>
                  </td>

                  {/* 5. Status Badge */}
                  <td className="py-4 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full font-bold text-[11px] flex items-center gap-1 w-fit ${
                        u.status === "Active"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {u.status === "Active" ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                      ) : (
                        <XCircle className="w-3 h-3 text-rose-700" />
                      )}
                      {u.status}
                    </span>
                  </td>

                  {/* 6. Actions */}
                  <td className="py-4 px-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(u)
                          setIsModalOpen(true)
                        }}
                        className="h-8 border-gray-200 hover:bg-gray-50 text-xs font-semibold rounded-xl cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-gray-500 mr-1" />
                        <span>Access Settings</span>
                      </Button>

                      <button
                        onClick={() => handleToggleStatus(u.id)}
                        className={`p-2 rounded-xl transition-colors cursor-pointer ${
                          u.status === "Active"
                            ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                            : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        }`}
                        title={
                          u.status === "Active"
                            ? "Suspend Account"
                            : "Re-activate User"
                        }
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
