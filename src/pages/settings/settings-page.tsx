import { useState, useEffect } from "react"
import { MainLayout } from "@/layouts/main-layout"
import { supabase } from "@/lib/supabase"
import { useAuditLogger } from "@/hooks/use-audit-logger"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Briefcase,
  Users,
  MessageSquare,
  FolderKanban,
  Save,
  CheckCircle2,
  Trash2,
  RotateCw,
  AlertCircle,
  Loader2,
  Database,
  Barcode,
  Hash,
  Sparkles,
  Pencil,
  ShieldCheck,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { executeSystemAutoPurge, type AutoPurgeResult } from "@/services/auto-purge-service"

const sequencePaddingOptions: ComboboxOption[] = [
  { value: "3 digits (001)", label: "3 Digits (001)" },
  { value: "4 digits (0001)", label: "4 Digits (0001)" },
  { value: "5 digits (00001)", label: "5 Digits (00001)" },
]

const candidateRetentionOptions: ComboboxOption[] = [
  { value: "never", label: "Never Delete (Keep Indefinitely)" },
  { value: "90 days", label: "90 Days (3 Months)" },
  { value: "180 days", label: "180 Days (6 Months — Recommended PII Compliance)" },
  { value: "365 days", label: "365 Days (1 Year)" },
]

const auditRetentionOptions: ComboboxOption[] = [
  { value: "never", label: "Never Delete (Keep Indefinitely)" },
  { value: "30 days", label: "30 Days (1 Month)" },
  { value: "45 days", label: "45 Days (Recommended Default)" },
  { value: "60 days", label: "60 Days (2 Months)" },
  { value: "90 days", label: "90 Days (3 Months)" },
  { value: "180 days", label: "180 Days (6 Months)" },
  { value: "365 days", label: "365 Days (1 Year)" },
]

