import { useState, useEffect } from "react"
import { MainLayout } from "@/layouts/main-layout"
import { useAuditLogger } from "@/hooks/use-audit-logger"
import {
  fetchAuditLogsFromDb,
  fetchAuditLogsPage,
  fetchAuditLogActorNames,
  fetchAuditLogStats,
  AUDIT_LOG_PAGE_SIZE,
  type AuditLogRecord,
  type AuditLogStats,
} from "@/services/audit-log-service"
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
  ShieldCheck,
  Clock,
  Globe,
  Download,
  Terminal,
  Copy,
  Check,
  Lock,
  Briefcase,
  Users,
  Key,
  ArrowRight,
  Eye,
  ChevronDown,
  ChevronUp,
  Table as TableIcon,
  SlidersHorizontal,
  UsersRound,
  RadioTower,
} from "lucide-react"

const CATEGORY_STYLES: Record<
  string,
  { badge: string; dot: string; icon: typeof Briefcase }
> = {
  Jobs: {
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
    icon: Briefcase,
  },
  Candidates: {
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
    icon: Users,
  },
  Users: {
    badge: "bg-indigo-50 text-indigo-800 border-indigo-200",
    dot: "bg-indigo-500",
    icon: Key,
  },
  Security: {
    badge: "bg-rose-50 text-rose-800 border-rose-200",
    dot: "bg-rose-500",
    icon: Lock,
  },
}

function CategoryBadge({ category }: { category: string }) {
  const style = CATEGORY_STYLES[category] ?? CATEGORY_STYLES.Jobs
  const Icon = style.icon
  return (
    <span
      className={`px-2.5 py-1 rounded-full font-bold text-[11px] inline-flex items-center gap-1.5 border shrink-0 ${style.badge}`}
    >
      <Icon className="w-3 h-3" />
      <span className="whitespace-nowrap">{category}</span>
    </span>
  )
}

function CopyIconButton({
  value,
  active,
  onCopy,
}: {
  value: string
  active: boolean
  onCopy: () => void
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        navigator.clipboard.writeText(value)
        onCopy()
      }}
      className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
      title="Copy to clipboard"
    >
      {active ? (
        <Check className="w-3 h-3 text-emerald-600" />
      ) : (
        <Copy className="w-3 h-3" />
      )}
    </button>
  )
}

