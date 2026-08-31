import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { MainLayout } from "@/layouts/main-layout"
import { MOCK_JOBS } from "@/types/job-types"
import type { JobRequirement, JobStatus, JobDomain, EmploymentType } from "@/types/job-types"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  Calendar,
  Clock,
  X,
  Plus,
  Briefcase,
  MapPin,
  User,
  GraduationCap,
  Layers,
  FileText,
  Trash2,
  CheckCircle2,
  Mail,
} from "lucide-react"

// shadcn UI Components
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Combobox } from "@/components/ui/combobox"
import { generateJobReqId } from "@/utils/job-req-id-generator"
import { saveJobRequirement, fetchAllJobs } from "@/services/job-storage-service"
import { getDynamicRecruiterOptions, fetchDynamicRecruiterOptions } from "@/lib/user-storage"
import { useAuth } from "@/hooks/use-auth"
import { useAuditLogger } from "@/hooks/use-audit-logger"

const DOMAIN_OPTIONS = [
  { value: "Physical Design (PD)", label: "Physical Design (PD)" },
  { value: "Static Timing Analysis (STA)", label: "Static Timing Analysis (STA)" },
  { value: "Design Verification (DV)", label: "Design Verification (DV)" },
  { value: "Embedded Systems", label: "Embedded Systems" },
  { value: "Analog & Mixed-Signal (AMS)", label: "Analog & Mixed-Signal (AMS)" },
]

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "Full-time", label: "Full-time" },
  { value: "Contract", label: "Contract" },
  { value: "Internship", label: "Internship" },
  { value: "Part-time", label: "Part-time" },
]

const STATUS_OPTIONS = [
  { value: "Open", label: "Open (Published)" },
  { value: "Draft", label: "Draft (Internal Only)" },
  { value: "On Hold", label: "On Hold" },
  { value: "Closed", label: "Closed" },
]

const DEFAULT_DOMAIN_OPTIONS = [
  { value: "Physical Design (PD)", label: "Physical Design (PD)" },
  { value: "Static Timing Analysis (STA)", label: "Static Timing Analysis (STA)" },
  { value: "Design Verification (DV)", label: "Design Verification (DV)" },
  { value: "Embedded Systems", label: "Embedded Systems" },
  { value: "Analog & Mixed-Signal (AMS)", label: "Analog & Mixed-Signal (AMS)" },
]

export function getDomainCode(domainName: string): string {
  const d = (domainName || "").trim()
  if (d.includes("Physical Design") || d === "PD") return "PD"
  if (d.includes("Static Timing") || d === "STA") return "STA"
  if (d.includes("Design Verification") || d === "DV") return "DV"
  if (d.includes("Embedded") || d === "EMB") return "EMB"
  if (d.includes("Analog") || d === "AMS") return "AMS"
  const clean = d.replace(/[^a-zA-Z]/g, "")
  if (clean.length <= 3 && clean.length > 0) return clean.toUpperCase()
  return (clean.substring(0, 3) || "GEN").toUpperCase()
}

const DEFAULT_LOCATIONS = ["Bengaluru", "Hyderabad", "Noida", "Pune", "Chennai", "Remote"]

