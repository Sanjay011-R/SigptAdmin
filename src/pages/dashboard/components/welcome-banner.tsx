import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"
import { Plus, Briefcase, Users, FolderPlus } from "lucide-react"

interface WelcomeBannerProps {
  openJobsCount: number
  newRequestsCount: number
  activeProjectsCount: number
}

export function WelcomeBanner({
  openJobsCount,
  newRequestsCount,
  activeProjectsCount,
}: WelcomeBannerProps) {
  const navigate = useNavigate()
  const { user, role, permissions } = useAuth()

  const userName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Team Member"

  return (
    <div className="bg-[#0B192C] rounded-2xl p-6 md:p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md relative overflow-hidden">
      <div className="relative z-10 flex flex-col gap-2 max-w-2xl">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-medium text-amber-300 w-fit">
            🚀 SI-GPT Command Center
          </span>
          {role && (
            <span className="px-2.5 py-0.5 bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 rounded-full text-[11px] font-semibold">
              {role}
            </span>
          )}
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Welcome back, {userName}!
        </h1>
        <p className="text-sm text-gray-300 leading-relaxed">
          You have <strong className="text-amber-300 font-semibold">{openJobsCount} open jobs</strong>,{" "}
          <strong className="text-emerald-300 font-semibold">{newRequestsCount} new requests</strong>, and{" "}
          <strong className="text-indigo-300 font-semibold">{activeProjectsCount} active projects</strong> needing attention today.
        </p>
      </div>

      <div className="relative z-10 flex items-center gap-2.5 flex-wrap shrink-0">
        {permissions.canManageJobs && (
          <button
            onClick={() => navigate("/jobs/create")}
            className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Job
          </button>
        )}
        {permissions.canViewCandidates && (
          <button
            onClick={() => navigate("/applications")}
            className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl backdrop-blur-sm transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            Applications
          </button>
        )}
        {permissions.canEditProjects && (
          <button
            onClick={() => navigate("/projects/create")}
            className="px-3.5 py-2.5 bg-white text-[#0B192C] hover:bg-gray-100 font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            New Project
          </button>
        )}
      </div>

      {/* Decorative background glows */}
      <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-1/3 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
    </div>
  )
}
