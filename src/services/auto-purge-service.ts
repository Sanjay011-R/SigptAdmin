import { supabase } from "@/lib/supabase"
import { getLocalApplications, STORAGE_KEY as APPS_STORAGE_KEY } from "@/services/application-storage-service"

export interface AutoPurgeResult {
  success: boolean
  applicationsDeleted: number
  requestsDeleted: number
  auditLogsDeleted: number
  error?: string
}

/**
 * Execute system auto-purge based on active platform_settings:
 * - Automatically deletes candidate applications older than candidate_purge_retention days (if auto_delete_candidate_data enabled)
 * - Automatically deletes client requests older than request_purge_days
 * - Automatically deletes audit logs older than audit_log_retention days (if auto_delete_audit_logs enabled)
 * - Purges legacy Page Accessed view clutter
 */
export async function executeSystemAutoPurge(): Promise<AutoPurgeResult> {
  const result: AutoPurgeResult = {
    success: true,
    applicationsDeleted: 0,
    requestsDeleted: 0,
    auditLogsDeleted: 0,
  }

  // 1. Try Supabase RPC first if migration was run
  try {
    const { data: rpcData, error: rpcErr } = await supabase.rpc("run_system_auto_purge")
    if (!rpcErr && rpcData) {
      result.applicationsDeleted = Number(rpcData.applications_deleted || 0)
      result.requestsDeleted = Number(rpcData.requests_deleted || 0)
      result.auditLogsDeleted = Number(rpcData.audit_logs_deleted || 0)
      return result
    }
  } catch {
    // Fall back to direct queries below
  }

  // 2. Client-side fallback against Supabase REST API
  try {
    const { data: settings } = await supabase
      .from("platform_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle()

    const candidateRetentionStr = String(settings?.candidate_purge_retention ?? "180 days").toLowerCase()
    const isCandNever = candidateRetentionStr === "never"
    const candidateRetentionDays = isCandNever ? 0 : (parseInt(candidateRetentionStr.replace(/\D/g, ""), 10) || 180)
    const autoDeleteCandidateData = isCandNever ? false : (settings?.auto_delete_candidate_data ?? true)

    const requestPurgeDays = Number(settings?.request_purge_days ?? 365)

    const auditRetentionStr = String(settings?.audit_log_retention ?? "45 days").toLowerCase()
    const isAuditNever = auditRetentionStr === "never"
    const auditRetentionDays = isAuditNever ? 0 : (parseInt(auditRetentionStr.replace(/\D/g, ""), 10) || 45)
    const autoDeleteAuditLogs = isAuditNever ? false : (settings?.auto_delete_audit_logs ?? true)

    const now = new Date()

    // A. Auto-Delete Candidate Applications (skipped if 'never')
    if (autoDeleteCandidateData && candidateRetentionDays > 0) {
      const candThreshold = new Date(now.getTime() - candidateRetentionDays * 24 * 60 * 60 * 1000).toISOString()

      const { data: deletedApps, error: delAppErr } = await supabase
        .from("candidate_applications")
        .delete()
        .lt("applied_at", candThreshold)
        .select("id")

      if (!delAppErr && deletedApps) {
        result.applicationsDeleted = deletedApps.length
      }

      // Sync local storage applications
      try {
        const localApps = getLocalApplications()
        const keptApps = localApps.filter((a) => {
          if (a.appliedAt) {
            const date = new Date(a.appliedAt)
            if (date.getTime() < now.getTime() - candidateRetentionDays * 24 * 60 * 60 * 1000) {
              return false
            }
          }
          return true
        })
        if (keptApps.length !== localApps.length) {
          localStorage.setItem(APPS_STORAGE_KEY, JSON.stringify(keptApps))
        }
      } catch {}
    }

    // B. Auto-Delete Old Contact Requests
    if (requestPurgeDays > 0) {
      const reqThreshold = new Date(now.getTime() - requestPurgeDays * 24 * 60 * 60 * 1000).toISOString()

      const { data: deletedReqs, error: delReqErr } = await supabase
        .from("contact_requests")
        .delete()
        .lt("created_at", reqThreshold)
        .select("id")

      if (!delReqErr && deletedReqs) {
        result.requestsDeleted = deletedReqs.length
      }
    }

    // C. Auto-Delete Old Audit Logs & Page Accessed View Clutter
    if (autoDeleteAuditLogs && auditRetentionDays > 0) {
      const auditThreshold = new Date(now.getTime() - auditRetentionDays * 24 * 60 * 60 * 1000).toISOString()

      const { data: deletedAudits, error: delAuditErr } = await supabase
        .from("audit_logs")
        .delete()
        .or(`created_at.lt.${auditThreshold},type.eq.access,action.ilike.Page Accessed:%`)
        .select("id")

      if (!delAuditErr && deletedAudits) {
        result.auditLogsDeleted = deletedAudits.length
      }
    } else {
      // If 'never', preserve mutation logs and purge only Page Accessed view clutter
      const { data: deletedViews, error: delViewErr } = await supabase
        .from("audit_logs")
        .delete()
        .or("type.eq.access,action.ilike.Page Accessed:%")
        .select("id")

      if (!delViewErr && deletedViews) {
        result.auditLogsDeleted = deletedViews.length
      }
    }

    return result
  } catch (err: any) {
    console.error("[AutoPurgeService] Cleanup error:", err)
    result.error = err?.message || "Failed to complete auto-purge."
    return result
  }
}
