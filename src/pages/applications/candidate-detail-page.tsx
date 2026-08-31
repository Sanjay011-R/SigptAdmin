import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { MainLayout } from "@/layouts/main-layout";
import {
  fetchCandidateApplications,
  updateApplicationStatus,
  type CandidateApplicationRecord,
} from "@/services/application-storage-service";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  UserCheck,
  CheckCircle,
  Calendar,
  XCircle,
  Download,
  Mail,
  Phone,
  MapPin,
  FileText,
  Globe,
  Clock,
  Eye,
  X,
  Loader2,
  Check,
} from "lucide-react";

import { useAuditLogger } from "@/hooks/use-audit-logger";

export function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { logStateMutation } = useAuditLogger();

  const [candidate, setCandidate] = useState<CandidateApplicationRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const loadCandidate = async () => {
      try {
        const list = await fetchCandidateApplications();
        if (isMounted) {
          let found = list.find(
            (app) =>
              String(app.id) === String(id) ||
              app.reqId === id ||
              String(app.id).toLowerCase() === String(id).toLowerCase()
          );

          if (!found && id) {
            try {
              const isNum = /^\d+$/.test(id);
              let query = supabase.from("candidate_applications").select("*");
              if (isNum) {
                query = query.or(`id.eq.${parseInt(id, 10)},req_id.eq.${id}`);
              } else {
                const extractedDigits = id.replace(/\D/g, "");
                if (extractedDigits) {
                  query = query.or(`req_id.eq.${id},id.eq.${parseInt(extractedDigits, 10)}`);
                } else {
                  query = query.eq("req_id", id);
                }
              }
              const { data } = await query.maybeSingle();

              if (data) {
                found = {
                  id: String(data.id),
                  jobId: data.job_id || "",
                  reqId: data.req_id || "REQ-000",
                  jobTitle: data.job_title || "Untitled Position",
                  domain: data.domain || "General",
                  fullName: data.full_name || "Unknown Candidate",
                  email: data.email || "",
                  mobile: data.mobile || "",
                  currentLocation: data.current_location || "",
                  preferredLocation: data.preferred_location || "",
                  totalExperience: data.total_experience || "0",
                  relevantExperience: data.relevant_experience || "0",
                  currentCompany: data.current_company || "",
                  currentCtc: data.current_ctc || "",
                  expectedCtc: data.expected_ctc || "",
                  noticePeriod: data.notice_period || "",
                  linkedinUrl: data.linkedin_url || "",
                  shortNote: data.short_note || "",
                  resumeName: data.resume_name || "resume.pdf",
                  resumeSize: data.resume_size || 0,
                  resumeDataUrl: data.resume_data_url || "",
                  appliedAt: data.applied_at || new Date().toISOString(),
                  status: (data.status as CandidateApplicationRecord["status"]) || "Under Review",
                };
              }
            } catch (e) {
              console.warn("Direct query failed:", e);
            }
          }

          setCandidate(found || null);
        }
      } catch (err) {
        console.error("Error loading candidate details:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadCandidate();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleStatusChange = async (newStatus: CandidateApplicationRecord["status"]) => {
    if (!candidate) return;
    setUpdating(true);
    const oldStatus = candidate.status;
    try {
      await updateApplicationStatus(candidate.id, newStatus, {
        reqId: candidate.reqId,
        email: candidate.email,
      });
      setCandidate({ ...candidate, status: newStatus });
      await logStateMutation({
        category: "Candidates",
        action: "Candidate Status Changed",
        type: "update",
        targetEntity: `${candidate.id} (${candidate.fullName} - ${candidate.jobTitle})`,
        details: `Changed candidate status from ${oldStatus} to ${newStatus}.`,
        changes: [{ field: "Status", from: oldStatus, to: newStatus }],
      });
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDownload = () => {
    if (!candidate) return;
    if (candidate.resumeDataUrl && candidate.resumeDataUrl.startsWith("data:")) {
      const a = document.createElement("a");
      a.href = candidate.resumeDataUrl;
      a.download = candidate.resumeName || `${candidate.fullName.replace(/\s+/g, "_")}_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const textContent = `CANDIDATE APPLICATION RECORD: ${candidate.fullName}
Ref ID: ${candidate.id}
Job Position: ${candidate.jobTitle} (${candidate.reqId})
Email: ${candidate.email}
Phone: ${candidate.mobile}
Current Location: ${candidate.currentLocation}
Preferred Location: ${candidate.preferredLocation}
Total Experience: ${candidate.totalExperience} Years
Relevant Experience: ${candidate.relevantExperience} Years
Current Employer: ${candidate.currentCompany}
Current CTC: ${candidate.currentCtc}
Expected CTC: ${candidate.expectedCtc}
Notice Period: ${candidate.noticePeriod}
Applied Date: ${candidate.appliedAt}
Hiring Status: ${candidate.status}
Cover Note: ${candidate.shortNote || "N/A"}`;

      const blob = new Blob([textContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${candidate.fullName.replace(/\s+/g, "_")}_Profile.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  if (loading) {
    return (
      <MainLayout pageTitle="Candidate Details">
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF7F50]" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider">
            Loading candidate details...
          </span>
        </div>
      </MainLayout>
    );
  }

  if (!candidate) {
    return (
      <MainLayout pageTitle="Candidate Details">
        <div className="text-center py-20 bg-white rounded-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Candidate Not Found</h2>
          <p className="text-xs text-gray-500 mb-6">
            The requested candidate application record was not found.
          </p>
          <Button
            onClick={() => navigate("/applications")}
            className="bg-[#0B192C] hover:bg-[#1a2942] text-white rounded-sm font-mono text-[11px] font-bold tracking-wider uppercase"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Candidates List
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout pageTitle={`Candidate Profile - ${candidate.fullName}`}>
      <div className="bg-[#FAF8F5] rounded-sm p-6 sm:p-10 lg:p-12 w-full flex flex-col gap-8 font-sans max-w-5xl mx-auto pb-24">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200/80">
          <button
            type="button"
            onClick={() => navigate("/applications")}
            className="text-xs font-bold text-gray-500 hover:text-gray-900 tracking-wider uppercase flex items-center gap-1.5 w-fit cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Candidates List</span>
          </button>

          {/* HR Decision Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full font-bold text-xs ${
                candidate.status === "Hired"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : candidate.status === "Shortlisted"
                  ? "bg-teal-50 text-teal-700 border border-teal-200"
                  : candidate.status === "Interviewing"
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                  : candidate.status === "Rejected"
                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                  : "bg-amber-50 text-amber-800 border border-amber-200"
              }`}
            >
              Status: {candidate.status}
            </span>

            <Button
              onClick={() => handleStatusChange("Hired")}
              disabled={updating || candidate.status === "Hired"}
              className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-sm px-3.5 shadow-xs cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Hire</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange("Shortlisted")}
              disabled={updating}
              className="h-9 border-teal-300 text-teal-800 hover:bg-teal-50 text-xs font-semibold rounded-sm cursor-pointer inline-flex items-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5 text-teal-600" />
              <span>Shortlist</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange("Interviewing")}
              disabled={updating}
              className="h-9 border-indigo-300 text-indigo-800 hover:bg-indigo-50 text-xs font-semibold rounded-sm cursor-pointer inline-flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Interview</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange("Rejected")}
              disabled={updating}
              className="h-9 border-rose-300 text-rose-800 hover:bg-rose-50 text-xs font-semibold rounded-sm cursor-pointer inline-flex items-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Reject</span>
            </Button>
          </div>
        </div>

        {/* Top Header & Domain (Identical to Job Detail Page!) */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
            <span className="w-1 h-4 bg-[#FF7F50] rounded-full inline-block" />
            <span>{candidate.domain}</span>
            <span className="text-gray-300">•</span>
            <span className="font-mono text-gray-700 bg-gray-200/60 px-2 py-0.5 rounded text-[11px]">
              Ref ID: {candidate.id}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B192C] tracking-tight pt-1">
              {candidate.fullName}
            </h1>

            {candidate.linkedinUrl && (
              <a
                href={candidate.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-[#0077B5] font-bold text-xs rounded-sm flex items-center gap-1.5 transition-colors cursor-pointer w-fit"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>LinkedIn Profile</span>
              </a>
            )}
          </div>

          <p className="text-xs text-gray-600 font-semibold">
            Applied for position: <strong className="text-gray-900">{candidate.jobTitle}</strong> ({candidate.reqId})
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 font-medium pt-1">
            <span className="flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-[#FF7F50]" />
              {candidate.email}
            </span>
            <span className="text-gray-300">•</span>
            <span className="flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-[#FF7F50]" />
              {candidate.mobile}
            </span>
            <span className="text-gray-300">•</span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#FF7F50]" />
              {candidate.currentLocation} (Pref: {candidate.preferredLocation})
            </span>
            <span className="text-gray-300">•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              Applied {new Date(candidate.appliedAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Key Stats Bar (Identical layout to Job Detail Page!) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-gray-200/80">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
              TOTAL EXPERIENCE
            </span>
            <span className="text-base font-extrabold text-[#0B192C]">
              {candidate.totalExperience} Years
            </span>
          </div>
          <div className="md:border-l md:border-gray-200 md:pl-6">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
              CURRENT EMPLOYER
            </span>
            <span className="text-base font-extrabold text-gray-900">
              {candidate.currentCompany || "N/A"}
            </span>
          </div>
          <div className="md:border-l md:border-gray-200 md:pl-6">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
              CURRENT / EXPECTED CTC
            </span>
            <span className="text-base font-extrabold text-emerald-700">
              {candidate.currentCtc} → {candidate.expectedCtc}
            </span>
          </div>
          <div className="md:border-l md:border-gray-200 md:pl-6">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
              NOTICE PERIOD
            </span>
            <span className="text-base font-extrabold text-[#FF7F50]">
              {candidate.noticePeriod}
            </span>
          </div>
        </div>

        {/* Main Content Sections */}
        <div className="flex flex-col gap-8">
          {/* Resume Document Attachment Section */}
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-[#0B192C]">Resume Document &amp; File Payload</h2>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-200/90 rounded-sm p-5 shadow-2xs">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-sm bg-[#FF7F50]/10 text-[#FF7F50] flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{candidate.resumeName}</p>
                  <p className="text-xs text-gray-500 font-mono">
                    Attached Document • {(candidate.resumeSize ? candidate.resumeSize / 1024 / 1024 : 0.8).toFixed(2)} MB
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setIsPreviewOpen(true)}
                  className="h-9 bg-[#FF7F50] hover:bg-[#E56A3C] text-white font-bold text-xs rounded-sm px-4 shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview Resume</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={handleDownload}
                  className="h-9 border-gray-200 hover:bg-gray-100 text-xs font-semibold rounded-sm cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-gray-600" />
                  <span>Download</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Cover Statement */}
          {candidate.shortNote && (
            <div className="pt-6 border-t border-gray-200/80 flex flex-col gap-3">
              <h2 className="text-lg font-bold text-[#0B192C]">Candidate Short Cover Statement</h2>
              <p className="text-sm text-gray-700 leading-relaxed font-normal bg-white p-4 rounded-sm border border-gray-200/80 italic">
                &quot;{candidate.shortNote}&quot;
              </p>
            </div>
          )}

          {/* Hiring Timeline */}
          <div className="pt-6 border-t border-gray-200/80 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-[#0B192C]">Hiring Stage Audit &amp; Timeline</h2>

            <div className="space-y-4 pt-1">
              <div className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-xs">Application Submitted</h4>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">
                    {new Date(candidate.appliedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div
                  className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                    candidate.status !== "Under Review"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {candidate.status !== "Under Review" ? "✓" : "•"}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-xs">Initial Review &amp; Screening</h4>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">
                    Status: {candidate.status}
                  </p>
                </div>
              </div>

              {candidate.status === "Hired" && (
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    ★
                  </div>
                  <div>
                    <h4 className="font-extrabold text-emerald-800 text-xs">Candidate Hired</h4>
                    <p className="text-xs text-emerald-600 font-mono mt-0.5">
                      Offer accepted — hired for {candidate.jobTitle}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* HR Document Preview Modal */}
      {isPreviewOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-hidden"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div
            className="bg-white rounded-sm shadow-2xl max-w-4xl w-full h-[88vh] flex flex-col overflow-hidden text-gray-900 border border-[#E4E7EC]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Bar */}
            <div className="px-6 py-4 bg-[#0B192C] text-white flex items-center justify-between shrink-0 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-sm bg-[#FF7F50]/15 text-[#FF7F50] flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-white">{candidate.resumeName}</h3>
                    <span className="font-mono text-[10px] font-bold text-[#FF7F50] bg-[#FF7F50]/10 px-2 py-0.5 rounded-sm border border-[#FF7F50]/30">
                      {candidate.id}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-mono">
                    Candidate: {candidate.fullName} • Position: {candidate.jobTitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  onClick={handleDownload}
                  className="h-8 bg-[#FF7F50] hover:bg-[#E56A3C] text-white font-mono text-xs font-bold rounded-sm flex items-center gap-1.5 transition-colors cursor-pointer px-3.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </Button>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="w-8 h-8 rounded-sm bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Viewer Frame Body */}
            <div className="flex-1 bg-[#F7F8FA] overflow-y-auto p-4 sm:p-8 flex justify-center">
              {candidate.resumeDataUrl ? (
                <iframe
                  src={candidate.resumeDataUrl}
                  title="Candidate Resume Document Viewer"
                  className="w-full h-full min-h-[600px] rounded-sm border border-[#E4E7EC] bg-white shadow-md"
                />
              ) : (
                <div className="bg-white border border-[#E4E7EC] rounded-sm shadow-xl p-8 sm:p-12 w-full max-w-3xl font-sans space-y-8 text-gray-900 my-auto">
                  {/* Official Record Document Header */}
                  <div className="pb-6 border-b border-[#E4E7EC] flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-[#FF7F50] uppercase tracking-widest">
                        <span className="w-1.5 h-1.5 bg-[#FF7F50] rounded-full inline-block" />
                        <span>SI-GPT RECRUITMENT NETWORK</span>
                      </div>
                      <h2 className="text-3xl font-extrabold text-[#0B192C] font-sora">
                        {candidate.fullName}
                      </h2>
                      <p className="text-xs text-gray-600 font-semibold">
                        {candidate.jobTitle} • Requisition ID: <span className="font-mono text-[#0B192C]">{candidate.reqId}</span>
                      </p>
                    </div>

                    <div className="px-3.5 py-1.5 bg-[#0B192C] text-white font-mono text-[10px] font-bold uppercase tracking-wider rounded-sm shrink-0 self-start">
                      VERIFIED APPLICATION RECORD
                    </div>
                  </div>

                  {/* Specifications Grid Table */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8 text-xs font-inter">
                    <div className="flex justify-between items-center pb-2.5 border-b border-[#E4E7EC]">
                      <span className="text-gray-400 font-mono font-bold uppercase text-[10px] tracking-wider">Email Address</span>
                      <span className="font-semibold text-gray-900">{candidate.email}</span>
                    </div>

                    <div className="flex justify-between items-center pb-2.5 border-b border-[#E4E7EC]">
                      <span className="text-gray-400 font-mono font-bold uppercase text-[10px] tracking-wider">Mobile Phone</span>
                      <span className="font-semibold text-gray-900">{candidate.mobile}</span>
                    </div>

                    <div className="flex justify-between items-center pb-2.5 border-b border-[#E4E7EC]">
                      <span className="text-gray-400 font-mono font-bold uppercase text-[10px] tracking-wider">Current Location</span>
                      <span className="font-semibold text-gray-900">{candidate.currentLocation}</span>
                    </div>

                    <div className="flex justify-between items-center pb-2.5 border-b border-[#E4E7EC]">
                      <span className="text-gray-400 font-mono font-bold uppercase text-[10px] tracking-wider">Preferred Location</span>
                      <span className="font-semibold text-gray-900">{candidate.preferredLocation}</span>
                    </div>

                    <div className="flex justify-between items-center pb-2.5 border-b border-[#E4E7EC]">
                      <span className="text-gray-400 font-mono font-bold uppercase text-[10px] tracking-wider">Total Experience</span>
                      <span className="font-extrabold text-[#0B192C]">{candidate.totalExperience} Years</span>
                    </div>

                    <div className="flex justify-between items-center pb-2.5 border-b border-[#E4E7EC]">
                      <span className="text-gray-400 font-mono font-bold uppercase text-[10px] tracking-wider">Relevant Experience</span>
                      <span className="font-semibold text-gray-900">{candidate.relevantExperience} Years</span>
                    </div>

                    <div className="flex justify-between items-center pb-2.5 border-b border-[#E4E7EC]">
                      <span className="text-gray-400 font-mono font-bold uppercase text-[10px] tracking-wider">Current Employer</span>
                      <span className="font-bold text-gray-900">{candidate.currentCompany || "N/A"}</span>
                    </div>

                    <div className="flex justify-between items-center pb-2.5 border-b border-[#E4E7EC]">
                      <span className="text-gray-400 font-mono font-bold uppercase text-[10px] tracking-wider">Current / Expected CTC</span>
                      <span className="font-extrabold text-emerald-700">{candidate.currentCtc} → {candidate.expectedCtc}</span>
                    </div>

                    <div className="flex justify-between items-center pb-2.5 border-b border-[#E4E7EC]">
                      <span className="text-gray-400 font-mono font-bold uppercase text-[10px] tracking-wider">Notice Period</span>
                      <span className="font-extrabold text-[#FF7F50]">{candidate.noticePeriod}</span>
                    </div>

                    <div className="flex justify-between items-center pb-2.5 border-b border-[#E4E7EC]">
                      <span className="text-gray-400 font-mono font-bold uppercase text-[10px] tracking-wider">Application Date</span>
                      <span className="font-mono text-gray-900 font-semibold">{new Date(candidate.appliedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Cover Statement Callout */}
                  {candidate.shortNote && (
                    <div className="pt-2 space-y-2">
                      <span className="text-gray-400 font-mono font-bold uppercase tracking-wider text-[10px] block">
                        Candidate Cover Statement
                      </span>
                      <p className="text-xs text-gray-700 leading-relaxed font-normal bg-[#F7F8FA] p-4 rounded-sm border border-[#E4E7EC] italic">
                        &quot;{candidate.shortNote}&quot;
                      </p>
                    </div>
                  )}

                  {/* Document Footer */}
                  <div className="pt-6 border-t border-[#E4E7EC] flex items-center justify-between text-[11px] font-mono text-gray-400">
                    <span>File Payload: {candidate.resumeName}</span>
                    <span>Status: {candidate.status}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}