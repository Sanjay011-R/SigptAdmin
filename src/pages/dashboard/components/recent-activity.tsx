import { useNavigate } from "react-router-dom"
import type { AuditLogRecord } from "@/services/audit-log-service"
import {
  Activity,
  ArrowRight,
  Briefcase,
  Users,
  Shield,
  Cog,
  User,
} from "lucide-react"

interface RecentActivityProps {
  activity: AuditLogRecord[]
}

export function RecentActivity({ activity }: RecentActivityProps) {
  const navigate = useNavigate()
  const recent = activity.slice(0, 5)

  const categoryIcons: Record<string, any> = {
    Jobs: Briefcase,
    Candidates: Users,
    Security: Shield,
    Users: User,
    System: Cog,
  }

  return (
    <div className="bg-white rounded-sm border border-gray-200 p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#081B33]">Recent System Activity</h2>
          <p className="text-xs text-gray-500">Live audit events across platform modules</p>
        </div>
        <button
          onClick={() => navigate("/activity-log")}
          className="text-xs font-semibold text-[#081B33] hover:text-[#FF7A00] cursor-pointer flex items-center gap-1 transition-colors"
        >
          View Full Audit Log <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {recent.length === 0 ? (
        <div className="py-12 text-center text-xs text-gray-500 flex flex-col items-center gap-2">
          <Activity className="w-8 h-8 text-gray-300" />
          <span>No recent activity recorded.</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {recent.map((log) => {
            const Icon = categoryIcons[log.category] || Activity

            return (
              <div
                key={log.id}
                onClick={() => navigate("/activity-log")}
                className="flex items-start gap-3 p-2.5 rounded-sm hover:bg-gray-50 transition-colors cursor-pointer group"
              >
                <div className="p-2 rounded-sm bg-gray-100 text-[#081B33] group-hover:bg-[#081B33] group-hover:text-white transition-colors shrink-0 mt-0.5">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-gray-900 group-hover:text-[#FF7A00] transition-colors truncate">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono shrink-0">
                      {log.formattedTime}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 truncate">
                    {log.details || log.targetEntity}
                  </p>
                  <span className="text-[10px] font-medium text-gray-400 mt-0.5">
                    by {log.actor?.name || "System"}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

