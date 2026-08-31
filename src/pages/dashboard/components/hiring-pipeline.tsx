import { useNavigate } from "react-router-dom"
import type { CandidateApplicationRecord } from "@/services/application-storage-service"
import { Clock, Star, UserCheck, CheckCircle2, XCircle, ArrowRight } from "lucide-react"

interface HiringPipelineProps {
  candidates: CandidateApplicationRecord[]
}

export function HiringPipeline({ candidates }: HiringPipelineProps) {
  const navigate = useNavigate()
  const total = candidates.length || 1 // Avoid division by zero

  const counts = {
    underReview: candidates.filter((c) => c.status === "Under Review").length,
    shortlisted: candidates.filter((c) => c.status === "Shortlisted").length,
    interviewing: candidates.filter((c) => c.status === "Interviewing").length,
    hired: candidates.filter((c) => c.status === "Hired").length,
    rejected: candidates.filter((c) => c.status === "Rejected").length,
  }

  const stages = [
    {
      key: "Under Review",
      count: counts.underReview,
      pct: Math.round((counts.underReview / total) * 100),
      label: "Under Review",
      color: "bg-amber-500",
      textColor: "text-amber-700",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200/80",
      icon: Clock,
    },
    {
      key: "Shortlisted",
      count: counts.shortlisted,
      pct: Math.round((counts.shortlisted / total) * 100),
      label: "Shortlisted",
      color: "bg-indigo-500",
      textColor: "text-indigo-700",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200/80",
      icon: Star,
    },
    {
      key: "Interviewing",
      count: counts.interviewing,
      pct: Math.round((counts.interviewing / total) * 100),
      label: "Interviewing",
      color: "bg-purple-500",
      textColor: "text-purple-700",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200/80",
      icon: UserCheck,
    },
    {
      key: "Hired",
      count: counts.hired,
      pct: Math.round((counts.hired / total) * 100),
      label: "Hired",
      color: "bg-emerald-500",
      textColor: "text-emerald-700",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200/80",
      icon: CheckCircle2,
    },
    {
      key: "Rejected",
      count: counts.rejected,
      pct: Math.round((counts.rejected / total) * 100),
      label: "Rejected",
      color: "bg-rose-400",
      textColor: "text-rose-700",
      bgColor: "bg-rose-50",
      borderColor: "border-rose-200/80",
      icon: XCircle,
    },
  ]

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900">Hiring Pipeline Funnel</h2>
          <p className="text-xs text-gray-500">
            Real-time candidate conversion across recruitment stages ({candidates.length} total)
          </p>
        </div>
        <button
          onClick={() => navigate("/applications")}
          className="text-xs font-semibold text-[#0B192C] hover:underline cursor-pointer flex items-center gap-1"
        >
          View All Applications <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Visual Progress Stacked Bar */}
      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex gap-0.5">
        {stages.map(
          (st) =>
            st.count > 0 && (
              <div
                key={st.key}
                className={`h-full ${st.color} transition-all duration-500`}
                style={{ width: `${(st.count / total) * 100}%` }}
                title={`${st.label}: ${st.count} (${st.pct}%)`}
              />
            )
        )}
      </div>

      {/* Stage Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stages.map((st) => {
          const Icon = st.icon
          return (
            <div
              key={st.key}
              onClick={() => navigate("/applications")}
              className={`p-3.5 rounded-xl border ${st.borderColor} ${st.bgColor} flex flex-col gap-2 cursor-pointer hover:shadow-xs transition-all`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <Icon className={`w-3.5 h-3.5 ${st.textColor}`} />
                  {st.label}
                </span>
                <span className={`text-xs font-bold ${st.textColor}`}>{st.pct}%</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-extrabold text-gray-900">{st.count}</span>
                <span className="text-[11px] text-gray-500 font-medium">candidates</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
