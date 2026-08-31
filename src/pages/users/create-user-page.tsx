import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { MainLayout } from "@/layouts/main-layout"
import { supabase } from "@/lib/supabase"
import {
  UserPlus,
  ArrowLeft,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  User,
  Mail,
  Briefcase,
  Crown,
  Users,
  LayoutGrid,
  ShieldAlert,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

/** Numbered timeline marker */
function StepMarker({ index, showLine }: { index: number; showLine: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-8 h-8 rounded-sm bg-[#0B192C] text-white text-xs font-bold flex items-center justify-center shrink-0">
        {index}
      </div>
      {showLine && <div className="w-px flex-1 bg-gray-200 my-2" />}
    </div>
  )
}

/** Small reusable toggle switch */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF7F50]/30 ${
        checked ? "bg-[#FF7F50]" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  )
}

const ROLE_META = {
  "Super Admin": {
    icon: Crown,
    blurb: "Full administrative control over all system modules & settings.",
    badgeBg: "bg-purple-100 text-purple-800",
  },
  Recruiter: {
    icon: Briefcase,
    blurb: "Manage job postings, candidate applications, and hiring workflows.",
    badgeBg: "bg-blue-100 text-blue-800",
  },
  "Hiring Manager": {
    icon: Users,
    blurb: "Review assigned candidate profiles, feedback & interview logs.",
    badgeBg: "bg-amber-100 text-amber-800",
  },
  Viewer: {
    icon: Eye,
    blurb: "Read-only viewing privileges across standard platform modules.",
    badgeBg: "bg-slate-100 text-slate-700",
  },
} as const

const PERMISSION_META = {
  canManageJobs: {
    icon: Briefcase,
    label: "Job Management Access",
    description: "Create, edit, duplicate, and publish job listings",
  },
  canViewCandidates: {
    icon: Users,
    label: "Candidate & Applications Access",
    description: "View applicants, update hiring stages, and download resumes",
  },
  canEditProjects: {
    icon: LayoutGrid,
    label: "Project Editing Access",
    description: "Create & modify recruitment campaign projects",
  },
  canManageUsers: {
    icon: ShieldCheck,
    label: "User Administration",
    description: "Add new accounts and configure system permissions",
  },
  canViewAuditLogs: {
    icon: ShieldAlert,
    label: "Security & Activity Audit Logs",
    description: "Access system security logs and monitor user actions",
  },
} as const

