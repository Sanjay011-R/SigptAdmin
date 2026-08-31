import { useEffect } from "react"
import { MainLayout } from "@/layouts/main-layout"
import { useAuditLogger } from "@/hooks/use-audit-logger"
import { useAuth } from "@/hooks/use-auth"
import { useDashboardData } from "./hooks/use-dashboard-data"
import { WelcomeBanner } from "./components/welcome-banner"
import { KPIMetricsGrid } from "./components/kpi-metrics-grid"
import { HiringPipeline } from "./components/hiring-pipeline"
import { ActiveJobsTable } from "./components/active-jobs-table"
import { ProjectProgress } from "./components/project-progress"
import { RecentRequests } from "./components/recent-requests"
import { RecentActivity } from "./components/recent-activity"

export function DashboardPage() {
  const { logPageView } = useAuditLogger()
  const { permissions, onlineUsers } = useAuth()
  const { jobs, candidates, projects, requests, activity, loading } = useDashboardData()

  useEffect(() => {
    logPageView("Dashboard")
  }, [logPageView])

  const openJobsCount = jobs.filter((j) => j.status === "Open").length
  const totalOpeningsCount = jobs
    .filter((j) => j.status === "Open")
    .reduce((sum, j) => sum + (j.openings || 1), 0)
  const activeProjectsCount = projects.filter((p) => p.status === "Published").length
  const newRequestsCount = requests.filter((r) => r.status === "New").length

  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        {/* Welcome Hero Banner */}
        <WelcomeBanner
          openJobsCount={openJobsCount}
          newRequestsCount={newRequestsCount}
          activeProjectsCount={activeProjectsCount}
        />

        {/* Loading Skeleton or Main Dashboard Content */}
        {loading ? (
          <div className="flex flex-col gap-6 animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200/70 rounded-2xl" />
              ))}
            </div>
            <div className="h-48 bg-gray-200/70 rounded-2xl" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-200/70 rounded-2xl" />
              <div className="h-64 bg-gray-200/70 rounded-2xl" />
            </div>
          </div>
        ) : (
          <>
            {/* KPI Stat Cards Grid (6 metrics) */}
            <KPIMetricsGrid
              openJobsCount={openJobsCount}
              totalCandidatesCount={candidates.length}
              activeProjectsCount={activeProjectsCount}
              newRequestsCount={newRequestsCount}
              totalOpeningsCount={totalOpeningsCount}
              onlineUsersCount={onlineUsers.length || 1}
            />

            {/* Hiring Pipeline Funnel */}
            {permissions.canViewCandidates && (
              <HiringPipeline candidates={candidates} />
            )}

            {/* Grid Row 1: Active Jobs Table & Project Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {permissions.canManageJobs && <ActiveJobsTable jobs={jobs} />}
              {permissions.canEditProjects && (
                <ProjectProgress projects={projects} />
              )}
            </div>

            {/* Grid Row 2: Recent Requests & System Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentRequests requests={requests} />
              {permissions.canViewAuditLogs && (
                <RecentActivity activity={activity} />
              )}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  )
}
