import { supabase } from "@/lib/supabase"
import type { ContactRequestItem } from "@/pages/requests/requests-page"

export async function fetchContactRequests(): Promise<ContactRequestItem[]> {
  try {
    const { data, error } = await supabase
      .from("contact_requests")
      .select("*")
      .order("created_at", { ascending: false })

    if (error || !data) {
      console.warn("[RequestService] Supabase query notice:", error?.message)
      return []
    }

    return data as ContactRequestItem[]
  } catch (err) {
    console.error("[RequestService] Failed to fetch contact requests:", err)
    return []
  }
}

export async function fetchRecentRequests(limit: number = 5): Promise<ContactRequestItem[]> {
  try {
    const { data, error } = await supabase
      .from("contact_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error || !data) {
      console.warn("[RequestService] Supabase query notice:", error?.message)
      return []
    }

    return data as ContactRequestItem[]
  } catch (err) {
    console.error("[RequestService] Failed to fetch recent requests:", err)
    return []
  }
}
