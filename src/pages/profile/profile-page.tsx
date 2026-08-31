import { useState, useEffect } from "react"
import { MainLayout } from "@/layouts/main-layout"
import { useAuth } from "@/hooks/use-auth"
import { useAuditLogger } from "@/hooks/use-audit-logger"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  User,
  Mail,
  Shield,
  Key,
  CheckCircle2,
  Lock,
  Building2,
  Phone,
  Briefcase,
  Clock,
  Save,
  BadgeCheck,
  Users,
  MessageSquare,
  Activity,
  FolderKanban,
  RotateCw,
  AlertCircle,
  Loader2,
} from "lucide-react"

export function ProfilePage() {
  const { user: authUser, role: authRole, permissions } = useAuth()
  const { logPageView, logStateMutation, logSecurityEvent } = useAuditLogger()

  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [updatingPassword, setUpdatingPassword] = useState(false)

  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [designation, setDesignation] = useState("")
  const [department, setDepartment] = useState("")
  const [dbRole, setDbRole] = useState("")

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [savedSuccess, setSavedSuccess] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // Fetch live profile from Supabase DB
  const fetchProfile = async () => {
    if (!authUser?.id) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle()

      if (data && !error) {
        setFullName(data.full_name || authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "Admin User")
        setPhone(data.phone || authUser.user_metadata?.phone || "+91 98765 43210")
        setDesignation(data.designation || authUser.user_metadata?.designation || "Platform Administrator")
        setDepartment(data.department || authUser.user_metadata?.department || "Engineering & Talent Operations")
        setDbRole(data.role || authRole || "Administrator")
      } else {
        // Fallback to metadata
        setFullName(authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "Admin User")
        setPhone(authUser.user_metadata?.phone || "+91 98765 43210")
        setDesignation(authUser.user_metadata?.designation || "Platform Administrator")
        setDepartment(authUser.user_metadata?.department || "Engineering & Talent Operations")
        setDbRole(authRole || "Administrator")
      }
    } catch (err) {
      console.error("[ProfilePage] Failed to fetch profile from DB:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    logPageView("User Profile")
    fetchProfile()
  }, [authUser?.id, logPageView])

  // Save Profile Changes to DB & Supabase Auth Metadata
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!authUser?.id) return
    setSavingProfile(true)
    setSavedSuccess(false)
    setProfileError(null)

    try {
      // 1. Update Supabase profiles DB table
      const { error: dbError } = await supabase
        .from("profiles")
        .upsert({
          id: authUser.id,
          email: authUser.email,
          full_name: fullName,
          phone: phone,
          designation: designation,
          department: department,
          role: dbRole || authRole,
          updated_at: new Date().toISOString(),
        })

      if (dbError) {
        console.warn("[ProfilePage] Profiles table upsert note:", dbError.message)
      }

      // 2. Update Supabase Auth User Metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          phone: phone,
          designation: designation,
          department: department,
        },
      })

      if (authError) {
        setProfileError(`Auth Metadata update issue: ${authError.message}`)
      } else {
        await logStateMutation({
          category: "Users",
          action: "User Profile Updated",
          type: "update",
          targetEntity: `User ${fullName}`,
          details: `Updated personal profile details for ${fullName} (${authUser.email}).`,
        })

        setSavedSuccess(true)
        setTimeout(() => setSavedSuccess(false), 3000)
      }
    } catch (err: any) {
      console.error("[ProfilePage] Profile save failure:", err)
      setProfileError(err?.message || "Failed to update profile in database.")
    } finally {
      setSavingProfile(false)
    }
  }

  // Verify Current Password & Update Password in Supabase DB Auth
  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(false)

    if (!currentPassword) {
      setPasswordError("Please enter your current password to verify identity.")
      return
    }

    if (!newPassword || newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.")
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match.")
      return
    }

    if (!authUser?.email) {
      setPasswordError("User email not found for authentication.")
      return
    }

    setUpdatingPassword(true)

    try {
      // 1. Verify Current Password against Supabase Auth
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: authUser.email,
        password: currentPassword,
      })

      if (verifyError) {
        setPasswordError("Current password verification failed. Please check your current password.")
        setUpdatingPassword(false)
        return
      }

      // 2. Update to New Password in Supabase DB Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        setPasswordError(`Password update failed: ${updateError.message}`)
      } else {
        await logSecurityEvent(
          "Password Changed Successfully",
          `User ${fullName} (${authUser.email}) updated their account password.`
        )

        setPasswordSuccess(true)
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setTimeout(() => setPasswordSuccess(false), 3500)
      }
    } catch (err: any) {
      console.error("[ProfilePage] Password update exception:", err)
      setPasswordError(err?.message || "Failed to update password in database.")
    } finally {
      setUpdatingPassword(false)
    }
  }

  const displayEmail = authUser?.email || "admin@gmail.com"
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const permissionItems = [
    { label: "Job Management ", icon: Briefcase, allowed: permissions.canManageJobs },
    { label: "Candidate", icon: User, allowed: permissions.canViewCandidates },
    { label: "User & Role Management", icon: Shield, allowed: permissions.canManageUsers },
    { label: "Project Operations", icon: FolderKanban, allowed: permissions.canEditProjects },
    { label: "Client Inquiries & Requests", icon: MessageSquare, allowed: true },
    { label: "Audit & Activity Log Access", icon: Activity, allowed: permissions.canViewAuditLogs },
  ]

  return (
    <MainLayout pageTitle="My Profile">
      <div className="flex flex-col gap-6 font-sans w-full max-w-6xl mx-auto pb-12">
        {/* Header Title */}
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <span>My Profile &amp; Account Settings</span>
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Manage your account identity, role credentials, and password security.
          </p>
        </div>

        {/* HERO CARD: User Identity Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-[#0B192C] to-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5 min-w-0 w-full md:w-auto">
            <div className="w-20 h-20 rounded-2xl bg-[#FF7F50] text-white font-extrabold text-2xl flex items-center justify-center shrink-0 shadow-lg border-2 border-white/20">
              {loading ? "—" : initials}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-extrabold text-white tracking-tight">
                  {loading ? "Loading profile..." : fullName}
                </h2>
                
              </div>
              <div className="flex items-center gap-4 text-xs font-mono text-slate-400 mt-2 flex-wrap">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {displayEmail}
                </span>
              
               
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 bg-white/5 p-3.5 rounded-xl border border-white/10 w-full md:w-auto justify-between md:justify-start">
            <div className="flex flex-col text-right md:text-left">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Assigned Role
              </span>
              <span className="text-sm font-extrabold text-white capitalize">
                {dbRole || authRole || "Administrator"}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-[#FF7F50] flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Saved Success Notification Banner */}
        {savedSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3 text-xs font-semibold animate-in fade-in-0 duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Profile details saved and updated successfully.</span>
          </div>
        )}

        {profileError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center gap-3 text-xs font-semibold">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{profileError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT 2 COLUMNS: Profile Update Form */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Personal Information Form */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#FF7F50]" />
                  <h3 className="text-sm font-extrabold text-gray-900">
                    Personal Information
                  </h3>
                </div>
                <span className="text-[11px] font-medium text-gray-400">
                  Update contact and public identity
                </span>
              </div>

              <form onSubmit={handleProfileSave} className="flex flex-col gap-4 text-xs font-medium">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700">Full Name</label>
                    <Input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="h-10 text-xs rounded-xl bg-gray-50 border-gray-200"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700">Email Address (Read-only)</label>
                    <Input
                      type="email"
                      value={displayEmail}
                      disabled
                      className="h-10 text-xs rounded-xl bg-gray-100 border-gray-200 text-gray-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700">Phone Number</label>
                    <Input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="h-10 text-xs rounded-xl bg-gray-50 border-gray-200"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700">Designation / Title</label>
                    <Input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Senior Talent Acquisition Specialist"
                      className="h-10 text-xs rounded-xl bg-gray-50 border-gray-200"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Department</label>
                  <Input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Engineering & Talent Operations"
                    className="h-10 text-xs rounded-xl bg-gray-50 border-gray-200"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={savingProfile}
                    className="h-10 px-6 bg-[#FF7F50] hover:bg-[#E56A3C] text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    {savingProfile ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>{savingProfile ? "Saving Profile..." : "Save Profile Details"}</span>
                  </Button>
                </div>
              </form>
            </div>

            {/* Security & Password Settings */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-rose-500" />
                  <h3 className="text-sm font-extrabold text-gray-900">
                    Security &amp; Password Update (Verified)
                  </h3>
                </div>
                <span className="text-[11px] font-medium text-gray-400">
                  Current password verification required
                </span>
              </div>

              {passwordSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in-0 duration-200">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                  <span>Password updated successfully.</span>
                </div>
              )}

              {passwordError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handlePasswordSave} className="flex flex-col gap-4 text-xs font-medium">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Current Password</label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password to verify"
                    className="h-10 text-xs rounded-xl bg-gray-50 border-gray-200 font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700">New Password</label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="h-10 text-xs rounded-xl bg-gray-50 border-gray-200 font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700">Confirm New Password</label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="h-10 text-xs rounded-xl bg-gray-50 border-gray-200 font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={updatingPassword}
                    variant="outline"
                    className="h-10 px-5 border-gray-200 hover:bg-gray-50 text-gray-800 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer"
                  >
                    {updatingPassword ? (
                      <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                    ) : (
                      <Key className="w-3.5 h-3.5 text-rose-600" />
                    )}
                    <span>{updatingPassword ? "Verifying & Updating..." : "Update Password"}</span>
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: Account Role & Permissions Matrix */}
          <div className="flex flex-col gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-extrabold text-gray-900">
                   Permissions
                  </h3>
                </div>
              </div>

              <div className="flex flex-col gap-3 text-xs">
                {permissionItems.map((item) => (
                  <div
                    key={item.label}
                    className="p-3 bg-gray-50/80 rounded-xl border border-gray-200/80 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <item.icon className="w-4 h-4 text-gray-500 shrink-0" />
                      <span className="font-semibold text-gray-800 truncate">{item.label}</span>
                    </div>
                    {item.allowed ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        Granted
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200 shrink-0">
                        Restricted
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
