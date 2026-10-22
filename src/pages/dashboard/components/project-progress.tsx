import { useNavigate } from "react-router-dom"
import type { ProjectRecord } from "@/services/project-storage-service"
import { FolderKanban, ArrowRight, Calendar, Users } from "lucide-react"

interface ProjectProgressProps {
  projects: ProjectRecord[]
}

export function ProjectProgress({ projects }: ProjectProgressProps) {
  const navigate = useNavigate()
  const activeProjects = projects.filter((p) => p.status === "Published").slice(0, 4)

  const statusColors: Record<string, string> = {
    Published: "bg-emerald-100 text-emerald-800",
    Draft: "bg-amber-100 text-amber-800",
  }

  return (
    <div className="bg-white rounded-sm border border-gray-200 p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#081B33]">Project Drives Progress</h2>
          <p className="text-xs text-gray-500">Recruitment campaigns and hiring initiatives</p>
        </div>
        <button
          onClick={() => navigate("/projects")}
          className="text-xs font-semibold text-[#081B33] hover:text-[#FF7A00] cursor-pointer flex items-center gap-1 transition-colors"
        >
          View All ({projects.length}) <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {activeProjects.length === 0 ? (
        <div className="py-12 text-center text-xs text-gray-500 flex flex-col items-center gap-2">
          <FolderKanban className="w-8 h-8 text-gray-300" />
          <span>No active projects at this time.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {activeProjects.map((project) => {
            const fillRatio = Math.min(
              100,
              Math.round((project.candidatesCount / (project.openPositions * 5 || 1)) * 100)
            )

            return (
              <div
                key={project.id}
                onClick={() => navigate("/projects")}
                className="p-4 rounded-sm border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/50 transition-all cursor-pointer flex flex-col gap-3 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      {project.department}
                    </span>
                    <h3 className="text-sm font-bold text-[#081B33] group-hover:text-[#FF7A00] transition-colors line-clamp-1">
                      {project.name}
                    </h3>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-sm text-[10px] font-bold shrink-0 ${
                      statusColors[project.status] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {project.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-600 font-medium">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    {project.candidatesCount} cands / {project.openPositions} seats
                  </span>
                  {project.deadline && (
                    <span className="flex items-center gap-1 text-gray-500 text-[11px]">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      {project.deadline}
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-gray-100 rounded-xs overflow-hidden">
                  <div
                    className="h-full bg-[#081B33] transition-all duration-300"
                    style={{ width: `${fillRatio}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

