import { supabase } from "@/lib/supabase"

export interface AuditChangeItem {
  field: string
  from: string
  to: string
}

export interface UserFingerprint {
  ipAddress: string
  browser: string
  os: string
  deviceType: string
  location: string
  sessionId: string
  userAgent: string
  screenResolution: string
  timezone: string
  language: string
}

export interface AuditLogRecord {
  id: string
  timestamp: string // ISO timestamp
  formattedTime: string
  actor: {
    name: string
    email: string
    role: string
  }
  action: string
  category: "Jobs" | "Candidates" | "Users" | "Security" | "System"
  type: "create" | "update" | "delete" | "security" | "access"
  targetEntity: string
  details: string
  changes?: AuditChangeItem[]
  fingerprint: UserFingerprint
}

export interface AuditLogPageFilters {
  search?: string
  category?: string
  actor?: string
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
}

export interface AuditLogStats {
  total: number
  security: number
  actors: number
  last24h: number
}

export const AUDIT_LOG_PAGE_SIZE = 10

interface AuditLogRow {
  id?: string | number | null
  created_at?: string | null
  actor_name?: string | null
  actor_email?: string | null
  actor_role?: string | null
  action?: string | null
  category?: string | null
  type?: string | null
  target_entity?: string | null
  details?: string | null
  changes?: AuditChangeItem[] | null
  ip_address?: string | null
  browser?: string | null
  os?: string | null
  device_type?: string | null
  location?: string | null
  session_id?: string | null
  user_agent?: string | null
  screen_resolution?: string | null
  timezone?: string | null
  language?: string | null
}

function mapAuditLogRow(row: AuditLogRow): AuditLogRecord {
  return {
    id: String(row.id),
    timestamp: row.created_at || new Date().toISOString(),
    formattedTime: new Date(row.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    actor: {
      name: row.actor_name || "User",
      email: row.actor_email || "",
      role: row.actor_role || "Recruiter",
    },
    action: row.action || "Action Executed",
    category: row.category as AuditLogRecord["category"] || "System",
    type: row.type as AuditLogRecord["type"] || "update",
    targetEntity: row.target_entity || "System Entity",
    details: row.details || "",
    changes: row.changes || [],
    fingerprint: {
      ipAddress: row.ip_address || "127.0.0.1",
      browser: row.browser || "Google Chrome",
      os: row.os || "Windows",
      deviceType: row.device_type || "Desktop Workstation",
      location: row.location || "Local Workstation",
      sessionId: row.session_id || getOrCreateSessionId(),
      userAgent: row.user_agent || "Mozilla/5.0",
      screenResolution: row.screen_resolution || "1920x1080",
      timezone: row.timezone || "UTC",
      language: row.language || "en-US",
    },
  }
}

let cachedSessionId = ""
function getOrCreateSessionId(): string {
  if (!cachedSessionId) {
    if (typeof sessionStorage !== "undefined") {
      const stored = sessionStorage.getItem("sigpt_active_session_id")
      if (stored) {
        cachedSessionId = stored
      } else {
        cachedSessionId = `sess_${Math.random().toString(36).substring(2, 12)}`
        sessionStorage.setItem("sigpt_active_session_id", cachedSessionId)
      }
    } else {
      cachedSessionId = `sess_${Math.random().toString(36).substring(2, 12)}`
    }
  }
  return cachedSessionId
}

export function detectClientFingerprint(): UserFingerprint {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : ""
  let browser = "Web Browser"
  if (ua.includes("Firefox")) browser = "Firefox"
  else if (ua.includes("Edg")) browser = "Microsoft Edge"
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari"
  else if (ua.includes("Chrome")) browser = "Google Chrome"

  let os = "Desktop OS"
  if (ua.includes("Windows")) os = "Windows"
  else if (ua.includes("Mac OS X")) os = "macOS"
  else if (ua.includes("Linux")) os = "Linux"
  else if (ua.includes("Android")) os = "Android"
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS"

  const deviceType = /Mobile|Android|iPhone|iPad/i.test(ua) ? "Mobile Handset" : "Desktop Workstation"
  const screenResolution = typeof window !== "undefined" ? `${window.screen.width}x${window.screen.height}` : "1920x1080"
  const timezone = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC"
  const language = typeof navigator !== "undefined" ? navigator.language : "en-US"
  const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost"

  return {
    ipAddress: hostname === "localhost" || hostname === "127.0.0.1" ? "127.0.0.1 (Local)" : hostname,
    browser,
    os,
    deviceType,
    location: timezone.includes("/") ? timezone.split("/")[1].replace(/_/g, " ") : "Local Workstation",
    sessionId: getOrCreateSessionId(),
    userAgent: ua || "Mozilla/5.0",
    screenResolution,
    timezone,
    language,
  }
}

export const INITIAL_MOCK_AUDIT_LOGS: AuditLogRecord[] = []

// ── DB-only fetch (no localStorage) ──

export async function fetchAuditLogsFromDb(): Promise<AuditLogRecord[]> {
  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.warn("[AuditLog] DB fetch error:", error.message)
      return []
    }

    return (data || []).map((row) => mapAuditLogRow(row))
  } catch (err) {
    console.warn("[AuditLog] DB fetch exception:", err)
    return []
  }
}

