import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

/**
 * Validates access token or current user session with Supabase Auth Server.
 * Making a request to supabase.auth.getUser() validates token authenticity on server.
 */
export async function validateAccessToken(jwtToken?: string): Promise<{
  isValid: boolean
  user: User | null
  error: string | null
}> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(jwtToken)

    if (error || !user) {
      return { isValid: false, user: null, error: error?.message || "Not authenticated" }
    }

    return { isValid: true, user, error: null }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Validation failed"
    return { isValid: false, user: null, error: message }
  }
}

/**
 * Interface for User Presence data
 */
export interface UserPresence {
  user_id: string
  email: string
  is_online: boolean
  last_seen_at: string
}
