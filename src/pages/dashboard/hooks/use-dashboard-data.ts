import { useState, useEffect, useCallback } from "react"
import { fetchAllJobs } from "@/services/job-storage-service"
import type { JobRequirement } from "@/types/job-types"
import { fetchCandidateApplications } from "@/services/application-storage-service"
import type { CandidateApplicationRecord } from "@/services/application-storage-service"
import { fetchProjects } from "@/services/project-storage-service"
import type { ProjectRecord } from "@/services/project-storage-service"
import { fetchContactRequests } from "@/services/request-storage-service"
import type { ContactRequestItem } from "@/pages/requests/requests-page"
import { fetchRecentAuditLogs } from "@/services/audit-log-service"
import type { AuditLogRecord } from "@/services/audit-log-service"

export interface DashboardData {
  jobs: JobRequirement[]
  candidates: CandidateApplicationRecord[]
  projects: ProjectRecord[]
  requests: ContactRequestItem[]
  activity: AuditLogRecord[]
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData>({
    jobs: [],
    candidates: [],
    projects: [],
    requests: [],
    activity: [],
  })
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [jobsRes, candidatesRes, projectsRes, requestsRes, activityRes] = await Promise.allSettled([
        fetchAllJobs(),
        fetchCandidateApplications(),
        fetchProjects(),
        fetchContactRequests(),
        fetchRecentAuditLogs(5),
      ])

      setData({
        jobs: jobsRes.status === "fulfilled" ? jobsRes.value : [],
        candidates: candidatesRes.status === "fulfilled" ? candidatesRes.value : [],
        projects: projectsRes.status === "fulfilled" ? projectsRes.value : [],
        requests: requestsRes.status === "fulfilled" ? requestsRes.value : [],
        activity: activityRes.status === "fulfilled" ? activityRes.value : [],
      })
    } catch (err: any) {
      console.error("Dashboard data load error:", err)
      setError(err?.message || "Failed to load dashboard data.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  return {
    ...data,
    loading,
    error,
    refetch: loadData,
  }
}
