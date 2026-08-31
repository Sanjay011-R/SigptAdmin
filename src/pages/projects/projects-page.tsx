import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { MainLayout } from "@/layouts/main-layout"
import { useAuditLogger } from "@/hooks/use-audit-logger"
import {
  fetchProjects,
  deleteProject,
  type ProjectRecord,
} from "@/services/project-storage-service"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { PaginationBar } from "@/components/ui/pagination"
import {
  Search,
  Download,
  Plus,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  FolderKanban,
  Loader2,
  AlertTriangle,
  X,
} from "lucide-react"

const STATUS_OPTIONS: ComboboxOption[] = [
  { value: "All", label: "Status: All" },
  { value: "Published", label: "Published" },
  { value: "Draft", label: "Draft" },
]

const STATUS_BADGE_CLASSES: Record<ProjectRecord["status"], string> = {
  Published: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Draft: "bg-amber-50 text-amber-800 border border-amber-200",
}

const PAGE_SIZE = 10

export function ProjectsPage() {
  const navigate = useNavigate()
  const { logPageView, logStateMutation } = useAuditLogger()
  const [search, setSearch] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("All")
  const [page, setPage] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(false)
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState<boolean>(false)

  const loadProjectsList = async () => {
    const list = await fetchProjects()
    setProjects(list)
  }

  useEffect(() => {
    logPageView("Projects")
    loadProjectsList()
  }, [logPageView])

  const handleDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name })
  }

  const confirmDeleteProject = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteProject(deleteTarget.id)
      await loadProjectsList()
      await logStateMutation({
        category: "Jobs",
        action: "Project Deleted",
        type: "delete",
        targetEntity: `${deleteTarget.id} (${deleteTarget.name})`,
        details: `Deleted recruitment project ${deleteTarget.id}.`,
      })
    } catch (err) {
      console.error("Failed to delete project:", err)
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const handleRefresh = async () => {
    setLoading(true)
    await loadProjectsList()
    setTimeout(() => {
      setLoading(false)
    }, 300)
  }

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.postedBy.toLowerCase().includes(search.toLowerCase()) ||
      p.department.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "All" || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const paginatedProjects = filteredProjects.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  )

  const handleExportCSV = () => {
    const headers = "ID,Project Title,Department,Posted By,Posted Date,Status,Open Positions,Candidates\n"
    const rows = filteredProjects
      .map(
        (p) =>
          `"${p.id}","${p.name}","${p.department}","${p.postedBy}","${p.postedDate}","${p.status}","${p.openPositions}","${p.candidatesCount}"`
      )
      .join("\n")
    const blob = new Blob([headers + rows], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `Projects_Export_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  return (
    <MainLayout pageTitle="Recruitment Projects">
      <div className="flex flex-col gap-6 font-sans">
        {/* Top Header & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Recruitment Projects
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Organize, track, and publish active hiring drives and department projects.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              className="h-10 border-gray-200 hover:bg-gray-50 text-xs font-semibold rounded-xl cursor-pointer"
            >
              <RefreshCw
                className={`w-4 h-4 mr-1.5 text-gray-500 ${
                  loading ? "animate-spin text-[#FF7F50]" : ""
                }`}
              />
              <span>Refresh</span>
            </Button>

            <Button
              variant="outline"
              onClick={handleExportCSV}
              className="h-10 border-gray-200 hover:bg-gray-50 text-xs font-semibold rounded-xl cursor-pointer"
            >
              <Download className="w-4 h-4 mr-1.5 text-gray-500" />
              <span>Export CSV</span>
            </Button>

            <button
              onClick={() => navigate("/projects/create")}
              className="inline-flex items-center gap-2 bg-[#FF7F50] hover:bg-[#E56A3C] text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer h-10"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Project</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80 flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Search project title, lead, or dept..."
              className="pl-9 h-9 text-xs rounded-sm bg-gray-50 border-gray-200"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Status Combobox */}
            <div className="w-[180px]">
              <Combobox
                options={STATUS_OPTIONS}
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val || "All")
                  setPage(1)
                }}
                placeholder="Status: All"
                searchPlaceholder="Search status..."
                className="h-9 text-xs font-semibold bg-gray-50 border-gray-200 rounded-sm"
                allowCustom={false}
              />
            </div>

            <span className="text-xs text-gray-400 font-medium">
              Showing {filteredProjects.length} Projects (page {page})
            </span>
          </div>
        </div>

        {/* Projects Table */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-16 px-4 min-h-[420px] bg-white rounded-sm border border-gray-200">
            <p className="font-inter text-sm text-gray-600 font-medium">
              No recruitment projects found matching search criteria.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-sm border border-gray-200/80 shadow-2xs">
            {/* DESKTOP TABLE */}
            <div className="hidden md:block overflow-x-auto w-full min-h-[420px]">
              <table className="w-full table-fixed text-left text-xs text-gray-600 min-w-[1050px]">
                <colgroup>
                  <col className="w-[7%]" />
                  <col className="w-[26%]" />
                  <col className="w-[17%]" />
                  <col className="w-[18%]" />
                  <col className="w-[12%]" />
                  <col className="w-[10%]" />
                  <col className="w-[10%]" />
                </colgroup>
                <thead className="bg-gray-50/80 text-gray-700 font-bold border-b border-gray-200/70">
                  <tr>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">S.No</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Project Title</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Department</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Project Lead</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Posted Date</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {paginatedProjects.map((project, index) => (
                    <tr
                      key={project.id}
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="even:bg-gray-50/50 odd:bg-white hover:bg-orange-50/60 transition-colors cursor-pointer"
                    >
                      {/* Sequence */}
                      <td className="py-4 px-4 text-center font-semibold text-gray-400 whitespace-nowrap">
                        {(page - 1) * PAGE_SIZE + index + 1}
                      </td>

                      {/* Project Title */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-sm bg-[#0B192C] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            <FolderKanban className="w-4 h-4 text-[#FF7F50]" />
                          </div>
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="font-bold text-gray-900 text-sm hover:text-[#FF7F50] transition-colors truncate">
                              {project.name}
                            </span>
                            <span className="text-[11px] text-gray-400 font-mono truncate">
                              {project.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 border border-gray-200 text-gray-700 font-semibold text-xs rounded-md truncate">
                          {project.department || "Engineering"}
                        </span>
                      </td>

                      {/* Project Lead */}
                      <td className="py-4 px-4 font-semibold text-gray-900 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="truncate">{project.postedBy || "Recruiter"}</span>
                          <span className="text-[11px] text-gray-400 truncate">
                            {project.openPositions} Open Position{project.openPositions > 1 ? "s" : ""}
                          </span>
                        </div>
                      </td>

                      {/* Posted Date */}
                      <td className="py-4 px-4 text-gray-500 font-mono text-[11px] whitespace-nowrap">
                        {project.postedDate}
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full font-bold text-[11px] whitespace-nowrap ${
                            STATUS_BADGE_CLASSES[project.status]
                          }`}
                        >
                          {project.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        className="py-4 px-4 text-right relative whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            title="View Project Details"
                            onClick={() => navigate(`/projects/${project.id}`)}
                            className="p-1.5 text-gray-500 hover:text-[#FF7F50] hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            title="Edit Project"
                            onClick={() => navigate(`/projects/edit/${project.id}`)}
                            className="p-1.5 text-gray-500 hover:text-[#0B192C] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            title="Delete"
                            onClick={() => handleDelete(project.id, project.name)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARD VIEW */}
            <div className="md:hidden divide-y divide-gray-100 min-h-[420px]">
              {paginatedProjects.map((project, index) => (
                <div
                  key={project.id}
                  onClick={() => navigate(`/projects/edit/${project.id}`)}
                  className="p-4 flex flex-col gap-3 hover:bg-orange-50/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-sm bg-[#0B192C] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                        <FolderKanban className="w-4 h-4 text-[#FF7F50]" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900 text-sm truncate">
                          {project.name}
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono truncate">
                          #{index + 1} • {project.id} • {project.department}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-gray-400 shrink-0 pt-0.5">
                      {project.postedDate}
                    </span>
                  </div>

                  <div className="text-[11px] text-gray-600 font-medium flex flex-col gap-0.5">
                    <span>Posted by: <strong>{project.postedBy}</strong></span>
                    <span>{project.candidatesCount || 0} Candidates • {project.openPositions} Openings</span>
                  </div>

                  <div
                    className="flex items-center justify-between pt-1 border-t border-gray-100 gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full font-bold text-[11px] whitespace-nowrap ${
                        STATUS_BADGE_CLASSES[project.status]
                      }`}
                    >
                      {project.status}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        title="Edit & View Medium Post"
                        onClick={() => navigate(`/projects/edit/${project.id}`)}
                        className="p-1.5 text-gray-500 hover:text-[#0B192C] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        title="Delete"
                        onClick={() => handleDelete(project.id, project.name)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Bar */}
            <PaginationBar
              page={page}
              pageSize={PAGE_SIZE}
              total={filteredProjects.length}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Modern Custom Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 flex flex-col gap-5 text-gray-900 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                  <AlertTriangle className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Delete Recruitment Project</h3>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    This action is permanent and cannot be undone.
                  </p>
                </div>
              </div>
              <button
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200/80 text-xs font-mono text-gray-700">
              <span className="text-gray-400 font-bold block text-[10px] uppercase mb-0.5">Target Project</span>
              <strong className="text-gray-900 font-sans font-bold text-sm block truncate">{deleteTarget.name}</strong>
              <span className="text-gray-400 text-[11px] font-mono mt-1 block">ID: {deleteTarget.id}</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="h-9 px-4 text-xs font-semibold rounded-xl border-gray-200 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                disabled={deleting}
                onClick={confirmDeleteProject}
                className="h-9 px-4 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs inline-flex items-center gap-1.5"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Project</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}

