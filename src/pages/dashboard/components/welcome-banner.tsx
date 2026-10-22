import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"
import { Plus, Users, FolderPlus } from "lucide-react"

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
    <div className="bg-[#081B33] rounded-sm p-6 md:p-7 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-[#081B33]">
      <div className="flex flex-col gap-2 max-w-2xl">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 bg-white/10 text-white rounded-sm text-[11px] font-semibold tracking-wide uppercase">
            SI-GPT Command Center
          </span>
          {role && (
            <span className="px-2 py-0.5 bg-white/15 text-gray-200 rounded-sm text-[11px] font-semibold">
              {role}
            </span>
          )}
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
          Welcome back, {userName}
        </h1>
        <p className="text-sm text-gray-300 leading-relaxed">
          Overview for today:{" "}
          <strong className="text-white font-semibold">{openJobsCount} open jobs</strong>,{" "}
          <strong className="text-white font-semibold">{newRequestsCount} new requests</strong>, and{" "}
          <strong className="text-white font-semibold">{activeProjectsCount} active projects</strong> currently in motion.
        </p>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap shrink-0">
        {permissions.canManageJobs && (
          <button
            onClick={() => navigate("/jobs/create")}
            className="px-4 py-2 bg-[#FF7A00] hover:bg-[#E56E00] text-white font-semibold text-xs rounded-sm transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Job
          </button>
        )}
        {permissions.canViewCandidates && (
          <button
            onClick={() => navigate("/applications")}
            className="px-4 py-2 bg-transparent hover:bg-white/10 text-white border border-white/30 font-semibold text-xs rounded-sm transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            Applications
          </button>
        )}
        {permissions.canEditProjects && (
          <button
            onClick={() => navigate("/projects/create")}
            className="px-4 py-2 bg-transparent hover:bg-white/10 text-white border border-white/30 font-semibold text-xs rounded-sm transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            New Project
          </button>
        )}
      </div>
    </div>
  )
}

