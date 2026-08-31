import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { MainLayout } from "@/layouts/main-layout"
import { MOCK_JOBS } from "@/types/job-types"
import type { JobRequirement } from "@/types/job-types"
import { fetchAllJobs } from "@/services/job-storage-service"
import {
  fetchCandidateApplications,
  updateApplicationStatus,
  type CandidateApplicationRecord,
} from "@/services/application-storage-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Check,
  Share2,
  Edit2,
  ExternalLink,
  MapPin,
  Clock,
  UserCheck,
  Calendar,
  Sparkles,
  Users,
  FileText,
  Search,
  Eye,
  Mail,
  Phone,
  Briefcase,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react"

function generateLinkedInPostContent(job: JobRequirement): string {
  const currentUrl = window.location.href
  const domainTag = job.domain.replace(/[^a-zA-Z0-9]/g, "")
  const roleTag = job.jobTitle.replace(/[^a-zA-Z0-9]/g, "")

  const responsibilitiesText =
    job.responsibilities && job.responsibilities.length > 0
      ? job.responsibilities.slice(0, 3).map((r) => `  • ${r}`).join("\n")
      : "  • Drive top-level engineering deliverables & technical signoff"

  const skillsText =
    job.mandatorySkills && job.mandatorySkills.length > 0
      ? job.mandatorySkills.slice(0, 3).map((s) => `  ✓ ${s}`).join("\n")
      : "  ✓ Strong domain expertise & technical leadership"

  const whyJoinText =
    job.whyJoinSI && job.whyJoinSI.length > 0
      ? job.whyJoinSI.slice(0, 2).map((w) => `  ✨ ${w}`).join("\n")
      : "  ✨ Cutting-edge technology projects & competitive growth ecosystem"

  return `🚀 WE ARE HIRING: ${job.jobTitle.toUpperCase()} 🚀

Are you passionate about driving next-generation engineering excellence? We are expanding our high-impact team at SI-Career and looking for top-tier talent to join us!

📋 KEY POSITION DETAILS:
• Role: ${job.jobTitle}
• Requisition ID: ${job.reqId}
• Technical Domain: ${job.domain}
• Experience Required: ${job.experienceMin} – ${job.experienceMax} Years
• Location: ${job.location.join(", ")}
• Employment Type: ${job.employmentType}
• Open Positions: ${job.openings}
• Educational Qualification: ${job.qualification || "B.Tech / M.Tech in ECE / CS / EE"}

📝 ROLE OVERVIEW:
${job.jobSummary}

🎯 KEY RESPONSIBILITIES:
${responsibilitiesText}

⚡ MANDATORY SKILLSET & EXPERTISE:
${skillsText}

💡 WHY JOIN US:
${whyJoinText}

📩 HOW TO APPLY & REFER:
Review full requirement details and submit your application directly via our career portal:
👉 ${currentUrl}

Interested candidates or referrals, connect with our Talent Acquisition team:
👤 TA Specialist / Recruiter: ${job.recruiterOwner}

#Hiring #${roleTag} #${domainTag} #SemiconductorJobs #TechCareers #JobOpportunity #Recruitment #SICareer #VLSIJobs`
}

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<"details" | "applications">("details")

  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedLinkedIn, setCopiedLinkedIn] = useState(false)
  const [applied, setApplied] = useState(false)

  // LinkedIn Modal & Custom Post Text State
  const [isLinkedInModalOpen, setIsLinkedInModalOpen] = useState(false)
  const [linkedInText, setLinkedInText] = useState("")

  // Applications & Candidates state
  const [applications, setApplications] = useState<CandidateApplicationRecord[]>([])
  const [loadingApps, setLoadingApps] = useState(true)
  const [appSearch, setAppSearch] = useState("")

  const [job, setJob] = useState<JobRequirement>(
    MOCK_JOBS.find((j) => j.id === id || j.reqId === id) || MOCK_JOBS[0]
  )

  useEffect(() => {
    fetchAllJobs().then((list) => {
      const found = list.find((j) => j.id === id || j.reqId === id)
      if (found) setJob(found)
    })

    fetchCandidateApplications().then((list) => {
      setApplications(list)
      setLoadingApps(false)
    })
  }, [id])

  const appliedCandidates = applications.filter(
    (app) =>
      app.reqId === job.reqId ||
      app.jobId === job.id ||
      app.jobTitle.toLowerCase() === job.jobTitle.toLowerCase()
  )

  const filteredAppliedCandidates = appliedCandidates.filter((app) => {
    const q = appSearch.toLowerCase()
    return (
      app.fullName.toLowerCase().includes(q) ||
      app.email.toLowerCase().includes(q) ||
      app.id.toLowerCase().includes(q) ||
      app.currentCompany.toLowerCase().includes(q)
    )
  })

  const handleCandidateStatusChange = async (
    appId: string,
    newStatus: CandidateApplicationRecord["status"]
  ) => {
    await updateApplicationStatus(appId, newStatus)
    setApplications((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app))
    )
  }

  const handleCopyLink = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const handleOpenLinkedInModal = () => {
    const content = generateLinkedInPostContent(job)
    setLinkedInText(content)
    setIsLinkedInModalOpen(true)
  }

  const handleCopyLinkedInText = () => {
    navigator.clipboard.writeText(linkedInText)
    setCopiedLinkedIn(true)
    setTimeout(() => setCopiedLinkedIn(false), 2500)
  }

  const handleOpenLinkedInShareWindow = () => {
    handleCopyLinkedInText()
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      window.location.href
    )}`
    window.open(shareUrl, "_blank", "noopener,noreferrer")
  }

  const handleApply = () => {
    setApplied(true)
  }

  return (
    <MainLayout pageTitle={`Job Detail - ${job.reqId}`}>
      <div className="bg-[#FAF8F5] rounded-sm p-6 sm:p-10 lg:p-12 w-full flex flex-col gap-8 font-sans max-w-5xl mx-auto pb-24">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200/80">
          <button
            type="button"
            onClick={() => navigate("/jobs")}
            className="text-xs font-bold text-gray-500 hover:text-gray-900 tracking-wider uppercase flex items-center gap-1.5 w-fit cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Job List</span>
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full font-bold text-xs ${
                job.status === "Open"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : job.status === "Draft"
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : job.status === "On Hold"
                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              Status: {job.status}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/jobs/edit/${job.id}`)}
              className="h-9 border-gray-200 hover:bg-gray-100 text-xs font-semibold rounded-sm cursor-pointer inline-flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5 text-gray-600" />
              <span>Edit Requirement</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="h-9 border-gray-200 hover:bg-gray-100 text-xs font-semibold rounded-sm cursor-pointer inline-flex items-center gap-1.5"
            >
              {copiedLink ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-gray-600" />
              )}
              <span>{copiedLink ? "Copied Link" : "Copy Link"}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenLinkedInModal}
              className="h-9 border-gray-200 hover:bg-gray-100 text-xs font-semibold rounded-sm cursor-pointer inline-flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5 text-[#0077B5]" />
              <span>Share LinkedIn</span>
            </Button>

            <Button
              onClick={handleApply}
              disabled={applied || job.status !== "Open"}
              className={`h-9 font-bold text-xs rounded-sm px-4 shadow-xs cursor-pointer inline-flex items-center gap-1.5 ${
                applied
                  ? "bg-emerald-600 hover:bg-emerald-600 text-white cursor-default"
                  : job.status === "Open"
                  ? "bg-[#FF7F50] hover:bg-[#E56A3C] text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {applied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Applied</span>
                </>
              ) : (
                <>
                  <span>Apply Now</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Top Header & Domain */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
            <span className="w-1 h-4 bg-[#FF7F50] rounded-full inline-block" />
            <span>{job.domain}</span>
            <span className="text-gray-300">•</span>
            <span className="font-mono text-gray-700 bg-gray-200/60 px-2 py-0.5 rounded text-[11px]">
              Req ID: {job.reqId}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B192C] tracking-tight pt-1">
            {job.jobTitle}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 font-medium pt-1">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#FF7F50]" />
              {job.location.join(", ")}
            </span>
            <span className="text-gray-300">•</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#FF7F50]" />
              {job.employmentType}
            </span>
            <span className="text-gray-300">•</span>
            <span className="flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-[#FF7F50]" />
              TA Owner: <strong className="text-gray-900">{job.recruiterOwner}</strong>
            </span>
            {job.postingDate && (
              <>
                <span className="text-gray-300">•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  Posted {job.postingDate}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Section Tabs Navigation */}
        <div className="flex items-center gap-2 border-b border-gray-200/80 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab("details")}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === "details"
                ? "border-[#FF7F50] text-[#FF7F50]"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Job Overview & Requirements</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("applications")}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === "applications"
                ? "border-[#FF7F50] text-[#FF7F50]"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Applied Employees / Candidates</span>
            <span
              className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === "applications"
                  ? "bg-[#FF7F50] text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {appliedCandidates.length}
            </span>
          </button>
        </div>

        {/* TAB 1: JOB DETAILS */}
        {activeTab === "details" && (
          <div className="flex flex-col gap-8">
            {/* Key Stats Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 py-6 border-b border-gray-200/80">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                  EXPERIENCE
                </span>
                <span className="text-base font-extrabold text-[#0B192C]">
                  {job.experienceMin}–{job.experienceMax} years
                </span>
              </div>
              <div className="md:border-l md:border-gray-200 md:pl-6">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                  OPENINGS
                </span>
                <span className="text-base font-extrabold text-[#FF7F50]">
                  {job.openings}
                </span>
              </div>
              <div className="md:border-l md:border-gray-200 md:pl-6">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                  QUALIFICATION
                </span>
                <span className="text-base font-extrabold text-[#0B192C]">
                  {job.qualification || "B.Tech / M.Tech in ECE / EE"}
                </span>
              </div>
              <div className="md:border-l md:border-gray-200 md:pl-6">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                  CLOSING DATE
                </span>
                <span className="text-base font-extrabold text-gray-800">
                  {job.closingDate || "Open until filled"}
                </span>
              </div>
            </div>

            {/* Main Content Sections */}
            <div className="flex flex-col gap-8">
              {/* About the role */}
              <div className="flex flex-col gap-3">
                <h2 className="text-lg font-bold text-[#0B192C]">About the role</h2>
                {job.jobSummary ? (
                  <p className="text-sm text-gray-700 leading-relaxed font-normal whitespace-pre-line">
                    {job.jobSummary}
                  </p>
                ) : (
                  <p className="text-gray-400 text-sm italic">
                    No role summary provided.
                  </p>
                )}
              </div>

              {/* What you'll do */}
              {job.responsibilities && job.responsibilities.length > 0 && (
                <div className="pt-6 border-t border-gray-200/80 flex flex-col gap-4">
                  <h2 className="text-lg font-bold text-[#0B192C]">What you'll do</h2>
                  <div className="flex flex-col gap-3.5">
                    {job.responsibilities.map((r, i) => (
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
              {job.mandatorySkills && job.mandatorySkills.length > 0 && (
                <div className="pt-6 border-t border-gray-200/80 flex flex-col gap-4">
                  <h2 className="text-lg font-bold text-[#0B192C]">Technical skillset</h2>
                  <div className="flex flex-col gap-3">
                    {job.mandatorySkills.map((s, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-[#FF7F50] shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-800 font-medium leading-relaxed">
                          {s}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Good to have */}
              {job.preferredSkills && job.preferredSkills.length > 0 && (
                <div className="pt-6 border-t border-gray-200/80 flex flex-col gap-4">
                  <h2 className="text-lg font-bold text-[#0B192C]">Good to have</h2>
                  <div className="flex flex-col gap-3">
                    {job.preferredSkills.map((s, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-gray-400 font-bold text-sm shrink-0 mt-0.5">
                          •
                        </span>
                        <span className="text-sm text-gray-700 leading-relaxed">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* What we offer */}
              {job.whyJoinSI && job.whyJoinSI.length > 0 && (
                <div className="pt-6 border-t border-gray-200/80 flex flex-col gap-4">
                  <h2 className="text-lg font-bold text-[#0B192C]">What we offer</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {job.whyJoinSI.map((offer, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-[#FF7F50] shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700 leading-relaxed">
                          {offer}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: APPLIED CANDIDATES / EMPLOYEES */}
        {activeTab === "applications" && (
          <div className="flex flex-col gap-6">
            {/* Search & Header Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
              <div className="relative w-full md:w-80 flex items-center">
                <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  type="text"
                  value={appSearch}
                  onChange={(e) => setAppSearch(e.target.value)}
                  placeholder="Search applicant name, email, company..."
                  className="pl-9 h-9 text-xs rounded-lg bg-gray-50 border-gray-200"
                />
              </div>

              <div className="text-xs text-gray-500 font-medium flex items-center gap-2">
                <span>Total Applied:</span>
                <strong className="text-gray-900 font-extrabold">
                  {appliedCandidates.length} Candidates
                </strong>
              </div>
            </div>

            {/* Candidates Table / List */}
            {loadingApps ? (
              <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200 gap-3 text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin text-[#FF7F50]" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider">
                  Loading applied employees...
                </span>
              </div>
            ) : filteredAppliedCandidates.length === 0 ? (
              <div className="text-center py-16 px-6 bg-white rounded-xl border border-gray-200/80 flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-[#FF7F50]">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  No Applied Employees Found
                </h3>
                <p className="text-xs text-gray-500 max-w-md">
                  {appSearch
                    ? "No candidates match your search query."
                    : "No employee or candidate has submitted an application for this position yet."}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-600">
                    <thead className="bg-gray-50/90 text-gray-700 font-bold border-b border-gray-200/70">
                      <tr>
                        <th className="py-3.5 px-5">Candidate / Employee</th>
                        <th className="py-3.5 px-4">Contact Info</th>
                        <th className="py-3.5 px-4">Experience</th>
                        <th className="py-3.5 px-4">Company & CTC</th>
                        <th className="py-3.5 px-4">Applied Date</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {filteredAppliedCandidates.map((app) => (
                        <tr
                          key={app.id}
                          className="even:bg-gray-50/50 odd:bg-white hover:bg-orange-50/40 transition-colors"
                        >
                          {/* Candidate / Employee Name */}
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-[#0B192C] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                {app.fullName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-gray-900 text-sm hover:text-[#FF7F50] transition-colors">
                                  {app.fullName}
                                </span>
                                <span className="text-[11px] text-gray-400 font-mono">
                                  {app.id}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Contact Info */}
                          <td className="py-4 px-4">
                            <div className="flex flex-col gap-1 text-gray-700 text-xs">
                              <span className="flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-gray-400" />
                                {app.email}
                              </span>
                              <span className="flex items-center gap-1.5 text-gray-500">
                                <Phone className="w-3.5 h-3.5 text-gray-400" />
                                {app.mobile}
                              </span>
                            </div>
                          </td>

                          {/* Experience */}
                          <td className="py-4 px-4">
                            <div className="flex flex-col gap-0.5 text-gray-800 font-medium">
                              <span>Total: <strong>{app.totalExperience} Yrs</strong></span>
                              <span className="text-[11px] text-gray-400">
                                Relevant: {app.relevantExperience} Yrs
                              </span>
                            </div>
                          </td>

                          {/* Company & CTC */}
                          <td className="py-4 px-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-gray-800 flex items-center gap-1">
                                <Briefcase className="w-3 h-3 text-gray-400" />
                                {app.currentCompany || "N/A"}
                              </span>
                              <span className="text-[11px] text-emerald-700 font-bold">
                                {app.currentCtc} → {app.expectedCtc}
                              </span>
                            </div>
                          </td>

                          {/* Applied Date */}
                          <td className="py-4 px-4 font-mono text-gray-600 text-[11px]">
                            {new Date(app.appliedAt).toLocaleDateString()}
                          </td>

                          {/* Status Badge */}
                          <td className="py-4 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full font-bold text-[11px] inline-flex items-center gap-1 ${
                                app.status === "Hired"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : app.status === "Shortlisted"
                                  ? "bg-teal-50 text-teal-700 border border-teal-200"
                                  : app.status === "Interviewing"
                                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                  : app.status === "Rejected"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-amber-50 text-amber-800 border border-amber-200"
                              }`}
                            >
                              {app.status}
                            </span>
                          </td>

                          {/* Action Button */}
                          <td className="py-4 px-5 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/applications/${app.id}`)}
                              className="h-8 border-gray-200 hover:bg-gray-100 text-xs font-semibold rounded-lg cursor-pointer inline-flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5 text-gray-600" />
                              <span>View Detail</span>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Professional LinkedIn Share Modal */}
      <Dialog open={isLinkedInModalOpen} onOpenChange={setIsLinkedInModalOpen}>
        <DialogContent className="w-[55vw] sm:max-w-[95vw]  h-[82vh] max-h-[90vh] flex flex-col p-6 sm:p-7 bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden font-sans">
          <DialogHeader className="shrink-0 pb-2 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#0077B5] shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-extrabold text-gray-900">
                  Professional LinkedIn Post Content
                </DialogTitle>
                <p className="text-xs text-gray-500 font-medium">
                  Review and customize the AI-generated high-converting recruiter post.
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-col gap-2 mt-4 flex-1 min-h-0">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider shrink-0">
              Generated Post Content (Editable)
            </label>
            <Textarea
              value={linkedInText}
              onChange={(e) => setLinkedInText(e.target.value)}
              className="text-xs sm:text-sm font-mono bg-gray-50/80 border border-gray-200 rounded-xl p-4 sm:p-5 leading-relaxed focus:bg-white focus:ring-2 focus:ring-[#0077B5]/20 flex-1 min-h-0 h-full overflow-y-auto resize-none field-sizing-fixed shadow-inner"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100 mt-4 shrink-0">
            <span className="text-xs text-gray-500 font-medium">
              {copiedLinkedIn ? (
                <span className="text-emerald-600 font-bold inline-flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Copied to clipboard!
                </span>
              ) : (
                "Copy post text or open LinkedIn directly to publish."
              )}
            </span>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <Button
                variant="outline"
                onClick={handleCopyLinkedInText}
                className="h-10 px-4 border-gray-200 hover:bg-gray-100 text-xs sm:text-sm font-semibold rounded-xl cursor-pointer"
              >
                {copiedLinkedIn ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600 mr-1.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-gray-600 mr-1.5" />
                    <span>Copy Text Only</span>
                  </>
                )}
              </Button>

              <Button
                onClick={handleOpenLinkedInShareWindow}
                className="h-10 px-5 bg-[#0077B5] hover:bg-[#005E93] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Share to LinkedIn</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}