export async function fetchRecentAuditLogs(limit: number = 5): Promise<AuditLogRecord[]> {
  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error || !data) {
      console.warn("[AuditLog] Recent fetch notice:", error?.message)
      return []
    }

    return data.map((row) => mapAuditLogRow(row))
  } catch (err) {
    console.warn("[AuditLog] Recent fetch exception:", err)
    return []
  }
}


export async function fetchAuditLogsPage(
  page: number,
  pageSize: number = AUDIT_LOG_PAGE_SIZE,
  filters: AuditLogPageFilters = {}
): Promise<PaginatedResult<AuditLogRecord>> {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  try {
    let query = supabase.from("audit_logs").select("*", { count: "exact" })

    if (filters.category && filters.category !== "All") {
      query = query.eq("category", filters.category)
    }
    if (filters.actor && filters.actor !== "All") {
      query = query.eq("actor_name", filters.actor)
    }
    if (filters.search?.trim()) {
      const q = filters.search.trim().toLowerCase()
      query = query.or(
        `action.ilike.%${q}%,details.ilike.%${q}%,actor_name.ilike.%${q}%,actor_email.ilike.%${q}%,target_entity.ilike.%${q}%,ip_address.ilike.%${q}%,location.ilike.%${q}%`
      )
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error || !data) {
      console.warn("[AuditLog] Paged fetch failed:", error?.message ?? error)
      return { data: [], total: 0 }
    }

    const mapped = data.map((row) => mapAuditLogRow(row))
    return { data: mapped, total: count ?? 0 }
  } catch (e) {
    console.warn("[AuditLog] Paged fetch exception:", e)
    return { data: [], total: 0 }
  }
}

export async function fetchAuditLogActorNames(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("actor_name")
      .limit(500)

    if (error || !data || data.length === 0) {
      return []
    }
    return Array.from(new Set(data.map((row) => row.actor_name).filter(Boolean))) as string[]
  } catch {
    return []
  }
}

export async function fetchAuditLogStats(): Promise<AuditLogStats> {
  try {
    const dayMs = 24 * 60 * 60 * 1000
    const twentyFourHoursAgo = new Date(Date.now() - dayMs).toISOString()

    const [totalRes, securityRes, actorRes, recentRes] = await Promise.all([
      supabase.from("audit_logs").select("id", { count: "exact", head: true }),
      supabase.from("audit_logs").select("id", { count: "exact", head: true }).eq("category", "Security"),
      supabase.from("audit_logs").select("actor_name").limit(500),
      supabase.from("audit_logs").select("id", { count: "exact", head: true }).gte("created_at", twentyFourHoursAgo),
    ])

    if (totalRes.error || securityRes.error || actorRes.error || recentRes.error) {
      console.warn("[AuditLog] Stats fetch partial failure")
      return { total: 0, security: 0, actors: 0, last24h: 0 }
    }
    const actors = Array.from(new Set((actorRes.data ?? []).map((row) => row.actor_name).filter(Boolean))) as string[]
    return {
      total: totalRes.count ?? 0,
      security: securityRes.count ?? 0,
      actors: actors.length,
      last24h: recentRes.count ?? 0,
    }
  } catch {
    return { total: 0, security: 0, actors: 0, last24h: 0 }
  }
}

// ── DB-only record (direct INSERT, no localStorage, no RPC) ──

const recentLogsMap = new Map<string, number>()

export async function recordAuditLogAsync(log: {
  action: string
  category: "Jobs" | "Candidates" | "Users" | "Security" | "System"
  type: "create" | "update" | "delete" | "security" | "access"
  targetEntity: string
  details: string
  changes?: AuditChangeItem[]
  actorName?: string
  actorEmail?: string
  actorRole?: string
}): Promise<void> {
  const actorEmail = log.actorEmail || "user@sicareer.com"
  const dedupeKey = `${actorEmail}:${log.action}:${log.targetEntity}`
  const now = Date.now()
  const lastTime = recentLogsMap.get(dedupeKey) || 0

  if (now - lastTime < 5000) {
    // Skip duplicate event within 5-second window
    return
  }
  recentLogsMap.set(dedupeKey, now)

  const fingerprint = detectClientFingerprint()

  const row = {
    actor_name: log.actorName || "Active User",
    actor_email: actorEmail,
    actor_role: log.actorRole || "Recruiter",
    action: log.action,
    category: log.category,
    type: log.type,
    target_entity: log.targetEntity,
    details: log.details,
    changes: log.changes || [],
    ip_address: fingerprint.ipAddress,
    browser: fingerprint.browser,
    os: fingerprint.os,
    device_type: fingerprint.deviceType,
    location: fingerprint.location,
    session_id: fingerprint.sessionId,
    user_agent: fingerprint.userAgent,
    screen_resolution: fingerprint.screenResolution,
    timezone: fingerprint.timezone,
    language: fingerprint.language,
  }

  try {
    const { error } = await supabase.from("audit_logs").insert(row)

    if (error) {
      console.error("[AuditLog] DB insert failed:", error.message)
    }
  } catch (err) {
    console.error("[AuditLog] DB insert exception:", err)
  }
}
