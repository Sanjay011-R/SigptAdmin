import { Routes, Route, Navigate, Outlet } from "react-router-dom"
import { useAuth, type UserPermissions } from "@/hooks/use-auth"
import { LoginPage } from "@/pages/auth/login-page"
import { DashboardPage } from "@/pages/dashboard/dashboard-page"
import { UserManagementPage } from "@/pages/users/user-management-page"
import { CreateUserPage } from "@/pages/users/create-user-page"
import { JobsPage } from "@/pages/jobs/jobs-page"
import { JobDetailPage } from "@/pages/jobs/job-detail-page"
import { CreateJobPage } from "@/pages/jobs/create-job-page"
import { ApplicationsPage } from "@/pages/applications/applications-page"
import { CandidateDetailPage } from "@/pages/applications/candidate-detail-page"
import { ProjectsPage } from "@/pages/projects/projects-page"
import { CreateProjectPage } from "@/pages/projects/create-project-page"
import { ProjectDetailPage } from "@/pages/projects/project-detail-page"
import { RequestsPage } from "@/pages/requests/requests-page"
import { ProfilePage } from "@/pages/profile/profile-page"
import { SettingsPage } from "@/pages/settings/settings-page"
import { ActivityLogPage } from "@/pages/activity-log/activity-log-page"
import { SigptLoader } from "@/components/ui/sigpt-loader"

function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#FAF8F5]">
        <SigptLoader size={110} color="#FF7F50" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

function PublicRoute() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#FAF8F5]">
        <SigptLoader size={110} color="#FF7F50" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

function PermissionRoute({ permissionKey }: { permissionKey: keyof UserPermissions }) {
  const { permissions, loading } = useAuth()

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#FAF8F5]">
        <SigptLoader size={110} color="#FF7F50" />
      </div>
    )
  }

  if (!permissions[permissionKey]) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Public routes for unauthenticated users */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Protected routes for authenticated users */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* User Management Section (Restricted by canManageUsers) */}
        <Route element={<PermissionRoute permissionKey="canManageUsers" />}>
          <Route path="/users" element={<UserManagementPage />} />
          <Route path="/users/create" element={<CreateUserPage />} />
        </Route>

        {/* Job Management Section (Restricted by canManageJobs) */}
        <Route element={<PermissionRoute permissionKey="canManageJobs" />}>
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/create" element={<CreateJobPage />} />
          <Route path="/jobs/edit/:id" element={<CreateJobPage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />
        </Route>

        {/* Candidate & Applications Section (Restricted by canViewCandidates) */}
        <Route element={<PermissionRoute permissionKey="canViewCandidates" />}>
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/applications/:id" element={<CandidateDetailPage />} />
        </Route>

        {/* Projects Section (Restricted by canEditProjects) */}
        <Route element={<PermissionRoute permissionKey="canEditProjects" />}>
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/create" element={<CreateProjectPage />} />
          <Route path="/projects/edit/:id" element={<CreateProjectPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
        </Route>

        {/* Activity Audit Log Section (Restricted by canViewAuditLogs) */}
        <Route element={<PermissionRoute permissionKey="canViewAuditLogs" />}>
          <Route path="/activity-log" element={<ActivityLogPage />} />
        </Route>

        <Route path="/requests" element={<RequestsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
