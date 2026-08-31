import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { User, Session } from "@supabase/supabase-js"
import { validateAccessToken } from "@/lib/auth-utils"
import { usePresence } from "@/hooks/use-presence"
import {
  bindSessionFingerprint,
  evaluateFingerprintMismatch,
} from "@/services/session-fingerprint-service"
import { recordAuditLogAsync } from "@/services/audit-log-service"

export interface UserPermissions {
  canManageJobs: boolean
  canViewCandidates: boolean
  canEditProjects: boolean
  canManageUsers: boolean
  canViewAuditLogs: boolean
}

function parsePermissions(raw: any): Record<string, boolean> | null {
  if (!raw) return null
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  }
  if (typeof raw === "object") return raw
  return null
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isValidated, setIsValidated] = useState(false)
  const [requiresStepUpAuth, setRequiresStepUpAuth] = useState(false)
  const [stepUpReason, setStepUpReason] = useState<string>("")
  const [profile, setProfile] = useState<{
    role?: string
    permissions?: any
  } | null>(null)

  // Track online presence
  const { onlineUsers } = usePresence(user)

  useEffect(() => {
    // Initial session loading & server validation
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.access_token) {
          // Validate token with Supabase Auth server using getUser()
          const validation = await validateAccessToken(session.access_token)
          if (validation.isValid && validation.user) {
            setSession(session)
            setUser(validation.user)
            setIsValidated(true)

            // Check session fingerprint consistency
            const fpCheck = evaluateFingerprintMismatch()
            if (fpCheck.isMismatch) {
              if (fpCheck.confidence === "high") {
                setRequiresStepUpAuth(true)
                setStepUpReason(fpCheck.reason || "Device fingerprint mismatch detected.")
                await recordAuditLogAsync({
                  action: "MFA & Session Hijacking Alert: Fingerprint Mismatch",
                  category: "Security",
                  type: "security",
                  targetEntity: `Auth Session (${validation.user.email})`,
                  details: fpCheck.reason || "OS and Browser engine changed mid-session.",
                  actorName: validation.user.user_metadata?.full_name || validation.user.email?.split("@")[0],
                  actorEmail: validation.user.email,
                })
              } else {
                // Low confidence mismatch (informational log only)
                await recordAuditLogAsync({
                  action: "Session Telemetry Info: Device Parameter Changed",
                  category: "Security",
                  type: "access",
                  targetEntity: `Auth Session (${validation.user.email})`,
                  details: fpCheck.reason || "Minor hardware parameter change detected.",
                  actorName: validation.user.user_metadata?.full_name || validation.user.email?.split("@")[0],
                  actorEmail: validation.user.email,
                })
              }
            }

            // Fetch profile immediately before setting loading false
            try {
              const { data: profData } = await supabase
                .from("profiles")
                .select("role, permissions")
                .eq("id", validation.user.id)
                .maybeSingle()

              if (profData) {
                setProfile({
                  role: profData.role,
                  permissions: profData.permissions,
                })
              }
            } catch {}
          } else {
            // Token invalid or expired according to Supabase server
            await supabase.auth.signOut()
            setSession(null)
            setUser(null)
            setIsValidated(false)
          }
        } else {
          setSession(null)
          setUser(null)
          setIsValidated(false)
        }
      } catch {
        setSession(null)
        setUser(null)
        setIsValidated(false)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (newSession?.access_token) {
        setSession(newSession)
        setUser(newSession.user)
        setIsValidated(true)
        bindSessionFingerprint()
      } else {
        setSession(null)
        setUser(null)
        setIsValidated(false)
        setProfile(null)
        setRequiresStepUpAuth(false)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Subscribe to real-time profile updates
  useEffect(() => {
    if (!user?.id) {
      setProfile(null)
      return
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("role, permissions")
          .eq("id", user.id)
          .maybeSingle()

        if (data && !error) {
          setProfile({
            role: data.role,
            permissions: data.permissions,
          })
        }
      } catch (err) {
        console.error("Failed to fetch user profile:", err)
      }
    }

    fetchProfile()

    // Realtime channel for live permission updates
    const channelName = `profile_updates_${user.id}`
    const existingChannels = supabase.getChannels()
    existingChannels.forEach((ch) => {
      if (ch.topic === `realtime:${channelName}` || ch.topic === channelName) {
        supabase.removeChannel(ch)
      }
    })

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes" as any,
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            setProfile({
              role: payload.new.role,
              permissions: payload.new.permissions,
            })
          }
        }
      )

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  const logout = async () => {
    await supabase.auth.signOut()
  }

  // Derive role and permissions from live profile (fallback to Super Admin)
  const rawRole = profile?.role || user?.user_metadata?.role || "Super Admin"
  const activePermissions = parsePermissions(profile?.permissions) || parsePermissions(user?.user_metadata?.permissions)
  const normalizedRole = String(rawRole).toLowerCase().trim()
  const isSuperAdmin =
    normalizedRole === "super admin" ||
    normalizedRole === "admin" ||
    normalizedRole.includes("admin") ||
    !user?.user_metadata?.role

  const effectiveRole = isSuperAdmin ? "Super Admin" : rawRole
  const hasExplicitPermissions = !!activePermissions && typeof activePermissions === "object"

  const permissions: UserPermissions = {
    canManageJobs: isSuperAdmin || (hasExplicitPermissions ? Boolean(activePermissions.canManageJobs) : true),
    canViewCandidates: isSuperAdmin || (hasExplicitPermissions ? Boolean(activePermissions.canViewCandidates) : true),
    canEditProjects: isSuperAdmin || (hasExplicitPermissions ? Boolean(activePermissions.canEditProjects) : true),
    canManageUsers: isSuperAdmin || (hasExplicitPermissions ? Boolean(activePermissions.canManageUsers) : true),
    canViewAuditLogs: isSuperAdmin || (hasExplicitPermissions ? Boolean(activePermissions.canViewAuditLogs) : true),
  }

  const resolveStepUpAuth = () => {
    bindSessionFingerprint()
    setRequiresStepUpAuth(false)
    setStepUpReason("")
  }

  return {
    user,
    session,
    loading,
    isValidated,
    requiresStepUpAuth,
    stepUpReason,
    resolveStepUpAuth,
    role: effectiveRole,
    permissions,
    logout,
    onlineUsers,
    isAuthenticated: !!user,
    validateToken: validateAccessToken,
  }
}