export function CreateUserPage() {
  const navigate = useNavigate()

  // Form State
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState<"Super Admin" | "Recruiter" | "Hiring Manager" | "Viewer">("Recruiter")

  // Permissions state
  const [permissions, setPermissions] = useState({
    canManageJobs: true,
    canViewCandidates: true,
    canEditProjects: false,
    canManageUsers: false,
    canViewAuditLogs: false,
  })

  // Feedback State
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleRoleChange = (newRole: "Super Admin" | "Recruiter" | "Hiring Manager" | "Viewer") => {
    setRole(newRole)
    if (newRole === "Super Admin") {
      setPermissions({
        canManageJobs: true,
        canViewCandidates: true,
        canEditProjects: true,
        canManageUsers: true,
        canViewAuditLogs: true,
      })
    } else if (newRole === "Recruiter") {
      setPermissions({
        canManageJobs: true,
        canViewCandidates: true,
        canEditProjects: true,
        canManageUsers: false,
        canViewAuditLogs: false,
      })
    } else if (newRole === "Hiring Manager") {
      setPermissions({
        canManageJobs: false,
        canViewCandidates: true,
        canEditProjects: true,
        canManageUsers: false,
        canViewAuditLogs: false,
      })
    } else {
      setPermissions({
        canManageJobs: false,
        canViewCandidates: true,
        canEditProjects: false,
        canManageUsers: false,
        canViewAuditLogs: false,
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!username.trim()) {
      setError("Username / Full Name is required.")
      return
    }

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.")
      return
    }

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)

    try {
      const { data: currentSession } = await supabase.auth.getSession()

      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: username.trim(),
            role: role,
            permissions: permissions,
          },
        },
      })

      if (signUpError) throw signUpError

      if (currentSession?.session) {
        await supabase.auth.setSession({
          access_token: currentSession.session.access_token,
          refresh_token: currentSession.session.refresh_token,
        })
      }

      setSuccess(`User "${username}" (${email}) created successfully!`)
      setTimeout(() => {
        navigate("/users")
      }, 1200)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Failed to create user account. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const enabledPermissionCount = Object.values(permissions).filter(Boolean).length

  return (
    <MainLayout pageTitle="Create New User">
      <div className="flex flex-col gap-6 font-sans w-full pb-12">
        {/* Top Header & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Button
              variant="outline"
              onClick={() => navigate("/users")}
              className="h-8 border-gray-200 hover:bg-gray-50 text-xs font-semibold rounded-sm mb-2 cursor-pointer inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-gray-500" />
              <span>Back to User Management</span>
            </Button>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Create New User Account</h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Add a new team member, set credentials, assign system role, and configure access privileges.
            </p>
          </div>
        </div>

        {/* Feedback Banners */}
        {error && (
          <div className="flex items-start gap-3 p-4 text-xs text-red-700 bg-red-100 rounded-sm font-bold shadow-xs">
            <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 p-4 text-xs text-emerald-800 bg-emerald-100 rounded-sm font-bold shadow-xs">
            <CheckCircle2 className="w-4.5 h-4.5 shrink-0 text-emerald-700" />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-0">
          {/* Section 1 */}
          <div className="flex gap-4">
            <StepMarker index={1} showLine />
            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col gap-5 flex-1 mb-6">
              <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                1. Credentials & User Profile Info
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Full Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-800 flex items-center gap-1">
                    Full Name / Username <span className="text-[#FF7F50]">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
                    <Input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="E.g. Alex Rivera"
                      required
                      className="pl-9 h-9 text-xs rounded-sm bg-gray-50 border-gray-200"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-800 flex items-center gap-1">
                    Email Address <span className="text-[#FF7F50]">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="E.g. alex.r@company.com"
                      required
                      className="pl-9 h-9 text-xs rounded-sm bg-gray-50 border-gray-200"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-800 flex items-center gap-1">
                    Password <span className="text-[#FF7F50]">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                      minLength={6}
                      className="pl-9 pr-10 h-9 text-xs rounded-sm bg-gray-50 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-800 flex items-center gap-1">
                    Confirm Password <span className="text-[#FF7F50]">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      required
                      minLength={6}
                      className="pl-9 h-9 text-xs rounded-sm bg-gray-50 border-gray-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="flex gap-4">
            <StepMarker index={2} showLine />
            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col gap-5 flex-1 mb-6">
              <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                2. System Role Assignment
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {(Object.keys(ROLE_META) as Array<keyof typeof ROLE_META>).map((r) => {
                  const RoleIcon = ROLE_META[r].icon
                  const isActive = role === r
                  const meta = ROLE_META[r]
                  return (
                    <div
                      key={r}
                      onClick={() => handleRoleChange(r)}
                      className={`relative p-4 rounded-sm border transition-all cursor-pointer flex flex-col gap-2.5 ${
                        isActive
                          ? "border-[#0B192C] bg-[#0B192C] text-white shadow-xs"
                          : "border-gray-200 hover:border-gray-300 bg-white text-gray-900"
                      }`}
                    >
                      {isActive && (
                        <CheckCircle2 className="absolute top-3 right-3 w-4 h-4 text-[#FF7F50]" />
                      )}
                      <div
                        className={`w-8 h-8 rounded-sm flex items-center justify-center ${
                          isActive ? "bg-white/10 text-[#FF7F50]" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        <RoleIcon className="w-4 h-4" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs">{r}</span>
                        {!isActive && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-sm ${meta.badgeBg}`}>
                            {r}
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] leading-snug ${isActive ? "text-gray-300" : "text-gray-500"}`}>
                        {meta.blurb}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="flex gap-4">
            <StepMarker index={3} showLine={false} />
            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col gap-5 flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  3. Granular Access Privileges
                </h2>
                <span className="text-[11px] text-gray-400 font-medium">Customizable per user</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(Object.keys(PERMISSION_META) as Array<keyof typeof PERMISSION_META>).map((key) => {
                  const meta = PERMISSION_META[key]
                  const PermIcon = meta.icon
                  const isLast = key === "canViewAuditLogs"
                  return (
                    <div
                      key={key}
                      className={`flex items-center justify-between gap-3 p-3.5 border rounded-sm transition-all ${
                        permissions[key]
                          ? "border-gray-300 bg-gray-50/80"
                          : "border-gray-200 bg-white"
                      } ${isLast ? "md:col-span-2" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 ${
                            permissions[key] ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          <PermIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-gray-900 block">{meta.label}</span>
                          <span className="text-[11px] text-gray-500">{meta.description}</span>
                        </div>
                      </div>
                      <Toggle
                        checked={permissions[key]}
                        onChange={(v) => setPermissions({ ...permissions, [key]: v })}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 mt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 font-medium">
              Creating <strong className="text-gray-900">{role}</strong> account with{" "}
              <strong className="text-gray-900">{enabledPermissionCount}</strong> permission
              {enabledPermissionCount === 1 ? "" : "s"} enabled.
            </p>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/users")}
                className="h-10 border-gray-200 hover:bg-gray-50 text-xs font-semibold rounded-sm cursor-pointer"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={loading}
                className="h-10 bg-[#FF7F50] hover:bg-[#E56A3C] text-white text-xs font-bold px-6 rounded-sm shadow-xs transition-colors cursor-pointer"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin text-white mr-1.5" />}
                <span>Create User Account</span>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}