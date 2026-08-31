import { useNavigate } from "react-router-dom"
import type { ContactRequestItem } from "@/pages/requests/requests-page"
import { MessageSquare, ArrowRight, Building2, Calendar } from "lucide-react"

interface RecentRequestsProps {
  requests: ContactRequestItem[]
}

export function RecentRequests({ requests }: RecentRequestsProps) {
  const navigate = useNavigate()
  const recent = requests.slice(0, 5)

  const statusBadges: Record<string, string> = {
    New: "bg-rose-50 text-rose-700 border-rose-200",
    "Pending Response": "bg-amber-50 text-amber-700 border-amber-200",
    Resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900">Recent Contact Requests</h2>
          <p className="text-xs text-gray-500">Corporate & meeting inquiries from landing page</p>
        </div>
        <button
          onClick={() => navigate("/requests")}
          className="text-xs font-semibold text-[#0B192C] hover:underline cursor-pointer flex items-center gap-1"
        >
          View All ({requests.length}) <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {recent.length === 0 ? (
        <div className="py-8 text-center text-xs text-gray-500 flex flex-col items-center gap-2">
          <MessageSquare className="w-8 h-8 text-gray-300" />
          <span>No requests received yet.</span>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-gray-100">
          {recent.map((req) => (
            <div
              key={req.id}
              onClick={() => navigate("/requests")}
              className="py-3.5 flex items-center justify-between gap-4 hover:bg-gray-50/70 rounded-lg px-2 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                  {req.name?.charAt(0).toUpperCase() || "R"}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-gray-900 truncate">
                    {req.name}
                  </span>
                  <span className="text-[11px] text-gray-500 truncate flex items-center gap-1">
                    <Building2 className="w-3 h-3 shrink-0" />
                    {req.company || "Direct Inquiry"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="hidden sm:inline px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium capitalize">
                  {req.type || "Inquiry"}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                    statusBadges[req.status] || statusBadges.New
                  }`}
                >
                  {req.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
