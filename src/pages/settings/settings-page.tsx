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
} from "lucide-react"

export function SettingsPage() {
  const { logPageView, logStateMutation } = useAuditLogger()
  const [activeTab, setActiveTab] = useState<
    "jobs" | "sequences" | "candidates" | "requests"
  >("jobs")

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Job Postings Configuration State
  const [jobAutoExpiry, setJobAutoExpiry] = useState("30")
  const [jobAutoDeleteDays, setJobAutoDeleteDays] = useState("60 days")
  const [defaultJobStatus, setDefaultJobStatus] = useState("Active")

  const [autoDeleteJobData, setAutoDeleteJobData] = useState(true)

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
    } catch {}
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
  const [auditLogRetention, setAuditLogRetention] = useState("180 days")
  const [enforce2FA, setEnforce2FA] = useState(false)

  const [savedSuccess, setSavedSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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
        setDefaultJobStatus(data.job_default_status || "Active")
        setJobAutoExpiry(String(data.job_auto_expiry ?? 30))
        setJobAutoDeleteDays(data.job_auto_delete_days || "60 days")
        setAutoDeleteJobData(data.auto_delete_job_data ?? true)

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
        setAuditLogRetention(data.audit_log_retention || "180 days")
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
      job_default_status: defaultJobStatus,
      job_auto_expiry: parseInt(jobAutoExpiry, 10) || 30,
      job_auto_delete_days: jobAutoDeleteDays,
      auto_delete_job_data: autoDeleteJobData,

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
              Configure job postings, auto-purge timelines, request retention, and security rules.
            </p>
          </div>

          <Button
            type="submit"
            form="settings-form"
            onClick={handleSaveSettings}
            disabled={saving}
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
            { id: "jobs", label: "Job Postings", icon: Briefcase },
            { id: "sequences", label: "Job ID & Sequences", icon: Barcode },
            { id: "candidates", label: "Candidates & Applications", icon: Users },
            { id: "requests", label: "Client Requests", icon: MessageSquare },
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
          {/* TAB 1: JOB POSTINGS CONFIGURATION */}
          {activeTab === "jobs" && (
            <div className="flex flex-col gap-5 text-xs font-medium">
              <div className="pb-3 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-[#FF7F50]" />
                    <span>Job Posting Defaults &amp; Database Auto-Deletion</span>
                  </h3>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    Configure default creation status, job auto-expiry, and database purge schedules.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Default Job Status on Creation</label>
                  <select
                    value={defaultJobStatus}
                    onChange={(e) => setDefaultJobStatus(e.target.value)}
                    className="h-10 px-3 text-xs font-bold text-gray-800 bg-gray-50 border border-gray-200 rounded-xl outline-none cursor-pointer"
                  >
                    <option value="Active">Active (Live immediately)</option>
                    <option value="Draft">Draft (Requires recruiter review)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Auto-Expiry Period (Days)</label>
                  <Input
                    type="number"
                    value={jobAutoExpiry}
                    onChange={(e) => setJobAutoExpiry(e.target.value)}
                    placeholder="30"
                    className="h-10 text-xs rounded-xl bg-gray-50 border-gray-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Auto-Delete Expired Jobs</label>
                  <select
                    value={jobAutoDeleteDays}
                    onChange={(e) => setJobAutoDeleteDays(e.target.value)}
                    className="h-10 px-3 text-xs font-bold text-gray-800 bg-gray-50 border border-gray-200 rounded-xl outline-none cursor-pointer"
                  >
                    <option value="30 days">Auto-Delete 30 Days after Expiry</option>
                    <option value="60 days">Auto-Delete 60 Days after Expiry (Default)</option>
                    <option value="90 days">Auto-Delete 90 Days after Expiry</option>
                    <option value="180 days">Auto-Delete 180 Days after Expiry</option>
                  </select>
                </div>

              </div>

              <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200/80 flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="font-bold text-amber-950 flex items-center gap-1.5">
                    <Trash2 className="w-4 h-4 text-amber-700" />
                    Auto-Delete Expired Job Postings
                  </span>
                  <span className="text-[11px] text-amber-800 mt-0.5">
                    Automatically purge old expired job postings and associated records after retention threshold.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={autoDeleteJobData}
                  onChange={(e) => setAutoDeleteJobData(e.target.checked)}
                  className="w-4 h-4 accent-amber-600 cursor-pointer"
                />
              </div>


            </div>
          )}

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
                    <select
                      value={jobIdSeqPadding}
                      onChange={(e) => setJobIdSeqPadding(e.target.value)}
                      className="h-10 px-3 text-xs font-bold text-gray-900 bg-white border border-gray-200 rounded-xl outline-none cursor-pointer font-mono"
                    >
                      <option value="3 digits (001)">3 Digits (001)</option>
                      <option value="4 digits (0001)">4 Digits (0001)</option>
                      <option value="5 digits (00001)">5 Digits (00001)</option>
                    </select>
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
                          className="p-3.5 bg-white rounded-xl border border-gray-200/80 flex flex-col gap-1.5 shadow-2xs hover:border-gray-300 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-[#FF7F50] font-mono">
                              {seq.domain_code}
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono font-medium">
                              Current: #{seq.current_sequence || 0}
                            </span>
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
                  <select
                    value={candidatePurgeRetention}
                    onChange={(e) => setCandidatePurgeRetention(e.target.value)}
                    className="h-10 px-3 text-xs font-bold text-gray-800 bg-gray-50 border border-gray-200 rounded-xl outline-none cursor-pointer"
                  >
                    <option value="90 days">90 Days (3 Months)</option>
                    <option value="180 days">180 Days (6 Months — Recommended PII Compliance)</option>
                    <option value="365 days">365 Days (1 Year)</option>
                  </select>
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

              {/* 6 MONTH AUTO-DELETE CANDIDATE DATA HIGHLIGHT */}
              <div className="p-4 bg-rose-50/70 rounded-xl border border-rose-200/80 flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="font-bold text-rose-950 flex items-center gap-1.5">
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    Auto-Delete Candidate Applications &amp; Resumes after 6 Months (180 Days)
                  </span>
                  <span className="text-[11px] text-rose-800 mt-0.5">
                    Automatically remove candidate application entries, personal contact info, and stored resume PDF files from database after 6 months.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={autoDeleteCandidateData}
                  onChange={(e) => setAutoDeleteCandidateData(e.target.checked)}
                  className="w-4 h-4 accent-rose-600 cursor-pointer"
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
                  Configure meeting slot defaults, PII retention cleanups, and corporate notification dispatchers.
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

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Default Meeting Slot Duration</label>
                  <select
                    value={defaultSlotDuration}
                    onChange={(e) => setDefaultSlotDuration(e.target.value)}
                    className="h-10 px-3 text-xs font-bold text-gray-800 bg-gray-50 border border-gray-200 rounded-xl outline-none cursor-pointer"
                  >
                    <option value="15 mins">15 Minutes</option>
                    <option value="30 mins">30 Minutes</option>
                    <option value="45 mins">45 Minutes</option>
                    <option value="60 mins">60 Minutes</option>
                  </select>
                </div>
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
    </MainLayout>
  )
}
