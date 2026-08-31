import { useState, useEffect, useCallback } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import { MainLayout } from "@/layouts/main-layout"
import {
  fetchCandidateApplicationsPage,
  updateApplicationStatus,
  APPLICATION_PAGE_SIZE,
  type CandidateApplicationRecord,
  type ApplicationPageFilters,
} from "@/services/application-storage-service"
import { Button } from "@/components/ui/button"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import {
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  FileText,
  Mail,
  MapPin,
  Clock,
  Loader2,
} from "lucide-react"

const STATUS_OPTIONS: ComboboxOption[] = [
  { value: "All", label: "Status: All" },
  { value: "Under Review", label: "Under Review" },
  { value: "Shortlisted", label: "Shortlisted" },
  { value: "Interviewing", label: "Interviewing" },
  { value: "Hired", label: "Hired" },
  { value: "Rejected", label: "Rejected" },
]

export function ApplicationsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [applications, setApplications] = useState<CandidateApplicationRecord[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [page, setPage] = useState<number>(1)
  const [total, setTotal] = useState<number>(0)
  const [search, setSearch] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("All")

  const reqIdFilter = searchParams.get("reqId") || ""

  const totalPages = Math.max(1, Math.ceil(total / APPLICATION_PAGE_SIZE))

  const loadApplications = useCallback(
    async (searchOverride?: string, statusOverride?: string) => {
      setLoading(true)
      const effectiveSearch = reqIdFilter || (searchOverride ?? search)
      const effectiveStatus = statusOverride ?? statusFilter
      const filters: ApplicationPageFilters = {}
      if (effectiveSearch) filters.search = effectiveSearch
      if (effectiveStatus && effectiveStatus !== "All") filters.status = effectiveStatus

      const result = await fetchCandidateApplicationsPage(page, APPLICATION_PAGE_SIZE, filters)
      setApplications(result.data)
      setTotal(result.total)
      setLoading(false)
    },
    [page, reqIdFilter, search, statusFilter]
  )

  useEffect(() => {
    loadApplications()
  }, [loadApplications])

  const handleStatusChange = async (
    app: CandidateApplicationRecord,
    newStatus: CandidateApplicationRecord["status"]
  ) => {
    if (app.status === newStatus) return
    setUpdatingId(app.id)

    // Optimistic UI state update
    setApplications((prev) =>
      prev.map((item) => (item.id === app.id ? { ...item, status: newStatus } : item))
    )

    try {
      await updateApplicationStatus(app.id, newStatus, {
        reqId: app.reqId,
        email: app.email,
      })
    } catch (err) {
      console.error("Failed to update candidate application status:", err)
    } finally {
      setUpdatingId(null)
    }
  }

  const resetPage = () => {
    if (page !== 1) setPage(1)
    else loadApplications()
  }

  return (
    <MainLayout pageTitle="Candidate Applications">
      <div className="flex flex-col gap-6 font-sans">
        {/* Top Header & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Candidate Applications</h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Review, screen, shortlist, and manage candidate applications.
            </p>
          </div>

          {reqIdFilter && (
            <Button
              variant="outline"
              onClick={() => navigate("/applications")}
              className="h-10 border-gray-200 hover:bg-gray-50 text-xs font-semibold rounded-xl cursor-pointer"
            >
              <Users className="w-4 h-4 mr-1.5 text-gray-500" />
              <span>Clear Req ID Filter ({reqIdFilter})</span>
            </Button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="relative w-full md:w-80 flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                if (page !== 1) setPage(1)
                else loadApplications(e.target.value)
              }}
              placeholder="Search candidate, email, title, req ID..."
              className="pl-9 h-9 text-xs rounded-sm bg-gray-50 border-gray-200"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="w-[180px]">
              <Combobox
                options={STATUS_OPTIONS}
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val || "All")
                  if (page !== 1) setPage(1)
                  else loadApplications(undefined, val || "All")
                }}
                placeholder="Status: All"
                searchPlaceholder="Search status..."
                className="h-9 text-xs font-semibold bg-gray-50 border-gray-200 rounded-sm"
                allowCustom={false}
              />
            </div>

            <span className="text-xs text-gray-400 font-medium">
              Showing {applications.length} of {total} Applications
            </span>
          </div>
        </div>

        {/* Applications Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <Loader2 className="w-7 h-7 animate-spin text-[#FF7F50]" />
            <span className="text-xs font-bold uppercase tracking-wider">Loading applications...</span>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-sm border border-gray-200/80">
            <div className="mx-auto w-12 h-12 rounded-full bg-orange-50 text-[#FF7F50] flex items-center justify-center mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">No Applications Found</h2>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              There are no candidate applications matching your criteria.
              {reqIdFilter ? ` Clear the "${reqIdFilter}" req ID filter to see all applications.` : ""}
            </p>
            {reqIdFilter && (
              <Button
                onClick={() => navigate("/applications")}
                className="mt-5 h-9 bg-[#FF7F50] hover:bg-[#E56A3C] text-white font-bold text-xs rounded-sm px-4 cursor-pointer"
              >
                Clear Filter
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-sm border border-gray-200/80 overflow-visible min-h-[420px] flex flex-col justify-between">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50/80 text-gray-700 font-bold border-b border-gray-200/70">
                  <tr>
                    <th className="py-3.5 px-5">Candidate</th>
                    <th className="py-3.5 px-4">Position</th>
                    <th className="py-3.5 px-4">Experience</th>
                    <th className="py-3.5 px-4">Location</th>
                    <th className="py-3.5 px-4">Applied</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {applications.map((app) => (
                    <tr
                      key={app.id}
                      className="even:bg-gray-50/50 odd:bg-white hover:bg-orange-50/60 transition-colors"
                    >
                      {/* Candidate */}
                      <td className="py-4 px-5">
                        <div className="flex flex-col gap-0.5">
                          <Link
                            to={`/applications/${app.id}`}
                            className="font-bold text-gray-900 text-sm hover:text-[#FF7F50] transition-colors"
                          >
                            {app.fullName}
                          </Link>
                          <span className="text-[11px] text-gray-400 font-mono flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {app.email} • {app.id}
                          </span>
                        </div>
                      </td>

                      {/* Position */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-gray-800 font-semibold">{app.jobTitle}</span>
                          <span className="text-[11px] text-gray-400 font-mono">{app.reqId}</span>
                        </div>
                      </td>

                      {/* Experience */}
                      <td className="py-4 px-4 text-gray-700">
                        <div className="flex flex-col gap-0.5">
                          <span>{app.totalExperience} Yrs</span>
                          <span className="text-[11px] text-gray-400">{app.currentCompany || "—"}</span>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-4 px-4 text-gray-700">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          {app.currentLocation || "—"}
                        </span>
                      </td>

                      {/* Applied */}
                      <td className="py-4 px-4 text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {new Date(app.appliedAt).toLocaleDateString()}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <div className="relative inline-flex items-center">
                          <select
                            value={app.status}
                            disabled={updatingId === app.id}
                            onChange={(e) =>
                              handleStatusChange(
                                app,
                                e.target.value as CandidateApplicationRecord["status"]
                              )
                            }
                            className={`px-2.5 py-1 rounded-full font-bold text-[11px] whitespace-nowrap appearance-none cursor-pointer outline-none transition-all pr-6 border ${
                              app.status === "Hired"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : app.status === "Shortlisted"
                                ? "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100"
                                : app.status === "Interviewing"
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                                : app.status === "Rejected"
                                ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                                : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                            } ${updatingId === app.id ? "opacity-50 cursor-wait" : ""}`}
                          >
                            <option value="Under Review">Under Review</option>
                            <option value="Shortlisted">Shortlisted</option>
                            <option value="Interviewing">Interviewing</option>
                            <option value="Hired">Hired</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                          {updatingId === app.id ? (
                            <Loader2 className="w-3 h-3 animate-spin absolute right-2 pointer-events-none text-current" />
                          ) : (
                            <span className="absolute right-2 pointer-events-none text-[8px] opacity-60">▼</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end">
                          <Link
                            to={`/applications/${app.id}`}
                            className="px-3 py-1.5 bg-[#FF7F50] hover:bg-[#E56A3C] text-white font-bold text-[11px] rounded-sm flex items-center gap-1 transition-colors"
                            title="Open Full Profile"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-gray-200/80 bg-gray-50/50">
              <span className="text-[11px] text-gray-500 font-medium">
                Page {page} of {totalPages} • {total} total applications
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 px-3 text-xs border-gray-200 hover:bg-gray-100 cursor-pointer disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 px-3 text-xs border-gray-200 hover:bg-gray-100 cursor-pointer disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
