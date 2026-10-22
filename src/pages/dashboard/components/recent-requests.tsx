import { useNavigate } from "react-router-dom"
import type { ContactRequestItem } from "@/pages/requests/requests-page"
import { MessageSquare, ArrowRight, Building2 } from "lucide-react"

interface RecentRequestsProps {
  requests: ContactRequestItem[]
}

export function RecentRequests({ requests }: RecentRequestsProps) {
  const navigate = useNavigate()
  const recent = requests.slice(0, 5)

  const statusBadges: Record<string, string> = {
    New: "bg-rose-100 text-rose-800",
    "Pending Response": "bg-amber-100 text-amber-800",
    Resolved: "bg-emerald-100 text-emerald-800",
  }

  return (
    <div className="bg-white rounded-sm border border-gray-200 p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#081B33]">Recent Contact Requests</h2>
          <p className="text-xs text-gray-500">Corporate & meeting inquiries from landing page</p>
        </div>
        <button
          onClick={() => navigate("/requests")}
          className="text-xs font-semibold text-[#081B33] hover:text-[#FF7A00] cursor-pointer flex items-center gap-1 transition-colors"
        >
          View All ({requests.length}) <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {recent.length === 0 ? (
        <div className="py-12 text-center text-xs text-gray-500 flex flex-col items-center gap-2">
          <MessageSquare className="w-8 h-8 text-gray-300" />
          <span>No requests received yet.</span>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-gray-100">
          {recent.map((req) => (
            <div
              key={req.id}
              onClick={() => navigate("/requests")}
              className="py-3 px-2 rounded-sm flex items-center justify-between gap-4 hover:bg-gray-50/80 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-sm bg-gray-100 border border-gray-200 text-[#081B33] flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-[#081B33] group-hover:text-white transition-colors">
                  {req.name?.charAt(0).toUpperCase() || "R"}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-gray-900 group-hover:text-[#FF7A00] transition-colors truncate">
                    {req.name}
                  </span>
                  <span className="text-[11px] text-gray-500 truncate flex items-center gap-1">
                    <Building2 className="w-3 h-3 shrink-0 text-gray-400" />
                    {req.company || "Direct Inquiry"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <span className="hidden sm:inline px-2 py-0.5 bg-gray-100 text-gray-700 rounded-sm text-[10px] font-medium capitalize">
                  {req.type || "Inquiry"}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-sm text-[11px] font-semibold ${
                    statusBadges[req.status] || "bg-rose-100 text-rose-800"
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

