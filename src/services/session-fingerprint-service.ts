import { detectClientFingerprint, type UserFingerprint } from "@/services/audit-log-service"

const SESSION_FINGERPRINT_KEY = "sigpt_session_fingerprint_v1"

export function bindSessionFingerprint(fp?: UserFingerprint): UserFingerprint {
  const activeFp = fp || detectClientFingerprint()
  try {
    sessionStorage.setItem(SESSION_FINGERPRINT_KEY, JSON.stringify(activeFp))
  } catch (err) {
    console.warn("Failed to bind session fingerprint to sessionStorage:", err)
  }
  return activeFp
}

export function getBoundSessionFingerprint(): UserFingerprint | null {
  try {
    const raw = sessionStorage.getItem(SESSION_FINGERPRINT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as UserFingerprint
  } catch {
    return null
  }
}

export interface FingerprintEvaluationResult {
  isMismatch: boolean
  confidence: "high" | "low" | "none"
  reason?: string
  mismatchedFields: string[]
}

export function evaluateFingerprintMismatch(
  currentFp: UserFingerprint = detectClientFingerprint()
): FingerprintEvaluationResult {
  const boundFp = getBoundSessionFingerprint()

  if (!boundFp) {
    // First time binding active session fingerprint
    bindSessionFingerprint(currentFp)
    return { isMismatch: false, confidence: "none", mismatchedFields: [] }
  }

  const mismatchedFields: string[] = []

  const browserMatch = boundFp.browser === currentFp.browser
  const osMatch = boundFp.os === currentFp.os
  const deviceMatch = boundFp.deviceType === currentFp.deviceType

  if (!browserMatch) mismatchedFields.push(`Browser (${boundFp.browser} → ${currentFp.browser})`)
  if (!osMatch) mismatchedFields.push(`OS (${boundFp.os} → ${currentFp.os})`)
  if (!deviceMatch) mismatchedFields.push(`Device (${boundFp.deviceType} → ${currentFp.deviceType})`)

  if (!browserMatch && !osMatch) {
    return {
      isMismatch: true,
      confidence: "high",
      reason: `High confidence anomaly: OS (${boundFp.os} → ${currentFp.os}) and Browser (${boundFp.browser} → ${currentFp.browser}) both changed mid-session.`,
      mismatchedFields,
    }
  }

  if (mismatchedFields.length > 0) {
    return {
      isMismatch: true,
      confidence: "low",
      reason: `Informational event: Minor hardware/browser mismatch detected (${mismatchedFields.join(", ")}).`,
      mismatchedFields,
    }
  }

  return { isMismatch: false, confidence: "none", mismatchedFields: [] }
}