export function SettingsPage() {
  const { logPageView, logStateMutation } = useAuditLogger()
  const [activeTab, setActiveTab] = useState<
    "sequences" | "candidates" | "requests" | "audit"
  >("sequences")

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Job ID Identifier Format Pattern (SIGPT-[DOMAIN]-[YEAR]-[SEQUENCE])
  const [jobIdPrefix, setJobIdPrefix] = useState("SIGPT")
  const [jobIdDomain, setJobIdDomain] = useState("ENG")
  const [jobIdSeqPadding, setJobIdSeqPadding] = useState("3 digits (001)")

  // Domain Isolated Sequences State
  const [domainSequences, setDomainSequences] = useState<
    Array<{ domain_code: string; current_sequence: number }>
  >([
    { domain_code: "ENG", current_sequence: 0 },
    { domain_code: "HR", current_sequence: 0 },
    { domain_code: "MKT", current_sequence: 0 },
    { domain_code: "TECH", current_sequence: 0 },
    { domain_code: "SALES", current_sequence: 0 },
  ])
  const [newDomainCode, setNewDomainCode] = useState("")

  const handleAddDomainCode = async () => {
    if (!newDomainCode.trim()) return
    const code = newDomainCode.trim().toUpperCase()
    if (domainSequences.some((d) => d.domain_code === code)) {
      setNewDomainCode("")
      return
    }

    const updated = [...domainSequences, { domain_code: code, current_sequence: 0 }]
    setDomainSequences(updated)
    setNewDomainCode("")

    try {
      await supabase.from("job_domain_sequences").upsert({
        domain_code: code,
        year: new Date().getFullYear(),
        current_sequence: 0,
      })

      await logStateMutation({
        category: "System",
        action: "Domain Sequence Added",
        type: "create",
        targetEntity: `Domain ${code}`,
        details: `Added new domain sequence code '${code}'.`,
      })
    } catch {}
  }

  // Domain Edit & Delete State & Handlers
  const [editingDomain, setEditingDomain] = useState<{
    oldCode: string
    domain_code: string
    current_sequence: number
  } | null>(null)
  const [editError, setEditError] = useState<string | null>(null)

  const handleDeleteDomain = async (code: string) => {
    if (!window.confirm(`Are you sure you want to delete domain sequence "${code}"?`)) return

    setDomainSequences((prev) => prev.filter((d) => d.domain_code !== code))

    try {
      await supabase
        .from("job_domain_sequences")
        .delete()
        .eq("domain_code", code)
        .eq("year", new Date().getFullYear())

      await logStateMutation({
        category: "System",
        action: "Domain Sequence Deleted",
        type: "delete",
        targetEntity: `Domain ${code}`,
        details: `Deleted domain sequence '${code}' for year ${new Date().getFullYear()}.`,
      })
    } catch (err) {
      console.error("[SettingsPage] Error deleting domain sequence:", err)
    }
  }

  const handleSaveEditDomain = async () => {
    if (!editingDomain) return
    const newCode = editingDomain.domain_code.trim().toUpperCase()
    const oldCode = editingDomain.oldCode
    const newSeq = Math.max(0, Number(editingDomain.current_sequence) || 0)

    if (!newCode) {
      setEditError("Domain code cannot be empty.")
      return
    }

    if (newCode !== oldCode && domainSequences.some((d) => d.domain_code === newCode)) {
      setEditError(`Domain code "${newCode}" already exists.`)
      return
    }

    const currentYear = new Date().getFullYear()

    setDomainSequences((prev) =>
      prev.map((d) =>
        d.domain_code === oldCode
          ? { domain_code: newCode, current_sequence: newSeq }
          : d
      )
    )

    try {
      if (newCode !== oldCode) {
        await supabase
          .from("job_domain_sequences")
          .delete()
          .eq("domain_code", oldCode)
          .eq("year", currentYear)

        await supabase.from("job_domain_sequences").upsert({
          domain_code: newCode,
          domain_name: newCode,
          year: currentYear,
          current_sequence: newSeq,
          updated_at: new Date().toISOString(),
        })
      } else {
        await supabase.from("job_domain_sequences").upsert({
          domain_code: newCode,
          year: currentYear,
          current_sequence: newSeq,
          updated_at: new Date().toISOString(),
        })
      }

      await logStateMutation({
        category: "System",
        action: "Domain Sequence Updated",
        type: "update",
        targetEntity: `Domain ${newCode}`,
        details: `Updated domain sequence for '${oldCode}' -> code: '${newCode}', sequence: #${newSeq}.`,
      })

      setEditingDomain(null)
      setEditError(null)
    } catch (err: any) {
      console.error("[SettingsPage] Error saving domain sequence:", err)
      setEditError(err?.message || "Failed to update domain sequence.")
    }
  }

  // Candidate Settings State
  const [candidatePurgeRetention, setCandidatePurgeRetention] = useState("180 days")
  const [autoDeleteCandidateData, setAutoDeleteCandidateData] = useState(true)
  const [maxResumeSize, setMaxResumeSize] = useState("10")
  const [allowedFormats, setAllowedFormats] = useState("PDF, DOCX")

  const [pipelineStages, setPipelineStages] = useState(
    "New Application, Screening, Technical Interview, HR Round, Offer Issued, Hired"
  )

  // Requests Settings State
  const [purgeDays, setPurgeDays] = useState("365")
  const [defaultSlotDuration, setDefaultSlotDuration] = useState("30 mins")


  // Projects & Audit Settings State
  const [projectVisibility, setProjectVisibility] = useState("Internal Team")
  const [auditLogRetention, setAuditLogRetention] = useState("45 days")
  const [autoDeleteAuditLogs, setAutoDeleteAuditLogs] = useState(true)
  const [enforce2FA, setEnforce2FA] = useState(false)

  const [savedSuccess, setSavedSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [purging, setPurging] = useState(false)
  const [purgeResult, setPurgeResult] = useState<AutoPurgeResult | null>(null)

  const handleRunAutoPurge = async () => {
    setPurging(true)
    setPurgeResult(null)
    setErrorMessage(null)
    try {
      const res = await executeSystemAutoPurge()
      setPurgeResult(res)
      await logStateMutation({
        category: "System",
        action: "System Auto-Purge Executed",
        type: "delete",
        targetEntity: "Database Retention Rules",
        details: `Purged database records: ${res.applicationsDeleted} candidate applications purged, ${res.requestsDeleted} old requests purged, ${res.auditLogsDeleted} audit logs & view clutter purged.`,
      })
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to execute auto-purge.")
    } finally {
      setPurging(false)
    }
  }

  // Fetch settings from Supabase DB
  const fetchSettingsFromDb = async () => {
    setLoading(true)
    setErrorMessage(null)
    try {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("*")
        .eq("id", "default")
        .maybeSingle()

      if (error) {
        console.warn("[SettingsPage] Supabase settings query warning:", error.message)
      }

      if (data) {
        setJobIdPrefix(data.job_id_prefix || "SIGPT")
        setJobIdDomain(data.job_id_domain || "ENG")
        setJobIdSeqPadding(data.job_id_seq_padding || "3 digits (001)")

        setCandidatePurgeRetention(data.candidate_purge_retention || "180 days")
        setAutoDeleteCandidateData(data.auto_delete_candidate_data ?? true)
        setMaxResumeSize(String(data.max_resume_size ?? 10))
        setAllowedFormats(data.allowed_formats || "PDF, DOCX")



        setPurgeDays(String(data.request_purge_days ?? 365))
        setDefaultSlotDuration(data.default_slot_duration || "30 mins")


        setProjectVisibility(data.project_visibility || "Internal Team")
        setAuditLogRetention(data.audit_log_retention || "45 days")
        setAutoDeleteAuditLogs(data.auto_delete_audit_logs ?? true)
        setEnforce2FA(data.enforce_2fa ?? false)
      }

      // Fetch domain sequence counters
      try {
        const { data: seqData } = await supabase
          .from("job_domain_sequences")
          .select("domain_code, current_sequence")
          .eq("year", new Date().getFullYear())

        if (seqData && seqData.length > 0) {
          setDomainSequences(seqData)
        }
      } catch {}
    } catch (err: any) {
      console.error("[SettingsPage] Failed to load settings from Supabase:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    logPageView("Settings")
    fetchSettingsFromDb()
  }, [logPageView])

  // Save Settings to Supabase DB
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSavedSuccess(false)
    setErrorMessage(null)

    const payload = {
      id: "default",
      job_id_prefix: jobIdPrefix,
      job_id_domain: jobIdDomain,
      job_id_seq_padding: jobIdSeqPadding,

      candidate_purge_retention: candidatePurgeRetention,
      auto_delete_candidate_data: autoDeleteCandidateData,
      max_resume_size: parseInt(maxResumeSize, 10) || 10,
      allowed_formats: allowedFormats,



      request_purge_days: parseInt(purgeDays, 10) || 365,
      default_slot_duration: defaultSlotDuration,


      project_visibility: projectVisibility,
      audit_log_retention: auditLogRetention,
      auto_delete_audit_logs: autoDeleteAuditLogs,
      enforce_2fa: enforce2FA,
      updated_at: new Date().toISOString(),
    }

    try {
      const { error } = await supabase.from("platform_settings").upsert(payload)

      if (error) {
        console.error("[SettingsPage] Save settings DB error:", error)
        setErrorMessage(
          `Save Notice: ${error.message}.`
        )
      } else {
        await logStateMutation({
          category: "System",
          action: "Platform Settings Saved",
          type: "update",
          targetEntity: "Platform Settings",
          details: "Updated platform settings and system configuration.",
        })
      }

      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 4000)
    } catch (err: any) {
      console.error("[SettingsPage] Save settings exception:", err)
      setErrorMessage(err?.message || "Failed to save settings.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <MainLayout pageTitle="Settings">
      <div className="flex flex-col gap-6 font-sans w-full max-w-6xl mx-auto pb-12">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">System Settings</h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Configure identifier sequences, application retentions, and request rules.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              type="button"
              variant="outline"
              onClick={handleRunAutoPurge}
              disabled={purging || saving}
              className="h-10 px-4 border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-2xs"
              title="Execute auto-purge deletion rules immediately based on active thresholds"
            >
              {purging ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#FF7F50]" />
              ) : (
                <Trash2 className="w-4 h-4 text-gray-500" />
              )}
              <span>{purging ? "Running Purge..." : "Run Cleanup Now"}</span>
            </Button>

            <Button
              type="submit"
              form="settings-form"
              onClick={handleSaveSettings}
              disabled={saving || purging}
              className="h-10 px-6 bg-[#FF7F50] hover:bg-[#E56A3C] text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-xs"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saving ? "Saving..." : "Save System Settings"}</span>
            </Button>
          </div>
        </div>

        {/* Purge Result Notification Banner */}
        {purgeResult && (
          <div className="bg-sky-50 border border-sky-200 text-sky-950 p-4 rounded-xl flex items-center justify-between gap-3 text-xs font-semibold animate-in fade-in-0 duration-200">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-sky-600 shrink-0" />
              <span>
                Auto-Purge Executed: <strong>{purgeResult.applicationsDeleted}</strong> candidate applications purged,{" "}
                <strong>{purgeResult.requestsDeleted}</strong> requests purged,{" "}
                <strong>{purgeResult.auditLogsDeleted}</strong> audit logs purged.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPurgeResult(null)}
              className="text-sky-700 hover:text-sky-900 text-xs font-bold underline cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Saved Success Notification Banner */}
        {savedSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3 text-xs font-semibold animate-in fade-in-0 duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>System configurations saved and synchronized successfully.</span>
          </div>
        )}

        {errorMessage && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl flex items-center gap-3 text-xs font-semibold">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* CONFIGURATION TABS NAVIGATION */}
        <div className="bg-white p-1.5 rounded-2xl border border-gray-200/80 shadow-2xs flex items-center gap-1 overflow-x-auto">
          {[
            { id: "sequences", label: "Job ID & Sequences", icon: Barcode },
            { id: "candidates", label: "Candidates & Applications", icon: Users },
            { id: "requests", label: "Client Requests", icon: MessageSquare },
            { id: "audit", label: "Audit Logs & Retention", icon: ShieldCheck },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[#0B192C] text-white shadow-xs"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-[#FF7F50]" : "text-gray-400"}`} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* TAB CONTENT CARDS */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs flex flex-col gap-6">

          {/* TAB 2: DEDICATED JOB ID & SEQUENCES CONFIGURATION */}
          {activeTab === "sequences" && (
            <div className="flex flex-col gap-6 text-xs font-medium">
              <div className="pb-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-[#0B192C]">
                    Job ID Identifier Format &amp; Domain Sequence Counters
                  </h3>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    Configure custom prefix formats, domain department codes, sequence paddings, and live domain counters.
                  </p>
                </div>
                <span className="text-xs font-mono text-gray-600 bg-gray-50 px-3 py-1 rounded-lg border border-gray-200 font-bold shadow-2xs">
                  Pattern: SIGPT-[DOMAIN]-[YEAR]-[SEQUENCE]
                </span>
              </div>

              {/* CLEAN SINGLE-HEADER JOB ID CONFIGURATOR CARD */}
              <div className="p-5 bg-gray-50/50 rounded-2xl border border-gray-200/80 flex flex-col gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-gray-700">Prefix Identifier</label>
                    <Input
                      type="text"
                      value={jobIdPrefix}
                      onChange={(e) => setJobIdPrefix(e.target.value.toUpperCase())}
                      placeholder="SIGPT"
                      className="h-10 text-xs font-mono font-bold bg-white border-gray-200 text-gray-900 uppercase focus:border-[#0B192C]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-gray-700">Default Domain Code</label>
                    <Input
                      type="text"
                      value={jobIdDomain}
                      onChange={(e) => setJobIdDomain(e.target.value.toUpperCase())}
                      placeholder="ENG"
                      className="h-10 text-xs font-mono font-bold bg-white border-gray-200 text-gray-900 uppercase focus:border-[#0B192C]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-gray-700">Sequence Padding</label>
                    <Combobox
                      options={sequencePaddingOptions}
                      value={jobIdSeqPadding}
                      onValueChange={(val) => setJobIdSeqPadding(val)}
                      allowCustom={false}
                      placeholder="Select sequence padding..."
                      searchPlaceholder="Search padding..."
                      className="h-10 text-xs font-bold rounded-xl bg-white border-gray-200 shadow-2xs font-mono"
                      popoverClassName="min-w-[240px] rounded-2xl"
                    />
                  </div>
                </div>

                <div className="py-2.5 px-3 bg-white rounded-xl border border-gray-200/80 flex items-center justify-between gap-3 text-xs flex-wrap">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                      Active Primary Sample Job ID:
                    </span>
                    <span className="font-mono font-extrabold text-[#0B192C] tracking-wider text-xs">
                      {jobIdPrefix || "SIGPT"}-{jobIdDomain || "ENG"}-{new Date().getFullYear()}-
                      {jobIdSeqPadding.includes("4")
                        ? "0001"
                        : jobIdSeqPadding.includes("5")
                        ? "00001"
                        : "001"}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-gray-400">
                    Auto-generated on new job creation
                  </span>
                </div>

                {/* MULTI-DOMAIN ISOLATED SEQUENCE COUNTERS */}
                <div className="flex flex-col gap-3.5 pt-3 border-t border-gray-200/80">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-[#0B192C]">
                      Independent Domain Sequence Counters (Year {new Date().getFullYear()})
                    </span>
                    <span className="text-[11px] text-gray-500 font-medium">
                      Each domain tracks sequence starting from 001 independently
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {domainSequences.map((seq) => {
                      const nextSeqNum = (seq.current_sequence || 0) + 1
                      const formattedSeq = jobIdSeqPadding.includes("4")
                        ? String(nextSeqNum).padStart(4, "0")
                        : jobIdSeqPadding.includes("5")
                        ? String(nextSeqNum).padStart(5, "0")
                        : String(nextSeqNum).padStart(3, "0")
                      const sampleId = `${jobIdPrefix || "SIGPT"}-${seq.domain_code}-${new Date().getFullYear()}-${formattedSeq}`

                      return (
                        <div
                          key={seq.domain_code}
                          className="p-3.5 bg-white rounded-xl border border-gray-200/80 flex flex-col gap-1.5 shadow-2xs hover:border-gray-300 transition-all group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-[#FF7F50] font-mono">
                              {seq.domain_code}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-gray-500 font-mono font-medium mr-0.5">
                                Current: #{seq.current_sequence || 0}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditError(null)
                                  setEditingDomain({
                                    oldCode: seq.domain_code,
                                    domain_code: seq.domain_code,
                                    current_sequence: seq.current_sequence || 0,
                                  })
                                }}
                                className="p-1 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                                title={`Edit ${seq.domain_code}`}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteDomain(seq.domain_code)}
                                className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                title={`Delete ${seq.domain_code}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="flex flex-col pt-0.5">
                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                              Next Job ID:
                            </span>
                            <span className="font-mono text-xs font-extrabold text-[#0B192C]">
                              {sampleId}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Add Custom Domain Code Input */}
                  <div className="flex items-center gap-2 pt-2 flex-wrap">
                    <Input
                      type="text"
                      value={newDomainCode}
                      onChange={(e) => setNewDomainCode(e.target.value.toUpperCase())}
                      placeholder="Add domain code (e.g. FIN, OPS)"
                      className="h-10 text-xs font-mono font-bold bg-white border-gray-200 text-gray-900 uppercase max-w-xs focus:border-[#0B192C]"
                    />
                    <Button
                      type="button"
                      onClick={handleAddDomainCode}
                      className="h-10 px-4 bg-[#0B192C] hover:bg-[#152844] text-white font-bold text-xs rounded-xl cursor-pointer shadow-2xs"
                    >
                      + Add Domain Code
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CANDIDATES & APPLICATIONS SETTINGS */}
          {activeTab === "candidates" && (
            <div className="flex flex-col gap-5 text-xs font-medium">
              <div className="pb-3 border-b border-gray-100">
                <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#FF7F50]" />
                  <span>Candidate Data Retentions &amp; Auto-Delete (6 Months Rule)</span>
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Set candidate PII data retention thresholds, resume upload limits, and hiring pipeline stages.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Candidate Data Retention Period</label>
                  <Combobox
                    options={candidateRetentionOptions}
                    value={candidatePurgeRetention}
                    onValueChange={(val) => setCandidatePurgeRetention(val)}
                    allowCustom={false}
                    placeholder="Select candidate retention..."
                    searchPlaceholder="Search retention threshold..."
                    className="h-10 text-xs font-bold rounded-xl bg-gray-50 border-gray-200 shadow-2xs"
                    popoverClassName="min-w-[320px] rounded-2xl"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Max Resume Upload Size (MB)</label>
                  <Input
                    type="number"
                    value={maxResumeSize}
                    onChange={(e) => setMaxResumeSize(e.target.value)}
                    className="h-10 text-xs rounded-xl bg-gray-50 border-gray-200 font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700">Allowed Resume File Formats</label>
                <Input
                  type="text"
                  value={allowedFormats}
                  onChange={(e) => setAllowedFormats(e.target.value)}
                  className="h-10 text-xs rounded-xl bg-gray-50 border-gray-200 font-mono"
                />
              </div>

              {/* AUTO-DELETE CANDIDATE DATA HIGHLIGHT */}
              <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                candidatePurgeRetention === "never"
                  ? "bg-gray-50 border-gray-200 opacity-70"
                  : "bg-rose-50/70 border-rose-200/80"
              }`}>
                <div className="flex flex-col">
                  <span className={`font-bold flex items-center gap-1.5 ${
                    candidatePurgeRetention === "never" ? "text-gray-700" : "text-rose-950"
                  }`}>
                    <Trash2 className={`w-4 h-4 ${candidatePurgeRetention === "never" ? "text-gray-400" : "text-rose-600"}`} />
                    {candidatePurgeRetention === "never"
                      ? "Auto-Delete Candidate Applications & Resumes (Disabled)"
                      : `Auto-Delete Candidate Applications & Resumes after ${candidatePurgeRetention}`}
                  </span>
                  <span className={`text-[11px] mt-0.5 ${
                    candidatePurgeRetention === "never" ? "text-gray-500" : "text-rose-800"
                  }`}>
                    {candidatePurgeRetention === "never"
                      ? "Retention is set to 'Never Delete'. Candidate records and uploaded resumes will never be deleted automatically."
                      : `Automatically remove candidate application entries, personal contact info, and stored resume PDF files from database after ${candidatePurgeRetention}.`}
                  </span>
                </div>
                <input
                  type="checkbox"
                  disabled={candidatePurgeRetention === "never"}
                  checked={candidatePurgeRetention !== "never" && autoDeleteCandidateData}
                  onChange={(e) => setAutoDeleteCandidateData(e.target.checked)}
                  className="w-4 h-4 accent-rose-600 cursor-pointer disabled:cursor-not-allowed"
                />
              </div>


            </div>
          )}

          {/* TAB 3: CLIENT REQUESTS SETTINGS */}
          {activeTab === "requests" && (
            <div className="flex flex-col gap-5 text-xs font-medium">
              <div className="pb-3 border-b border-gray-100">
                <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#FF7F50]" />
                  <span>Client Request &amp; Proposal Settings</span>
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Configure client request data retention schedules and cleanups.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Data Retention Cleanup (Days)</label>
                  <Input
                    type="number"
                    value={purgeDays}
                    onChange={(e) => setPurgeDays(e.target.value)}
                    className="h-10 text-xs rounded-xl bg-gray-50 border-gray-200 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AUDIT LOGS & RETENTION SETTINGS */}
          {activeTab === "audit" && (
            <div className="flex flex-col gap-5 text-xs font-medium">
              <div className="pb-3 border-b border-gray-100">
                <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#FF7F50]" />
                  <span>Audit Trail Retention &amp; Automatic Cleanup</span>
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Set retention threshold for state mutation logs. Page access reads are excluded by default.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Audit Log Retention Period</label>
                  <Combobox
                    options={auditRetentionOptions}
                    value={auditLogRetention}
                    onValueChange={(val) => setAuditLogRetention(val)}
                    allowCustom={false}
                    placeholder="Select audit retention..."
                    searchPlaceholder="Search retention threshold..."
                    className="h-10 text-xs font-bold rounded-xl bg-gray-50 border-gray-200 shadow-2xs"
                    popoverClassName="min-w-[320px] rounded-2xl"
                  />
                  <span className="text-[11px] text-gray-400">
                    System mutation logs older than this duration will be automatically deleted.
                  </span>
                </div>
              </div>

              {/* AUTO-DELETE AUDIT LOGS HIGHLIGHT */}
              <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                auditLogRetention === "never"
                  ? "bg-gray-50 border-gray-200 opacity-70"
                  : "bg-amber-50/70 border-amber-200/80"
              }`}>
                <div className="flex flex-col">
                  <span className={`font-bold flex items-center gap-1.5 ${
                    auditLogRetention === "never" ? "text-gray-700" : "text-amber-950"
                  }`}>
                    <Trash2 className={`w-4 h-4 ${auditLogRetention === "never" ? "text-gray-400" : "text-amber-600"}`} />
                    {auditLogRetention === "never"
                      ? "Auto-Delete Audit Logs (Disabled)"
                      : `Auto-Delete Audit Logs After ${auditLogRetention}`}
                  </span>
                  <span className={`text-[11px] mt-0.5 ${
                    auditLogRetention === "never" ? "text-gray-500" : "text-amber-800"
                  }`}>
                    {auditLogRetention === "never"
                      ? "Retention is set to 'Never Delete'. All mutation logs and state diffs are preserved permanently."
                      : `Automatically purge mutation logs and state diffs from database after ${auditLogRetention}. Page view clutter is dropped permanently.`}
                  </span>
                </div>
                <input
                  type="checkbox"
                  disabled={auditLogRetention === "never"}
                  checked={auditLogRetention !== "never" && autoDeleteAuditLogs}
                  onChange={(e) => setAutoDeleteAuditLogs(e.target.checked)}
                  className="w-4 h-4 accent-amber-600 cursor-pointer disabled:cursor-not-allowed"
                />
              </div>
            </div>
          )}

          {/* SAVE BUTTON AT BOTTOM */}
          <div className="flex justify-end pt-3 border-t border-gray-100">
            <Button
              onClick={handleSaveSettings}
              disabled={saving}
              className="h-10 px-6 bg-[#0B192C] hover:bg-[#152844] text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-sm"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#FF7F50]" />
              ) : (
                <Save className="w-4 h-4 text-[#FF7F50]" />
              )}
              <span>{saving ? "Saving to Supabase DB..." : "Save System Settings"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* EDIT DOMAIN SEQUENCE MODAL */}
      <Dialog open={!!editingDomain} onOpenChange={(open) => !open && setEditingDomain(null)}>
        <DialogContent className="sm:max-w-md p-6 bg-white rounded-3xl border border-gray-200/90 shadow-2xl overflow-hidden font-sans">
          <DialogHeader className="pb-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0B192C] text-[#FF7F50] flex items-center justify-center shrink-0 shadow-sm">
                <Barcode className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-extrabold text-gray-900 tracking-tight">
                  Edit Domain Sequence
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500 font-medium mt-0.5">
                  Update identifier code and counter for {editingDomain?.oldCode}.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {editingDomain && (
            <div className="flex flex-col gap-4 pt-3 text-xs">
              {editError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700">Domain Code Identifier</label>
                <Input
                  type="text"
                  value={editingDomain.domain_code}
                  onChange={(e) => {
                    setEditError(null)
                    setEditingDomain({ ...editingDomain, domain_code: e.target.value.toUpperCase() })
                  }}
                  placeholder="e.g. ENG, PD, HR"
                  className="h-10 text-xs font-mono font-bold bg-gray-50 border-gray-200 uppercase"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700">Current Sequence Counter</label>
                <Input
                  type="number"
                  min="0"
                  value={editingDomain.current_sequence}
                  onChange={(e) => {
                    setEditError(null)
                    setEditingDomain({ ...editingDomain, current_sequence: parseInt(e.target.value, 10) || 0 })
                  }}
                  className="h-10 text-xs font-mono font-bold bg-gray-50 border-gray-200"
                />
                <span className="text-[11px] text-gray-400">
                  Next generated job ID will be sequence #{Number(editingDomain.current_sequence) + 1}
                </span>
              </div>

              {/* Live Preview */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                  Live Next Job ID Preview:
                </span>
                <span className="font-mono text-xs font-extrabold text-[#0B192C]">
                  {jobIdPrefix || "SIGPT"}-{editingDomain.domain_code.trim() || "ENG"}-{new Date().getFullYear()}-
                  {jobIdSeqPadding.includes("4")
                    ? String((Number(editingDomain.current_sequence) || 0) + 1).padStart(4, "0")
                    : jobIdSeqPadding.includes("5")
                    ? String((Number(editingDomain.current_sequence) || 0) + 1).padStart(5, "0")
                    : String((Number(editingDomain.current_sequence) || 0) + 1).padStart(3, "0")}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingDomain(null)
                    setEditError(null)
                  }}
                  className="h-9 px-4 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveEditDomain}
                  className="h-9 px-5 bg-[#0B192C] hover:bg-[#152844] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}