export function CreateJobPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const { logPageView, logStateMutation } = useAuditLogger()
  const isEditing = Boolean(id)
  const [activeTab, setActiveTab] = useState<"form" | "preview">("form")

  useEffect(() => {
    logPageView(isEditing ? "Edit Job Requirement" : "Create Job Requirement")
  }, [logPageView, isEditing])

  const [recruiterOptions, setRecruiterOptions] = useState(() => getDynamicRecruiterOptions(authUser))

  useEffect(() => {
    let isMounted = true
    const updateOptions = async () => {
      const options = await fetchDynamicRecruiterOptions(authUser)
      if (isMounted) {
        setRecruiterOptions(options)
        if (!isEditing && options.length > 0) {
          setFormData((prev) => ({
            ...prev,
            recruiterOwner: prev.recruiterOwner || options[0].value,
          }))
        }
      }
    }

    updateOptions()
    window.addEventListener("sigpt_users_updated", updateOptions)
    window.addEventListener("storage", updateOptions)
    return () => {
      isMounted = false
      window.removeEventListener("sigpt_users_updated", updateOptions)
      window.removeEventListener("storage", updateOptions)
    }
  }, [authUser, isEditing])

  const [formData, setFormData] = useState<Partial<JobRequirement>>({
    reqId: generateJobReqId("Physical Design (PD)", 41),
    jobTitle: "",
    domain: "Physical Design (PD)",
    experienceMin: 0,
    experienceMax: 0,
    location: [],
    employmentType: "Full-time",
    jobSummary: "",
    responsibilities: [],
    mandatorySkills: [],
    preferredSkills: [],
    qualification: "",
    openings: 1,
    status: "Open",
    postingDate: new Date().toISOString().split("T")[0],
    closingDate: "",
    recruiterOwner: "",
    whyJoinSI: [],
  })

  const [newRespItem, setNewRespItem] = useState("")
  const [newMandatoryItem, setNewMandatoryItem] = useState("")
  const [newPreferredItem, setNewPreferredItem] = useState("")
  const [customLoc, setCustomLoc] = useState("")

  useEffect(() => {
    if (id) {
      fetchAllJobs().then((jobs) => {
        const existing = jobs.find((j) => j.id === id || j.reqId === id)
        if (existing) setFormData({ ...existing })
      })
    } else {
      if (recruiterOptions.length > 0 && !formData.recruiterOwner) {
        setFormData((prev) => ({
          ...prev,
          recruiterOwner: prev.recruiterOwner || recruiterOptions[0].value,
        }))
      }
    }
  }, [id, recruiterOptions])

  const handleAddResponsibility = () => {
    if (!newRespItem.trim()) return
    setFormData({ ...formData, responsibilities: [...(formData.responsibilities || []), newRespItem.trim()] })
    setNewRespItem("")
  }
  const handleRemoveResponsibility = (index: number) =>
    setFormData({ ...formData, responsibilities: (formData.responsibilities || []).filter((_, i) => i !== index) })

  const handleAddMandatorySkill = () => {
    if (!newMandatoryItem.trim()) return
    setFormData({ ...formData, mandatorySkills: [...(formData.mandatorySkills || []), newMandatoryItem.trim()] })
    setNewMandatoryItem("")
  }
  const handleRemoveMandatorySkill = (index: number) =>
    setFormData({ ...formData, mandatorySkills: (formData.mandatorySkills || []).filter((_, i) => i !== index) })

  const handleAddPreferredItem = () => {
    if (!newPreferredItem.trim()) return
    setFormData({ ...formData, preferredSkills: [...(formData.preferredSkills || []), newPreferredItem.trim()] })
    setNewPreferredItem("")
  }
  const handleRemovePreferredItem = (index: number) =>
    setFormData({ ...formData, preferredSkills: (formData.preferredSkills || []).filter((_, i) => i !== index) })

  const handleToggleLocation = (loc: string) => {
    const current = formData.location || []
    if (current.includes(loc)) {
      if (current.length > 1) setFormData({ ...formData, location: current.filter((l) => l !== loc) })
    } else {
      setFormData({ ...formData, location: [...current, loc] })
    }
  }

  const handleAddCustomLocation = () => {
    if (!customLoc.trim()) return
    const current = formData.location || []
    if (!current.includes(customLoc.trim())) setFormData({ ...formData, location: [...current, customLoc.trim()] })
    setCustomLoc("")
  }

  const handleDomainChange = async (newDomain: JobDomain) => {
    const domainCode = getDomainCode(newDomain)
    let generatedId = `SIGPT-${domainCode}-${new Date().getFullYear()}-001`

    if (!isEditing) {
      try {
        const { data } = await supabase
          .from("job_domain_sequences")
          .select("current_sequence")
          .eq("domain_code", domainCode)
          .eq("year", new Date().getFullYear())
          .maybeSingle()

        const currentSeq = data?.current_sequence || 0
        const nextSeq = currentSeq + 1
        const seqStr = String(nextSeq).padStart(3, "0")
        generatedId = `SIGPT-${domainCode}-${new Date().getFullYear()}-${seqStr}`
      } catch (err) {
        console.warn("[CreateJobPage] Sequence query note:", err)
      }
    } else {
      generatedId = formData.reqId || generatedId
    }

    setFormData((prev) => ({
      ...prev,
      domain: newDomain,
      reqId: generatedId,
    }))
  }

  const handleGenerateReqId = async () => {
    const domainCode = getDomainCode(formData.domain || "Physical Design (PD)")
    try {
      const { data } = await supabase
        .from("job_domain_sequences")
        .select("current_sequence")
        .eq("domain_code", domainCode)
        .eq("year", new Date().getFullYear())
        .maybeSingle()

      const currentSeq = data?.current_sequence || 0
      const nextSeq = currentSeq + 1
      const seqStr = String(nextSeq).padStart(3, "0")
      setFormData((prev) => ({
        ...prev,
        reqId: `SIGPT-${domainCode}-${new Date().getFullYear()}-${seqStr}`,
      }))
    } catch {
      setFormData((prev) => ({
        ...prev,
        reqId: `SIGPT-${domainCode}-${new Date().getFullYear()}-001`,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const domainCode = getDomainCode(formData.domain || "Physical Design (PD)")
    const fallbackId = `SIGPT-${domainCode}-${new Date().getFullYear()}-001`

    const fullJob: JobRequirement = {
      id: formData.id || Date.now().toString(),
      reqId: formData.reqId || fallbackId,
      jobTitle: formData.jobTitle || "Untitled Requirement",
      domain: (formData.domain || "Physical Design (PD)") as JobDomain,
      experienceMin: Number(formData.experienceMin || 0),
      experienceMax: Number(formData.experienceMax || 0),
      location: formData.location || [],
      employmentType: (formData.employmentType || "Full-time") as EmploymentType,
      jobSummary: formData.jobSummary || "",
      responsibilities: formData.responsibilities || [],
      mandatorySkills: formData.mandatorySkills || [],
      preferredSkills: formData.preferredSkills || [],
      qualification: formData.qualification || "",
      openings: Number(formData.openings || 1),
      status: (formData.status || "Open") as JobStatus,
      postingDate: formData.postingDate || new Date().toISOString().split("T")[0],
      closingDate: formData.closingDate || "",
      recruiterOwner: formData.recruiterOwner || "",
      whyJoinSI: formData.whyJoinSI || [],
    }

    // Atomically increment domain sequence counter in DB
    try {
      const parts = fullJob.reqId.split("-")
      const seqNum = parseInt(parts[parts.length - 1] || "1", 10) || 1
      await supabase.from("job_domain_sequences").upsert({
        domain_code: domainCode,
        domain_name: fullJob.domain,
        year: new Date().getFullYear(),
        current_sequence: seqNum,
        updated_at: new Date().toISOString(),
      })
    } catch (err) {
      console.warn("[CreateJobPage] Could not update domain sequence in DB:", err)
    }

    await saveJobRequirement(fullJob)

    await logStateMutation({
      category: "Jobs",
      action: isEditing ? "Job Requirement Updated" : "Job Requirement Created",
      type: isEditing ? "update" : "create",
      targetEntity: `Job ${fullJob.reqId}`,
      details: `${isEditing ? "Updated" : "Created"} job requirement '${fullJob.jobTitle}' (${fullJob.reqId}) under domain ${fullJob.domain}.`,
    })

    navigate("/jobs")
  }

  return (
    <MainLayout pageTitle={isEditing ? "Edit Job Requirement" : "Create Job Requirement"}>
      <div className="bg-[#FAF8F5] w-full pb-24 flex flex-col gap-6 font-sans">

        {/* Top Header & Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200/80">
          <div className="flex flex-col gap-1">
            <Button
              variant="outline"
              onClick={() => navigate("/jobs")}
              className="h-8 border-gray-200 hover:bg-gray-50 text-xs font-semibold rounded-sm w-fit cursor-pointer inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-gray-500" />
              <span>Back to Job List</span>
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
                {isEditing ? `Edit ${formData.reqId}` : "Create Job Requirement"}
              </h1>
              <span className="font-mono text-[11px] font-bold text-gray-800 bg-gray-100 px-2.5 py-1 rounded-sm">
                {formData.reqId}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Switcher Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-sm text-xs font-semibold border border-gray-200">
              <button
                type="button"
                onClick={() => setActiveTab("form")}
                className={`px-3.5 py-1.5 rounded-sm transition-all cursor-pointer ${activeTab === "form"
                  ? "bg-[#0B192C] text-white font-bold"
                  : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                Form Editor
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`px-3.5 py-1.5 rounded-sm transition-all cursor-pointer ${activeTab === "preview"
                  ? "bg-[#0B192C] text-white font-bold"
                  : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                Preview Mode
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/jobs")}
              className="h-10 border-gray-200 hover:bg-gray-50 text-xs font-semibold rounded-sm px-4 cursor-pointer"
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleSubmit}
              className="h-10 bg-[#FF7F50] hover:bg-[#E56A3C] text-white font-bold text-xs rounded-sm px-5 shadow-xs cursor-pointer"
            >
              {isEditing ? "Save Changes" : "Publish Requirement"}
            </Button>
          </div>
        </div>

        {activeTab === "preview" ? (
          /* Preview Mode Container (Full Width Warm Background without Card Border) */
          <div className="bg-[#FAF8F5] rounded-sm p-6 sm:p-10 lg:p-12 w-full flex flex-col gap-8 font-sans">

            {/* Top Navigation & Domain */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => navigate("/jobs")}
                className="text-xs font-bold text-gray-500 hover:text-gray-900 tracking-wider uppercase flex items-center gap-1.5 w-fit cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Job List</span>
              </button>

              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest pt-2">
                <span className="w-1 h-4 bg-[#FF7F50] rounded-full inline-block" />
                <span>{formData.domain || "PHYSICAL DESIGN (PD)"}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B192C] tracking-tight pt-1">
                {formData.jobTitle || "Untitled Position"}
              </h1>
            </div>

            {/* Key Stats Bar (Experience, Openings, Qualification) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-y border-gray-200/80">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1">EXPERIENCE</span>
                <span className="text-base font-extrabold text-[#0B192C]">
                  {formData.experienceMin}–{formData.experienceMax} years
                </span>
              </div>
              <div className="md:border-l md:border-gray-200 md:pl-6">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1">OPENINGS</span>
                <span className="text-base font-extrabold text-[#FF7F50]">
                  {formData.openings}
                </span>
              </div>
              <div className="md:border-l md:border-gray-200 md:pl-6">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1">QUALIFICATION</span>
                <span className="text-base font-extrabold text-[#0B192C]">
                  {formData.qualification || "Not specified"}
                </span>
              </div>
            </div>

            {/* Main Content (Full Width Layout) */}
            <div className="flex flex-col gap-8">

              {/* About the role */}
              <div className="flex flex-col gap-3">
                <h2 className="text-lg font-bold text-[#0B192C]">About the role</h2>
                {formData.jobSummary ? (
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {formData.jobSummary}
                  </p>
                ) : (
                  <p className="text-gray-400 text-sm italic">No role summary provided.</p>
                )}
              </div>

              {/* What you'll do */}
              {formData.responsibilities && formData.responsibilities.length > 0 && (
                <div className="pt-6 border-t border-gray-200/80 flex flex-col gap-4">
                  <h2 className="text-lg font-bold text-[#0B192C]">What you'll do</h2>
                  <div className="flex flex-col gap-3.5">
                    {formData.responsibilities.map((r, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <span className="text-xs font-mono font-bold text-[#FF7F50] shrink-0 mt-0.5">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-sm text-gray-700 leading-relaxed">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical skillset */}
              {formData.mandatorySkills && formData.mandatorySkills.length > 0 && (
                <div className="pt-6 border-t border-gray-200/80 flex flex-col gap-4">
                  <h2 className="text-lg font-bold text-[#0B192C]">Technical skillset</h2>
                  <div className="flex flex-col gap-3">
                    {formData.mandatorySkills.map((s, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-[#FF7F50] shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-800 font-medium leading-relaxed">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Good to have */}
              {formData.preferredSkills && formData.preferredSkills.length > 0 && (
                <div className="pt-6 border-t border-gray-200/80 flex flex-col gap-4">
                  <h2 className="text-lg font-bold text-[#0B192C]">Good to have</h2>
                  <div className="flex flex-col gap-3">
                    {formData.preferredSkills.map((s, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-gray-400 font-bold text-sm shrink-0 mt-0.5">•</span>
                        <span className="text-sm text-gray-700 leading-relaxed">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* What we offer */}
              {formData.whyJoinSI && formData.whyJoinSI.length > 0 && (
                <div className="pt-6 border-t border-gray-200/80 flex flex-col gap-4">
                  <h2 className="text-lg font-bold text-[#0B192C]">What we offer</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {formData.whyJoinSI.map((offer, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-[#FF7F50] shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700 leading-relaxed">{offer}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        ) : (
          /* Form Editor Grid (Full Width Grid Layout with Single Unified Cards) */
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">

            {/* Main Content Column (8 cols) - Single Unified Card */}
            <div className="lg:col-span-8">
              <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-xs flex flex-col gap-8">

                {/* 1. Requisition & Title */}
                <div className="flex flex-col gap-5">
                  <div className="pb-3 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      1. Requisition & Title
                    </h2>
                    <span className="text-[11px] text-gray-400 font-medium">Required Fields *</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-gray-800">Requisition ID *</Label>
                        <button
                          type="button"
                          onClick={handleGenerateReqId}
                          className="text-[11px] text-[#FF7F50] hover:underline font-bold cursor-pointer"
                        >
                          Auto-generate
                        </button>
                      </div>
                      <Input
                        type="text"
                        value={formData.reqId || ""}
                        onChange={(e) => setFormData({ ...formData, reqId: e.target.value })}
                        required
                        placeholder="e.g. REQ-PD-2026-05"
                        className="pl-3 h-9 text-xs rounded-sm bg-gray-50 border-gray-200 font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-bold text-gray-800">Domain *</Label>
                      <Combobox
                        options={DOMAIN_OPTIONS}
                        value={formData.domain || "Physical Design (PD)"}
                        onValueChange={(val) => handleDomainChange(val as JobDomain)}
                        placeholder="Search or select domain..."
                        className="h-9 text-xs font-semibold bg-gray-50 border-gray-200 rounded-sm"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-bold text-gray-800">Job Title *</Label>
                    <Input
                      type="text"
                      value={formData.jobTitle || ""}
                      onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                      required
                      placeholder="e.g. Senior Physical Design Engineer"
                      className="pl-3 h-9 text-xs rounded-sm bg-gray-50 border-gray-200 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-1">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-bold text-gray-800">Min Exp (Yrs)</Label>
                      <Input
                        type="number"
                        value={formData.experienceMin ?? 0}
                        onChange={(e) => setFormData({ ...formData, experienceMin: parseInt(e.target.value) || 0 })}
                        className="pl-3 h-9 text-xs rounded-sm bg-gray-50 border-gray-200 font-medium"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-bold text-gray-800">Max Exp (Yrs)</Label>
                      <Input
                        type="number"
                        value={formData.experienceMax ?? 0}
                        onChange={(e) => setFormData({ ...formData, experienceMax: parseInt(e.target.value) || 0 })}
                        className="pl-3 h-9 text-xs rounded-sm bg-gray-50 border-gray-200 font-medium"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-bold text-gray-800">Openings</Label>
                      <Input
                        type="number"
                        value={formData.openings ?? 1}
                        onChange={(e) => setFormData({ ...formData, openings: parseInt(e.target.value) || 1 })}
                        className="pl-3 h-9 text-xs rounded-sm bg-gray-50 border-gray-200 font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Role Overview & Summary */}
                <div className="flex flex-col gap-4 pt-6 border-t border-gray-100">
                  <div className="pb-3 border-b border-gray-100">
                    <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      2. Role Overview & Summary
                    </h2>
                  </div>
                  <Textarea
                    value={formData.jobSummary || ""}
                    onChange={(e) => setFormData({ ...formData, jobSummary: e.target.value })}
                    placeholder="Provide a comprehensive summary of the role, key focus areas, and team context..."
                    className="min-h-[120px] text-xs bg-gray-50 border-gray-200 rounded-sm font-medium focus:border-[#0B192C] focus:ring-1 focus:ring-[#0B192C] focus-visible:border-[#0B192C] focus-visible:ring-1 focus-visible:ring-[#0B192C] outline-none"
                  />
                </div>

                {/* 3. Key Responsibilities */}
                <div className="flex flex-col gap-4 pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      3. Key Responsibilities
                    </h2>
                    <span className="text-[11px] text-gray-500 font-mono font-medium">
                      {(formData.responsibilities || []).length} items added
                    </span>
                  </div>

                  <div className="space-y-2">
                    {formData.responsibilities?.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between gap-3 p-3 rounded-sm bg-gray-50 border border-gray-200 group transition-all"
                      >
                        <div className="flex items-start gap-2.5 flex-1">
                          <span className="text-[#FF7F50] font-bold text-xs select-none mt-0.5">•</span>
                          <span className="text-xs text-gray-800 leading-relaxed font-medium">{item}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveResponsibility(idx)}
                          className="text-xs text-gray-400 hover:text-red-600 transition-colors cursor-pointer shrink-0 p-1 hover:bg-red-50 rounded-sm"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Input
                      type="text"
                      value={newRespItem}
                      onChange={(e) => setNewRespItem(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddResponsibility() } }}
                      placeholder="Type responsibility and press Enter..."
                      className="flex-1 pl-3 h-9 text-xs rounded-sm bg-gray-50 border-gray-200"
                    />
                    <Button
                      type="button"
                      onClick={handleAddResponsibility}
                      variant="outline"
                      className="h-9 text-xs font-semibold border-gray-200 text-gray-800 hover:bg-gray-50 px-4 cursor-pointer rounded-sm shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1 text-[#FF7F50]" />
                      Add Item
                    </Button>
                  </div>
                </div>

                {/* 4. Qualifications & Skills */}
                <div className="flex flex-col gap-6 pt-6 border-t border-gray-100">
                  <div className="pb-3 border-b border-gray-100">
                    <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      4. Qualifications & Skills
                    </h2>
                  </div>

                  {/* Mandatory Skills */}
                  <div className="flex flex-col gap-3">
                    <Label className="text-xs font-bold text-gray-800">Mandatory Technical Skills *</Label>
                    <div className="space-y-2">
                      {formData.mandatorySkills?.map((skill, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between py-2.5 px-3.5 bg-indigo-50/70 rounded-sm text-xs font-semibold text-[#0B192C] border-l-4 border-l-[#0B192C]"
                        >
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveMandatorySkill(idx)}
                            className="text-xs text-gray-400 hover:text-red-600 transition-colors cursor-pointer shrink-0 ml-3 p-1 hover:bg-red-50 rounded-sm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Input
                        type="text"
                        value={newMandatoryItem}
                        onChange={(e) => setNewMandatoryItem(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddMandatorySkill() } }}
                        placeholder="Add mandatory skill..."
                        className="flex-1 pl-3 h-9 text-xs rounded-sm bg-gray-50 border-gray-200"
                      />
                      <Button
                        type="button"
                        onClick={handleAddMandatorySkill}
                        variant="outline"
                        className="h-9 text-xs font-semibold border-gray-200 text-gray-800 hover:bg-gray-50 px-4 cursor-pointer rounded-sm shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1 text-[#FF7F50]" />
                        Add Skill
                      </Button>
                    </div>
                  </div>

                  {/* Preferred Skills */}
                  <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
                    <Label className="text-xs font-bold text-gray-800">Preferred Skills (Optional)</Label>
                    <div className="flex flex-wrap gap-2">
                      {formData.preferredSkills?.map((skill, idx) => (
                        <span key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-800 rounded-sm text-xs font-semibold">
                          {skill}
                          <button
                            type="button"
                            onClick={() => handleRemovePreferredItem(idx)}
                            className="text-gray-400 hover:text-[#FF7F50] transition-colors cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Input
                        type="text"
                        value={newPreferredItem}
                        onChange={(e) => setNewPreferredItem(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddPreferredItem() } }}
                        placeholder="Add preferred skill..."
                        className="flex-1 pl-3 h-9 text-xs rounded-sm bg-gray-50 border-gray-200"
                      />
                      <Button
                        type="button"
                        onClick={handleAddPreferredItem}
                        variant="outline"
                        className="h-9 text-xs font-semibold border-gray-200 text-gray-800 hover:bg-gray-50 px-4 cursor-pointer rounded-sm shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1 text-[#FF7F50]" />
                        Add Skill
                      </Button>
                    </div>
                  </div>

                  {/* Educational Qualification */}
                  <div className="flex flex-col gap-1.5 pt-4 border-t border-gray-100">
                    <Label className="text-xs font-bold text-gray-800">Educational Qualification</Label>
                    <Input
                      type="text"
                      value={formData.qualification || ""}
                      onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                      placeholder="e.g. B.Tech / M.Tech in ECE / EE"
                      className="pl-3 h-9 text-xs rounded-sm bg-gray-50 border-gray-200 font-medium"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Sidebar Column (4 cols) - Single Unified Card */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs flex flex-col gap-6">

                {/* Target Location */}
                <div className="flex flex-col gap-4">
                  <div className="pb-3 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#FF7F50]" />
                      Target Location
                    </h3>
                    <span className="text-[11px] text-gray-500 font-mono">{(formData.location || []).length} active</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_LOCATIONS.map((loc) => {
                      const isSelected = formData.location?.includes(loc)
                      return (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => handleToggleLocation(loc)}
                          className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-all cursor-pointer ${isSelected
                            ? "bg-[#0B192C] text-white shadow-xs"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                        >
                          {loc}
                        </button>
                      )
                    })}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Input
                      type="text"
                      value={customLoc}
                      onChange={(e) => setCustomLoc(e.target.value)}
                      placeholder="Custom location..."
                      className="h-9 text-xs flex-1 pl-3 rounded-sm bg-gray-50 border-gray-200"
                    />
                    <Button
                      type="button"
                      onClick={handleAddCustomLocation}
                      variant="outline"
                      className="h-9 text-xs font-semibold border-gray-200 text-gray-800 hover:bg-gray-50 px-3 cursor-pointer rounded-sm shrink-0"
                    >
                      Add
                    </Button>
                  </div>

                  <div className="flex flex-col gap-1.5 pt-4 border-t border-gray-100">
                    <Label className="text-xs font-bold text-gray-800">Employment Type</Label>
                    <Combobox
                      options={EMPLOYMENT_TYPE_OPTIONS}
                      value={formData.employmentType || "Full-time"}
                      onValueChange={(val) => setFormData({ ...formData, employmentType: val as EmploymentType })}
                      placeholder="Select employment type..."
                      searchPlaceholder="Search employment type..."
                      className="h-9 text-xs font-semibold bg-gray-50 border-gray-200 rounded-sm"
                      allowCustom={false}
                    />
                  </div>
                </div>

                {/* Publishing & Recruiter Owner */}
                <div className="flex flex-col gap-4 pt-6 border-t border-gray-100">
                  <div className="pb-3 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#FF7F50]" />
                      Publishing & Owner
                    </h3>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-bold text-gray-800">Publish Status</Label>
                    <Combobox
                      options={STATUS_OPTIONS}
                      value={formData.status || "Open"}
                      onValueChange={(val) => setFormData({ ...formData, status: val as JobStatus })}
                      placeholder="Select status..."
                      searchPlaceholder="Search status..."
                      className="h-9 text-xs font-semibold bg-gray-50 border-gray-200 rounded-sm"
                      allowCustom={false}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 pt-1">
                    <Label className="text-xs font-bold text-gray-800">Recruiter Owner</Label>
                    <Combobox
                      options={recruiterOptions}
                      value={formData.recruiterOwner || ""}
                      onValueChange={(val) => setFormData({ ...formData, recruiterOwner: val })}
                      placeholder="Select or enter recruiter..."
                      searchPlaceholder="Search or enter recruiter..."
                      className="h-9 text-xs font-semibold bg-gray-50 border-gray-200 rounded-sm"
                      allowCustom={true}
                    />
                  </div>

                  {/* Posting Date */}
                  <div className="flex flex-col gap-1.5 pt-4 border-t border-gray-100">
                    <Label className="text-xs font-bold text-gray-800">Posting Date</Label>
                    <div className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-sm flex items-center text-xs text-gray-800 font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>{formData.postingDate ? new Date(formData.postingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Immediate"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Closing Date */}
                  <div className="flex flex-col gap-1.5 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-gray-800">Closing Date</Label>
                      <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-sm">
                        Optional
                      </span>
                    </div>

                    <div className="relative">
                      <Input
                        type="date"
                        value={formData.closingDate || ""}
                        onChange={(e) => setFormData({ ...formData, closingDate: e.target.value })}
                        className="h-9 text-xs pr-8 cursor-pointer rounded-sm bg-gray-50 border-gray-200"
                      />
                      {formData.closingDate && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, closingDate: "" })}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-sm hover:bg-gray-100 cursor-pointer"
                          title="Clear closing date"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Preset Buttons */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-gray-400 font-medium shrink-0">Presets:</span>
                      <div className="flex items-center gap-1 flex-wrap">
                        {[15, 30, 60, 90].map((days) => {
                          const date = new Date()
                          date.setDate(date.getDate() + days)
                          const iso = date.toISOString().split('T')[0]
                          const isSelected = formData.closingDate === iso
                          return (
                            <button
                              key={days}
                              type="button"
                              onClick={() => setFormData({ ...formData, closingDate: iso })}
                              className={`px-2.5 py-1 rounded-sm text-[10px] font-bold transition-colors cursor-pointer ${isSelected
                                ? "bg-[#0B192C] text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                            >
                              +{days}d
                            </button>
                          )
                        })}
                        {formData.closingDate && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, closingDate: "" })}
                            className="px-2 py-1 rounded-sm text-[10px] font-bold text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </form>
        )}
      </div>
    </MainLayout>
  )
}