export function ActivityLogPage() {
  const { logPageView } = useAuditLogger()
  const [logs, setLogs] = useState<AuditLogRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [viewMode, setViewMode] = useState<"table" | "console">("table")
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [selectedActor, setSelectedActor] = useState<string>("All")
  const [actorOptions, setActorOptions] = useState<string[]>([])
  const [stats, setStats] = useState<AuditLogStats>({
    total: 0,
    security: 0,
    actors: 0,
    last24h: 0,
  })
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)
  const [expandedConsoleId, setExpandedConsoleId] = useState<string | null>(null)

  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    logPageView("Audit Log Console")
  }, [logPageView])

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1)
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    fetchAuditLogActorNames().then((names) => setActorOptions(names))
    fetchAuditLogStats().then((s) => setStats(s))
  }, [])

  useEffect(() => {
    let active = true
    fetchAuditLogsPage(page, AUDIT_LOG_PAGE_SIZE, {
      search: debouncedSearch,
      category: selectedCategory,
      actor: selectedActor,
    })
      .then((result) => {
        if (!active) return
        setLogs(result.data)
        setTotalCount(result.total)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [page, debouncedSearch, selectedCategory, selectedActor])

  const flashCopied = (id: string) => {
    setCopiedId(id)
    setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1500)
  }

  const filteredLogs = logs

  const toggleExpandRow = (id: string) => {
    setExpandedRowId((prev) => (prev === id ? null : id))
  }

  const toggleConsoleRow = (id: string) => {
    setExpandedConsoleId((prev) => (prev === id ? null : id))
  }

  const handleExportCSV = async () => {
    const headers =
      "Audit ID,Timestamp,User,Email,Role,Category,Action,Target Entity,Details,IP Address,Location,Browser,OS\n"
    const q = debouncedSearch.trim().toLowerCase()
    const filtered = (await fetchAuditLogsFromDb()).filter((l) => {
      const matchesSearch =
        !q ||
        l.action.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        l.actor.name.toLowerCase().includes(q) ||
        l.actor.email.toLowerCase().includes(q) ||
        l.targetEntity.toLowerCase().includes(q) ||
        l.fingerprint.ipAddress.toLowerCase().includes(q) ||
        l.fingerprint.location.toLowerCase().includes(q)
      const matchesCategory =
        selectedCategory === "All" || l.category === selectedCategory
      const matchesActor =
        selectedActor === "All" || l.actor.name === selectedActor
      return matchesSearch && matchesCategory && matchesActor
    })

    const rows = filtered
      .map(
        (l) =>
          `"${l.id}","${l.timestamp}","${l.actor.name}","${l.actor.email}","${l.actor.role}","${l.category}","${l.action}","${l.targetEntity}","${l.details.replace(
            /"/g,
            '""'
          )}","${l.fingerprint.ipAddress}","${l.fingerprint.location}","${l.fingerprint.browser}","${l.fingerprint.os}"`
      )
      .join("\n")

    const blob = new Blob([headers + rows], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `Audit_Trail_Export_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const scrollbarClass =
    "[&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400"

  return (
    <MainLayout pageTitle="Audit Trail & System Activity">
      <div className="flex flex-col gap-6 font-sans w-full min-w-0 overflow-hidden">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              System Audit Trail
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              User action tracking, state diffs, and session telemetry across your workspace.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1 border border-gray-200">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "table"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("console")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "console"
                    ? "bg-[#0B192C] text-[#00FF66] shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Event Console</span>
              </button>
            </div>

            <Button
              variant="outline"
              onClick={handleExportCSV}
              className="h-10 border-gray-200 hover:bg-gray-50 text-xs font-semibold rounded-xl cursor-pointer"
            >
              <Download className="w-4 h-4 mr-1.5 text-gray-500" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total Events", value: stats.total, icon: TableIcon, tone: "text-gray-900" },
            { label: "Security Events", value: stats.security, icon: Lock, tone: "text-rose-700" },
            { label: "Active Users", value: stats.actors, icon: UsersRound, tone: "text-indigo-700" },
            { label: "Events (24h)", value: stats.last24h, icon: RadioTower, tone: "text-emerald-700" },
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

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80 flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user, action, IP, location..."
              className="pl-9 h-9 text-xs rounded-sm bg-gray-50 border-gray-200"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400 font-medium">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value)
                  setPage(1)
                }}
                className="h-9 px-3 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-sm outline-none cursor-pointer"
              >
                <option value="All">All Categories</option>
                <option value="Jobs">Jobs Management</option>
                <option value="Candidates">Candidates & Applications</option>
                <option value="Users">User & Access Rights</option>
                <option value="Security">Security & Verification</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400 font-medium">User:</span>
              <select
                value={selectedActor}
                onChange={(e) => {
                  setSelectedActor(e.target.value)
                  setPage(1)
                }}
                className="h-9 px-3 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-sm outline-none cursor-pointer"
              >
                <option value="All">All Team Members</option>
                {actorOptions.map((actor) => (
                  <option key={actor} value={actor}>
                    {actor}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-xs text-gray-400 font-medium">
              Showing {filteredLogs.length} Events (page {page})
            </span>
          </div>
        </div>

        {/* ===================== TABLE VIEW ===================== */}
        {viewMode === "table" && (
          <div className="bg-white rounded-sm border border-gray-200/80 shadow-2xs overflow-hidden w-full min-w-0">
            <div className={`hidden md:block max-h-[640px] min-h-[420px] overflow-x-auto overflow-y-auto w-full min-w-0 ${scrollbarClass}`}>
              <table className="w-full table-fixed text-left text-xs text-gray-600 min-w-[1050px]">
                <colgroup>
                  <col className="w-[20%]" />
                  <col className="w-[16%]" />
                  <col className="w-[14%]" />
                  <col className="w-[22%]" />
                  <col className="w-[14%]" />
                  <col className="w-[9%]" />
                  <col className="w-[5%]" />
                </colgroup>
                <thead className="sticky top-0 z-20 bg-gray-50/80 text-gray-700 font-bold border-b border-gray-200/70">
                  <tr>
                    <th className="py-3.5 px-5 whitespace-nowrap">
                      User Actor
                    </th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Action & Category</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Target Entity</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">State Mutations (Diff)</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Digital Fingerprint</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Timestamp</th>
                    <th className="py-3.5 px-5 text-right whitespace-nowrap">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        No audit records match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.flatMap((log) => {
                      const isExpanded = expandedRowId === log.id
                      const mainRow = (
                        <tr
                          key={log.id}
                          className="even:bg-gray-50/50 odd:bg-white hover:bg-orange-50/60 transition-colors cursor-pointer"
                          onClick={() => toggleExpandRow(log.id)}
                        >
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-sm bg-[#0B192C] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                {log.actor.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-bold text-gray-900 truncate" title={log.actor.name}>
                                  {log.actor.name}
                                </span>
                                <span
                                  className="text-[11px] text-gray-400 font-mono truncate"
                                  title={log.actor.email}
                                >
                                  {log.actor.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <CategoryBadge category={log.category} />
                            <div className="text-[11px] text-gray-500 font-semibold mt-1.5 truncate" title={log.action}>
                              {log.action}
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <span
                              className="font-mono text-[11px] text-gray-800 bg-gray-50 px-2 py-1 rounded border border-gray-200 font-semibold block w-fit max-w-full truncate"
                              title={log.targetEntity}
                            >
                              {log.targetEntity}
                            </span>
                          </td>

                          <td className="py-4 px-4">
                            {log.changes && log.changes.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {log.changes.slice(0, 2).map((c, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-1.5 text-[11px] min-w-0"
                                  >
                                    <span className="font-bold text-gray-700 font-mono shrink-0">
                                      {c.field}:
                                    </span>
                                    <span className="px-1 py-0.5 bg-rose-50 text-rose-700 rounded border border-rose-200 font-mono line-through truncate max-w-[180px]">
                                      {c.from}
                                    </span>
                                    <ArrowRight className="w-3 h-3 text-gray-400 shrink-0" />
                                    <span className="px-1 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded border border-emerald-200 font-mono truncate max-w-[180px]">
                                      {c.to}
                                    </span>
                                  </div>
                                ))}
                                {log.changes.length > 2 && (
                                  <span className="text-[10px] font-bold text-[#FF7F50]">
                                    +{log.changes.length - 2} more field{log.changes.length - 2 > 1 ? "s" : ""}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[11px] text-gray-400 italic">
                                No field mutation
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-4">
                            <div className="flex flex-col gap-1 min-w-0">
                              <div className="flex items-center gap-1 min-w-0">
                                <Globe className="w-3 h-3 text-[#FF7F50] shrink-0" />
                                <span className="font-mono text-[11px] text-gray-900 font-bold truncate">
                                  {log.fingerprint.ipAddress}
                                </span>
                                <CopyIconButton
                                  value={log.fingerprint.ipAddress}
                                  active={copiedId === `t-${log.id}`}
                                  onCopy={() => flashCopied(`t-${log.id}`)}
                                />
                              </div>
                              <span className="text-[11px] text-gray-500 truncate">
                                {log.fingerprint.browser} • {log.fingerprint.os}
                              </span>
                            </div>
                          </td>

                          <td className="py-4 px-4 font-mono text-[11px] text-gray-600 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-gray-400" />
                              {log.formattedTime}
                            </div>
                          </td>

                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedLog(log)
                                }}
                                className="p-1.5 text-gray-500 hover:text-[#0B192C] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                title="Inspect full telemetry payload"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleExpandRow(log.id)
                                }}
                                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg transition-colors cursor-pointer"
                                title="Toggle inline record details"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-[#FF7F50]" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )

                      const drawerRow = isExpanded ? (
                        <tr key={`${log.id}-drawer`} className="bg-slate-900">
                          <td colSpan={7} className="p-0">
                            <div className="text-slate-100 p-6 border-t-2 border-[#FF7F50] flex flex-col gap-4 font-mono text-xs shadow-inner">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                <span className="font-bold text-[#00FF66] flex items-center gap-2">
                                  <Terminal className="w-4 h-4" />
                                  RECORD {log.id} — {log.action}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setExpandedRowId(null)}
                                  className="text-slate-400 hover:text-white cursor-pointer"
                                >
                                  [Close]
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex flex-col gap-1 bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                                  <span className="text-[10px] uppercase font-bold text-slate-400">Identity & Role</span>
                                  <span className="text-white font-bold">{log.actor.name} ({log.actor.role})</span>
                                  <span className="text-slate-400 text-[11px]">{log.actor.email}</span>
                                </div>

                                <div className="flex flex-col gap-1 bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                                  <span className="text-[10px] uppercase font-bold text-slate-400">Network & Geo</span>
                                  <span className="text-emerald-400 font-bold">IP: {log.fingerprint.ipAddress}</span>
                                  <span className="text-slate-300 text-[11px]">{log.fingerprint.location}</span>
                                </div>

                                <div className="flex flex-col gap-1 bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                                  <span className="text-[10px] uppercase font-bold text-slate-400">Session & Resolution</span>
                                  <span className="text-orange-400 font-bold">{log.fingerprint.sessionId}</span>
                                  <span className="text-slate-300 text-[11px]">{log.fingerprint.screenResolution} ({log.fingerprint.timezone})</span>
                                </div>
                              </div>

                              <div className="flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] uppercase font-bold text-slate-400">Raw JSON Payload</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(JSON.stringify(log, null, 2))
                                      flashCopied(`json-${log.id}`)
                                    }}
                                    className="text-[10px] font-bold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                                  >
                                    {copiedId === `json-${log.id}` ? (
                                      <>
                                        <Check className="w-3 h-3 text-emerald-400" /> Copied
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" /> Copy JSON
                                      </>
                                    )}
                                  </button>
                                </div>
                                <pre className={`p-3 bg-slate-950 rounded-lg text-emerald-400 font-mono text-[11px] overflow-x-auto border border-slate-800 leading-relaxed max-h-72 overflow-y-auto ${scrollbarClass}`}>
                                  {JSON.stringify(log, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null

                      return [mainRow, drawerRow].filter(Boolean)
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARD VIEW */}
            <div className="block md:hidden divide-y divide-gray-100 min-h-[420px]">
              {filteredLogs.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs">
                  No audit records match your search criteria.
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const isExpanded = expandedRowId === log.id
                  return (
                    <div key={log.id} className="p-4 flex flex-col gap-3 hover:bg-gray-50/60 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-[#0B192C] text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {log.actor.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-gray-900 text-xs truncate">{log.actor.name}</div>
                            <div className="text-[11px] text-gray-400 font-mono truncate">{log.actor.email}</div>
                          </div>
                        </div>

                        <span className="text-[11px] font-mono text-gray-400 shrink-0">
                          {log.formattedTime}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <CategoryBadge category={log.category} />
                        <span className="font-mono text-[11px] text-gray-700 bg-gray-50 px-2 py-0.5 rounded border border-gray-200 font-semibold truncate max-w-full">
                          {log.targetEntity}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500 font-semibold">{log.action}</div>

                      {log.changes && log.changes.length > 0 && (
                        <div className="bg-gray-50/80 p-2.5 rounded-lg border border-gray-200/80 flex flex-col gap-1 text-[11px]">
                          <span className="font-bold text-gray-500 text-[10px] uppercase">State Mutation:</span>
                          {log.changes.map((c, idx) => (
                            <div key={idx} className="flex items-center gap-1 font-mono flex-wrap">
                              <span className="font-bold text-gray-700">{c.field}:</span>
                              <span className="line-through text-rose-600 bg-rose-50 px-1 rounded">{c.from}</span>
                              <ArrowRight className="w-3 h-3 text-gray-400" />
                              <span className="font-bold text-emerald-700 bg-emerald-50 px-1 rounded">{c.to}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-xs">
                        <span className="font-mono text-[11px] text-gray-600 flex items-center gap-1 truncate">
                          <Globe className="w-3 h-3 text-[#FF7F50] shrink-0" />
                          {log.fingerprint.ipAddress} ({log.fingerprint.os})
                        </span>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setSelectedLog(log)}
                            className="px-2 py-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg cursor-pointer flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleExpandRow(log.id)}
                            className="p-1 text-gray-400 hover:text-gray-700 rounded cursor-pointer"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-[#FF7F50]" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 flex flex-col gap-3 font-mono text-[11px] mt-2">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[#00FF66] font-bold">
                            <span>PAYLOAD #{log.id}</span>
                            <button onClick={() => setExpandedRowId(null)} className="text-slate-400 hover:text-white">
                              [Close]
                            </button>
                          </div>
                          <div>Role: <span className="text-white font-bold">{log.actor.role}</span></div>
                          <div>Browser: <span className="text-slate-300">{log.fingerprint.browser}</span></div>
                          <div>Location: <span className="text-emerald-400">{log.fingerprint.location}</span></div>
                          <pre className={`p-2 bg-slate-950 text-emerald-400 text-[10px] overflow-x-auto rounded border border-slate-800 max-h-56 overflow-y-auto ${scrollbarClass}`}>
                            {JSON.stringify(log, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {/* Pagination (10 records per page) */}
            <PaginationBar
              page={page}
              pageSize={AUDIT_LOG_PAGE_SIZE}
              total={totalCount}
              onPageChange={setPage}
            />
          </div>
        )}

        {/* ===================== EVENT CONSOLE VIEW (CloudTrail-style) ===================== */}
        {viewMode === "console" && (
          <>
          <div className="bg-[#0B1220] rounded-xl border border-slate-800 shadow-2xl overflow-hidden w-full min-w-0">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/60">
              <div className="flex items-center gap-2 text-[#00FF66] font-bold text-xs font-mono">
                <Terminal className="w-4 h-4" />
                <span>audit-stream — event history ({filteredLogs.length} of {totalCount.toLocaleString()} records)</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </div>
            </div>

            <div className={`flex flex-col divide-y divide-slate-800/80 max-h-[640px] min-h-[420px] overflow-y-auto ${scrollbarClass}`}>
              {filteredLogs.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-xs font-mono">
                  No events match your filters.
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const style = CATEGORY_STYLES[log.category] ?? CATEGORY_STYLES.Jobs
                  const isOpen = expandedConsoleId === log.id
                  return (
                    <div key={log.id} className="hover:bg-slate-900/50 transition-colors">
                      <button
                        type="button"
                        onClick={() => toggleConsoleRow(log.id)}
                        className="w-full text-left px-5 py-3.5 flex flex-col lg:flex-row lg:items-center gap-2.5 lg:gap-4 cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 lg:w-[210px] shrink-0 min-w-0">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
                          <span className="font-mono text-[11px] text-slate-400 whitespace-nowrap">
                            {log.formattedTime}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 lg:w-[260px] shrink-0 min-w-0">
                          <span className="font-mono text-xs font-bold text-white truncate">
                            {log.action}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 lg:w-[220px] shrink-0 min-w-0">
                          <span className="text-[11px] text-slate-300 truncate">
                            {log.actor.name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono truncate hidden xl:inline">
                            {log.actor.email}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="font-mono text-[11px] text-slate-400 bg-slate-800/70 px-2 py-0.5 rounded border border-slate-700/80 truncate">
                            {log.targetEntity}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 lg:w-[150px] shrink-0 justify-between lg:justify-end">
                          <span className="font-mono text-[11px] text-emerald-400/90">
                            {log.fingerprint.ipAddress}
                          </span>
                          {isOpen ? (
                            <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                          )}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-5">
                          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 flex flex-col gap-4 font-mono text-[11px]">
                            <p className="text-slate-300 font-sans text-xs leading-relaxed">
                              {log.details}
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] uppercase font-bold text-slate-500">Role</span>
                                <span className="text-slate-200">{log.actor.role}</span>
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] uppercase font-bold text-slate-500">Location</span>
                                <span className="text-slate-200">{log.fingerprint.location}</span>
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] uppercase font-bold text-slate-500">Browser / OS</span>
                                <span className="text-slate-200">{log.fingerprint.browser} • {log.fingerprint.os}</span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase font-bold text-slate-500">Raw Event JSON</span>
                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      navigator.clipboard.writeText(JSON.stringify(log, null, 2))
                                      flashCopied(`console-${log.id}`)
                                    }}
                                    className="text-[10px] font-bold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                                  >
                                    {copiedId === `console-${log.id}` ? (
                                      <>
                                        <Check className="w-3 h-3 text-emerald-400" /> Copied
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" /> Copy JSON
                                      </>
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedLog(log)
                                    }}
                                    className="text-[10px] font-bold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                                  >
                                    <Eye className="w-3 h-3" /> Fingerprint
                                  </button>
                                </div>
                              </div>
                              <pre className={`p-3 bg-black/60 rounded-lg text-emerald-400 overflow-x-auto border border-slate-800/80 leading-relaxed max-h-64 overflow-y-auto ${scrollbarClass}`}>
                                {JSON.stringify(log, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Pagination (10 records per page) */}
          <PaginationBar
            page={page}
            pageSize={AUDIT_LOG_PAGE_SIZE}
            total={totalCount}
            onPageChange={setPage}
          />
          </>
        )}
      </div>

      {/* Digital Fingerprint Telemetry Modal */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl p-6 bg-white rounded-2xl border border-gray-200 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF7F50] flex items-center justify-center shrink-0">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-extrabold text-gray-900">
                  Digital Fingerprint & Session Telemetry
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500 font-medium">
                  Hardware, credentials, and network payload for record <strong className="font-mono">{selectedLog?.id}</strong>.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedLog && (
            <div className="flex flex-col gap-5 mt-2">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                    User Actor Identity
                  </span>
                  <div className="font-extrabold text-gray-900 text-sm">
                    {selectedLog.actor.name} ({selectedLog.actor.role})
                  </div>
                  <div className="text-xs text-gray-500 font-mono">
                    {selectedLog.actor.email}
                  </div>
                </div>

                <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-right">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Session Key
                  </span>
                  <span className="font-mono text-xs text-[#FF7F50] font-bold">
                    {selectedLog.fingerprint.sessionId}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200/80 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    IP Address & Region
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono font-bold text-gray-900">
                      {selectedLog.fingerprint.ipAddress}
                    </span>
                    <CopyIconButton
                      value={selectedLog.fingerprint.ipAddress}
                      active={copiedId === `modal-${selectedLog.id}`}
                      onCopy={() => flashCopied(`modal-${selectedLog.id}`)}
                    />
                  </div>
                  <span className="text-gray-500 text-[11px]">
                    {selectedLog.fingerprint.location}
                  </span>
                </div>

                <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200/80 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Browser & OS Engine
                  </span>
                  <span className="font-bold text-gray-900">
                    {selectedLog.fingerprint.browser}
                  </span>
                  <span className="text-gray-500 text-[11px]">
                    {selectedLog.fingerprint.os}
                  </span>
                </div>

                <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200/80 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Device Hardware & Screen
                  </span>
                  <span className="font-semibold text-gray-800">
                    {selectedLog.fingerprint.deviceType}
                  </span>
                  <span className="text-gray-500 text-[11px] font-mono">
                    Screen: {selectedLog.fingerprint.screenResolution}
                  </span>
                </div>

                <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200/80 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Timezone & Locale
                  </span>
                  <span className="font-mono text-gray-800 font-semibold">
                    {selectedLog.fingerprint.timezone}
                  </span>
                  <span className="text-gray-500 text-[11px]">
                    Language: {selectedLog.fingerprint.language}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Raw Client User Agent String:
                </span>
                <div className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] leading-relaxed break-all select-all shadow-inner">
                  {selectedLog.fingerprint.userAgent}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}