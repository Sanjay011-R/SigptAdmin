import { useState, useEffect, useRef } from "react"
import { MainLayout } from "@/layouts/main-layout"
import { supabase } from "@/lib/supabase"
import { useAuditLogger } from "@/hooks/use-audit-logger"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { PaginationBar } from "@/components/ui/pagination"
import {
  Search,
  Clock,
  Reply,
  Calendar,
  Eye,
  SlidersHorizontal,
  Check,
  Copy,
  FileText,
  RadioTower,
  Inbox,
  RotateCw,
  AlertCircle,
  Terminal,
  ChevronDown,
  Building2,
  Phone,
  User,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
} from "lucide-react"

export interface ContactRequestItem {
  id: string
  created_at: string
  type: "meeting" | "corporate"
  name: string
  company: string
  designation: string
  email: string
  phone: string | null
  engineering_requirement: string | null
  brief_requirement: string | null
  preferred_date: string | null
  preferred_time: string | null
  area_of_interest: string | null
  message: string | null
  status: "New" | "Pending Response" | "Resolved"
}

const PAGE_SIZE = 10

// ================= CUSTOM PROFESSIONAL STATUS DROPDOWN =================
function StatusDropdown({
  value,
  onChange,
  direction = "down",
}: {
  value: "New" | "Pending Response" | "Resolved"
  onChange: (newStatus: "New" | "Pending Response" | "Resolved") => void
  direction?: "up" | "down"
}) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const STATUS_CONFIGS = {
    New: {
      badge: "bg-rose-50 text-rose-700 border-rose-200/80 hover:bg-rose-100/80",
      dot: "bg-rose-500",
      label: "New",
    },
    "Pending Response": {
      badge: "bg-amber-50 text-amber-800 border-amber-200/80 hover:bg-amber-100/80",
      dot: "bg-amber-500",
      label: "Pending Response",
    },
    Resolved: {
      badge: "bg-emerald-50 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100/80",
      dot: "bg-emerald-500",
      label: "Resolved",
    },
  }

  const currentConfig = STATUS_CONFIGS[value] || STATUS_CONFIGS.New

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((prev) => !prev)
        }}
        className={`px-3 py-1.5 rounded-full font-bold text-[11px] inline-flex items-center gap-1.5 border transition-all cursor-pointer shadow-2xs ${currentConfig.badge}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${currentConfig.dot}`} />
        <span className="whitespace-nowrap">{currentConfig.label}</span>
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className={`absolute left-0 z-[100] w-44 rounded-xl bg-white border border-gray-200 shadow-xl py-1 font-medium text-xs animate-in fade-in-0 zoom-in-95 duration-100 ${
            direction === "up" ? "bottom-full mb-2" : "top-full mt-1"
          }`}
        >
          {(["New", "Pending Response", "Resolved"] as const).map((st) => {
            const cfg = STATUS_CONFIGS[st]
            const isSelected = st === value
            return (
              <button
                key={st}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onChange(st)
                  setOpen(false)
                }}
                className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 hover:bg-gray-50 transition-colors cursor-pointer ${
                  isSelected ? "bg-gray-50/80 font-bold text-gray-900" : "text-gray-600"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                  <span>{st}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-gray-700" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function RequestsPage() {
  const { logPageView, logStateMutation } = useAuditLogger()
  const [requests, setRequests] = useState<ContactRequestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [selectedType, setSelectedType] = useState<string>("All")
  const [selectedStatus, setSelectedStatus] = useState<string>("All")
  const [page, setPage] = useState(1)
  const [selectedRequest, setSelectedRequest] = useState<ContactRequestItem | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchRequests = async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const { data, error } = await supabase
        .from("contact_requests")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[RequestsPage] Supabase query error:", error.message)
        setFetchError(error.message)
        setRequests([])
      } else {
        setRequests((data as ContactRequestItem[]) || [])
        setFetchError(null)
      }
    } catch (err: any) {
      console.error("[RequestsPage] Unexpected failure fetching requests:", err)
      setFetchError(err?.message || "Failed to fetch request records from Supabase.")
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    logPageView("Contact Requests")
    fetchRequests()
  }, [logPageView])

  const handleStatusChange = async (
    id: string,
    newStatus: "New" | "Pending Response" | "Resolved"
  ) => {
    const target = requests.find((r) => r.id === id)
    const oldStatus = target?.status || "New"

    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    )

    try {
      const { error } = await supabase
        .from("contact_requests")
        .update({ status: newStatus })
        .eq("id", id)

      if (error) {
        console.error("[RequestsPage] Failed to update status in Supabase:", error.message)
        fetchRequests()
      } else {
        await logStateMutation({
          category: "System",
          action: "Contact Request Status Updated",
          type: "update",
          targetEntity: `Request ${target?.name || id}`,
          details: `Updated request status for '${target?.name || id}' (${target?.company || ""}) from ${oldStatus} to ${newStatus}.`,
          changes: [{ field: "status", from: oldStatus, to: newStatus }],
        })
      }
    } catch (err) {
      console.error("[RequestsPage] Error updating status:", err)
      fetchRequests()
    }
  }

  const filteredRequests = requests.filter((req) => {
    const q = search.trim().toLowerCase()
    const matchesSearch =
      !q ||
      req.name.toLowerCase().includes(q) ||
      req.email.toLowerCase().includes(q) ||
      req.company.toLowerCase().includes(q) ||
      req.designation.toLowerCase().includes(q) ||
      (req.engineering_requirement || "").toLowerCase().includes(q) ||
      (req.area_of_interest || "").toLowerCase().includes(q) ||
      (req.brief_requirement || "").toLowerCase().includes(q) ||
      (req.message || "").toLowerCase().includes(q)

    const matchesType =
      selectedType === "All" ||
      (selectedType === "meeting" && req.type === "meeting") ||
      (selectedType === "corporate" && req.type === "corporate")

    const matchesStatus =
      selectedStatus === "All" || req.status === selectedStatus

    return matchesSearch && matchesType && matchesStatus
  })

  const totalCount = filteredRequests.length
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const currentPage = Math.min(Math.max(page, 1), Math.max(1, totalPages))
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  const stats = {
    total: requests.length,
    meetings: requests.filter((r) => r.type === "meeting").length,
    corporate: requests.filter((r) => r.type === "corporate").length,
    newCount: requests.filter((r) => r.status === "New").length,
  }

  const flashCopied = (id: string) => {
    setCopiedId(id)
    setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1500)
  }

  const scrollbarClass =
    "[&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400"

  return (
    <MainLayout pageTitle="Client Requests">
      <div className="flex flex-col gap-6 font-sans w-full min-w-0 overflow-hidden">
        {/* Top Header & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Client Requests &amp; Inquiries
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Real-time repository for meeting bookings and corporate profile requests.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={fetchRequests}
              disabled={loading}
              className="h-10 border-gray-200 hover:bg-gray-50 text-xs font-semibold rounded-xl cursor-pointer"
            >
              <RotateCw className={`w-4 h-4 mr-1.5 text-gray-500 ${loading ? "animate-spin text-[#FF7F50]" : ""}`} />
              <span>Refresh Data</span>
            </Button>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total Submissions", value: stats.total, icon: Inbox, tone: "text-gray-900" },
            { label: "Meeting Requests", value: stats.meetings, icon: Calendar, tone: "text-amber-700" },
            { label: "Corporate Profiles", value: stats.corporate, icon: FileText, tone: "text-indigo-700" },
            { label: "Action Needed (New)", value: stats.newCount, icon: RadioTower, tone: "text-rose-700" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-200/80 flex items-center justify-center shrink-0">
                <s.icon className={`w-4 h-4 ${s.tone}`} />
              </div>
              <div className="min-w-0">
                <div className={`text-lg font-extrabold leading-tight ${s.tone}`}>
                  {loading ? "—" : s.value.toLocaleString()}
                </div>
                <div className="text-[11px] font-semibold text-gray-400 truncate">
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Fetch Error Banner */}
        {fetchError && (
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center justify-between gap-3 text-xs text-rose-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Query Error: <strong>{fetchError}</strong></span>
            </div>
            <button
              onClick={fetchRequests}
              className="px-3 py-1 bg-rose-600 text-white font-bold text-xs rounded-lg hover:bg-rose-700 cursor-pointer shrink-0"
            >
              Retry Fetch
            </button>
          </div>
        )}

        {/* Search & Filter Bar */}
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
              placeholder="Search sender, email, company..."
              className="pl-9 h-9 text-xs rounded-sm bg-gray-50 border-gray-200"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400 font-medium">Type:</span>
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value)
                  setPage(1)
                }}
                className="h-9 px-3 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-sm outline-none cursor-pointer"
              >
                <option value="All">All Types</option>
                <option value="meeting">Meeting Request</option>
                <option value="corporate">Corporate Profile</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400 font-medium">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value)
                  setPage(1)
                }}
                className="h-9 px-3 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-sm outline-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="New">New</option>
                <option value="Pending Response">Pending Response</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <span className="text-xs text-gray-400 font-medium">
              Showing {paginatedRequests.length} Requests (page {currentPage})
            </span>
          </div>
        </div>

        {/* Table Records */}
        <div className="bg-white rounded-sm border border-gray-200/80 shadow-2xs overflow-hidden w-full min-w-0">
          <div className="hidden md:block overflow-x-auto w-full min-h-[420px]">
            <table className="w-full table-fixed text-left text-xs text-gray-600 min-w-[1050px]">
              <colgroup>
                <col className="w-[20%]" />
                <col className="w-[12%]" />
                <col className="w-[18%]" />
                <col className="w-[24%]" />
                <col className="w-[14%]" />
                <col className="w-[12%]" />
              </colgroup>
              <thead className="bg-gray-50/80 text-gray-700 font-bold border-b border-gray-200/70">
                <tr>
                  <th className="py-3.5 px-5 whitespace-nowrap">Client Name</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Request Type</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Company &amp; Contact</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Requirement / Details</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3.5 px-5 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-gray-400">
                      Loading request records...
                    </td>
                  </tr>
                ) : paginatedRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-gray-400">
                      No contact requests match your search criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedRequests.map((req) => (
                    <tr
                      key={req.id}
                      className="even:bg-gray-50/50 odd:bg-white hover:bg-orange-50/60 transition-colors cursor-pointer"
                      onClick={() => setSelectedRequest(req)}
                    >
                      {/* Client Name & Designation */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-sm bg-[#0B192C] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {req.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-gray-900 truncate" title={req.name}>
                              {req.name}
                            </span>
                            <span className="text-[11px] text-gray-400 font-medium truncate" title={req.designation}>
                              {req.designation}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Request Type */}
                      <td className="py-4 px-4">
                        <span
                          className={`font-semibold text-xs whitespace-nowrap ${
                            req.type === "meeting" ? "text-amber-800" : "text-indigo-800"
                          }`}
                        >
                          {req.type === "meeting" ? "Meeting Request" : "Corporate Profile"}
                        </span>
                      </td>

                      {/* Company & Contact */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="font-bold text-gray-800 truncate" title={req.company}>
                            {req.company}
                          </span>
                          <span className="font-mono text-[11px] text-gray-400 truncate" title={req.email}>
                            {req.email}
                          </span>
                          {req.phone && (
                            <span className="font-mono text-[10px] text-gray-400 truncate">
                              {req.phone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Requirement / Area of Interest / Slot */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1 min-w-0">
                          {req.type === "meeting" ? (
                            <>
                              {req.engineering_requirement && (
                                <span className="font-bold text-xs text-gray-900 truncate" title={req.engineering_requirement}>
                                  {req.engineering_requirement}
                                </span>
                              )}
                              {req.brief_requirement && (
                                <span className="text-[11px] text-gray-500 truncate" title={req.brief_requirement}>
                                  "{req.brief_requirement}"
                                </span>
                              )}
                              {(req.preferred_date || req.preferred_time) && (
                                <span className="text-[10px] font-mono font-medium text-amber-800 truncate">
                                  Slot: {req.preferred_date} • {req.preferred_time}
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              {req.area_of_interest && (
                                <span className="font-bold text-xs text-gray-900 truncate" title={req.area_of_interest}>
                                  {req.area_of_interest}
                                </span>
                              )}
                              {req.message && (
                                <span className="text-[11px] text-gray-500 truncate" title={req.message}>
                                  "{req.message}"
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>

                      {/* Custom Professional Status Dropdown */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <StatusDropdown
                          value={req.status}
                          onChange={(newStatus) => handleStatusChange(req.id, newStatus)}
                        />
                      </td>

                      {/* Received At */}
                      <td className="py-4 px-4 font-mono text-[11px] text-gray-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>
                            {new Date(req.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                            {", "}
                            {new Date(req.created_at).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedRequest(req)}
                            className="p-1.5 text-gray-500 hover:text-[#0B192C] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            title="Inspect full details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <a
                            href={`mailto:${req.email}?subject=Re: ${
                              req.type === "meeting" ? "Meeting Request" : "Corporate Profile Request"
                            } - SI-GPT`}
                            className="p-1.5 text-gray-400 hover:text-[#FF7F50] hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                            title="Reply via Email"
                          >
                            <Reply className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARD VIEW (< md) */}
          <div className="block md:hidden divide-y divide-gray-100 min-h-[420px]">
            {loading ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                Loading request records...
              </div>
            ) : paginatedRequests.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                No contact requests match your search criteria.
              </div>
            ) : (
              paginatedRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 flex flex-col gap-3 hover:bg-gray-50/60 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#0B192C] text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {req.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900 text-xs truncate">{req.name}</div>
                        <div className="text-[11px] text-gray-400 truncate">{req.designation} • {req.company}</div>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase border shrink-0 ${
                        req.type === "meeting"
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-indigo-50 text-indigo-800 border-indigo-200"
                      }`}
                    >
                      {req.type === "meeting" ? "Meeting" : "Corporate"}
                    </span>
                  </div>

                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200/80 text-xs flex flex-col gap-1">
                    {req.type === "meeting" ? (
                      <>
                        <div className="font-bold text-gray-800">{req.engineering_requirement}</div>
                        <div className="text-gray-600 text-[11px]">"{req.brief_requirement}"</div>
                        {(req.preferred_date || req.preferred_time) && (
                          <div className="text-[10px] font-mono text-amber-800 font-bold">
                            Slot: {req.preferred_date} at {req.preferred_time}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="font-bold text-gray-800">{req.area_of_interest}</div>
                        <div className="text-gray-600 text-[11px]">"{req.message}"</div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <StatusDropdown
                      value={req.status}
                      onChange={(newStatus) => handleStatusChange(req.id, newStatus)}
                    />

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedRequest(req)}
                        className="px-2.5 py-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg cursor-pointer flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>

                      <a
                        href={`mailto:${req.email}?subject=Re: ${req.type === "meeting" ? "Meeting Request" : "Corporate Profile Request"}`}
                        className="p-1.5 text-gray-400 hover:text-[#FF7F50] rounded cursor-pointer"
                        title="Reply via Email"
                      >
                        <Reply className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          <PaginationBar
            page={currentPage}
            pageSize={PAGE_SIZE}
            total={totalCount}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* ================= HIGH-END SPACIOUS INSPECT DETAIL DIALOG ================= */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="sm:max-w-3xl lg:max-w-4xl p-7 bg-white rounded-3xl border border-gray-200/90 shadow-2xl overflow-hidden font-sans">
          <DialogHeader className="pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-[#0B192C] text-[#FF7F50] flex items-center justify-center shrink-0 shadow-md">
                <Inbox className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                  <span>Client Request Details</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500 font-medium mt-0.5">
                  Comprehensive payload and client contact submission details.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedRequest && (
            <div className="flex flex-col gap-6 pt-2 font-sans">
              {/* HERO BANNER: Client Avatar, Identity & Type */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-[#0B192C] to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg border border-slate-800">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-14 h-14 rounded-2xl bg-[#FF7F50] text-white font-extrabold text-lg flex items-center justify-center shrink-0 shadow-md">
                    {selectedRequest.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-extrabold text-white tracking-tight">
                        {selectedRequest.name}
                      </h2>
                      <span className="text-xs font-medium text-slate-300">
                        ({selectedRequest.designation})
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-300 mt-1 flex-wrap">
                      <span className="font-semibold text-orange-400">{selectedRequest.company}</span>
                      <span>•</span>
                      <span className="font-mono text-slate-300 flex items-center gap-1">
                        {selectedRequest.email}
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedRequest.email)
                            flashCopied(`email-${selectedRequest.id}`)
                          }}
                          className="text-slate-400 hover:text-white cursor-pointer ml-1"
                          title="Copy Email"
                        >
                          {copiedId === `email-${selectedRequest.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span
                    className={`font-extrabold text-sm ${
                      selectedRequest.type === "meeting" ? "text-amber-400" : "text-indigo-400"
                    }`}
                  >
                    {selectedRequest.type === "meeting" ? "Meeting Request" : "Corporate Profile"}
                  </span>
                </div>
              </div>

              {/* 3-COLUMN METRICS & DETAILS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Company / Organization
                  </span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {selectedRequest.company}
                  </span>
                  <span className="text-slate-500 text-[11px]">{selectedRequest.designation}</span>
                </div>

                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Direct Phone Contact
                  </span>
                  <span className="font-mono font-extrabold text-slate-900 text-sm">
                    {selectedRequest.phone || "Not provided"}
                  </span>
                  <span className="text-slate-500 text-[11px] font-mono">{selectedRequest.email}</span>
                </div>

                {selectedRequest.type === "meeting" ? (
                  <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                      Scheduled Time Slot
                    </span>
                    <span className="font-mono font-extrabold text-amber-950 text-sm">
                      {selectedRequest.preferred_date || "N/A"}
                    </span>
                    <span className="text-amber-800 font-mono font-semibold text-[11px]">
                      Time: {selectedRequest.preferred_time || "N/A"}
                    </span>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">
                      Area of Focus
                    </span>
                    <span className="font-extrabold text-indigo-950 text-sm truncate">
                      {selectedRequest.area_of_interest || "N/A"}
                    </span>
                    <span className="text-indigo-800 text-[11px]">Corporate Capability Request</span>
                  </div>
                )}
              </div>

              {/* ENGINEERING REQUIREMENT OR AREA OF INTEREST DEEP-DIVE */}
              {selectedRequest.type === "meeting" && selectedRequest.engineering_requirement && (
                <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Target Engineering Requirement
                    </span>
                    <span className="font-extrabold text-white text-sm font-mono">
                      {selectedRequest.engineering_requirement}
                    </span>
                  </div>
                </div>
              )}

              {/* REQUIREMENT DESCRIPTION / CLIENT MESSAGE */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Requirement Description / Client Message:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const msg =
                        selectedRequest.type === "meeting"
                          ? selectedRequest.brief_requirement || ""
                          : selectedRequest.message || ""
                      navigator.clipboard.writeText(msg)
                      flashCopied(`msg-${selectedRequest.id}`)
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === `msg-${selectedRequest.id}` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>Copy Message</span>
                  </button>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 text-slate-700 text-xs leading-relaxed font-sans shadow-inner">
                      {selectedRequest.type === "meeting"
                        ? selectedRequest.brief_requirement || "No brief requirement details provided."
                        : selectedRequest.message || "No additional message provided."}
                    </div>
                  </div>

                  {/* FOOTER ACTION BAR */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-200/80">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-medium">Update Request Status:</span>
                      <StatusDropdown
                        value={selectedRequest.status}
                        onChange={(newStatus) => {
                          handleStatusChange(selectedRequest.id, newStatus)
                          setSelectedRequest((prev) => (prev ? { ...prev, status: newStatus } : null))
                        }}
                        direction="up"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <a
                        href={`mailto:${selectedRequest.email}?subject=Re: ${
                          selectedRequest.type === "meeting" ? "Meeting Request" : "Corporate Profile Request"
                        } - SI-GPT`}
                        className="px-5 py-2.5 bg-[#0B192C] hover:bg-[#152844] text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-md hover:shadow-lg"
                      >
                        <Reply className="w-4 h-4 text-[#FF7F50]" />
                        <span>Reply to Client via Email</span>
                      </a>
                    </div>
                  </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}
