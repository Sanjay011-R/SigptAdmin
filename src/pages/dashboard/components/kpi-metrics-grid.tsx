import { useNavigate } from "react-router-dom"
import { MetricCard } from "./metric-card"
import {
  Briefcase,
  Users,
  FolderKanban,
  MessageSquare,
  UserCheck,
  Radio,
} from "lucide-react"

interface KPIMetricsGridProps {
  openJobsCount: number
  totalCandidatesCount: number
  activeProjectsCount: number
  newRequestsCount: number
  totalOpeningsCount: number
  onlineUsersCount: number
}

export function KPIMetricsGrid({
  openJobsCount,
  totalCandidatesCount,
  activeProjectsCount,
  newRequestsCount,
  totalOpeningsCount,
  onlineUsersCount,
}: KPIMetricsGridProps) {
  const navigate = useNavigate()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <MetricCard
        label="Open Jobs"
        value={openJobsCount}
        subtext="Active Requisitions"
        subtextType="positive"
        icon={Briefcase}
        iconBg="bg-indigo-50"
        iconColor="text-indigo-600"
        onClick={() => navigate("/jobs")}
      />

      <MetricCard
        label="Total Candidates"
        value={totalCandidatesCount}
        subtext="Applications Received"
        subtextType="info"
        icon={Users}
        iconBg="bg-blue-50"
        iconColor="text-blue-600"
        onClick={() => navigate("/applications")}
      />

      <MetricCard
        label="Active Projects"
        value={activeProjectsCount}
        subtext="Hiring Drives"
        subtextType="neutral"
        icon={FolderKanban}
        iconBg="bg-purple-50"
        iconColor="text-purple-600"
        onClick={() => navigate("/projects")}
      />

      <MetricCard
        label="New Requests"
        value={newRequestsCount}
        subtext={newRequestsCount > 0 ? "Requires action" : "All clear"}
        subtextType={newRequestsCount > 0 ? "negative" : "positive"}
        icon={MessageSquare}
        iconBg="bg-rose-50"
        iconColor="text-rose-600"
        onClick={() => navigate("/requests")}
      />

      <MetricCard
        label="Total Openings"
        value={totalOpeningsCount}
        subtext="Target Positions"
        subtextType="positive"
        icon={UserCheck}
        iconBg="bg-emerald-50"
        iconColor="text-emerald-600"
        onClick={() => navigate("/jobs")}
      />

      <MetricCard
        label="Online Team"
        value={onlineUsersCount}
        subtext="Active Now"
        subtextType="positive"
        icon={Radio}
        iconBg="bg-amber-50"
        iconColor="text-amber-600"
      />
    </div>
  )
}
