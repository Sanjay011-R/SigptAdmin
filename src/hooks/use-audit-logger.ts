import { useCallback } from "react"
import { useAuth } from "@/hooks/use-auth"
import {
  recordAuditLogAsync,
  type AuditChangeItem,
} from "@/services/audit-log-service"

export function useAuditLogger() {
  const { user, role, loading } = useAuth()

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || ""
  const userEmail = user?.email || ""
  const userRole = role || "Recruiter"

  const logPageView = useCallback(
    async (pageTitle: string) => {
      // Don't log page views while auth session is initializing or if no user is logged in
      if (loading || !userEmail) return

      await recordAuditLogAsync({
        action: `Page Accessed: ${pageTitle}`,
        category: "System",
        type: "access",
        targetEntity: pageTitle,
        details: `User ${userName || userEmail} accessed route '${pageTitle}'.`,
        actorName: userName || userEmail,
        actorEmail: userEmail,
        actorRole: userRole,
      })
    },
    [loading, userName, userEmail, userRole]
  )

  const logStateMutation = useCallback(
    async (params: {
      category: "Jobs" | "Candidates" | "Users" | "Security" | "System"
      action: string
      type: "create" | "update" | "delete" | "security" | "access"
      targetEntity: string
      details: string
      changes?: AuditChangeItem[]
    }) => {
      await recordAuditLogAsync({
        ...params,
        actorName: userName,
        actorEmail: userEmail,
        actorRole: userRole,
      })
    },
    [userName, userEmail, userRole]
  )

  const logSecurityEvent = useCallback(
    async (action: string, details: string, changes?: AuditChangeItem[]) => {
      await recordAuditLogAsync({
        action,
        category: "Security",
        type: "security",
        targetEntity: "Session Auth Channel",
        details,
        changes,
        actorName: userName,
        actorEmail: userEmail,
        actorRole: userRole,
      })
    },
    [userName, userEmail, userRole]
  )

  return {
    logPageView,
    logStateMutation,
    logSecurityEvent,
  }
}
