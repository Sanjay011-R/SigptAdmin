import { supabase } from "@/lib/supabase"

export interface UserItem {
  id: string
  name: string
  email: string
  role: "Super Admin" | "Recruiter" | "Hiring Manager" | "Viewer"
  status: "Active" | "Suspended" | "Pending"
  isOnline: boolean
  lastSeen: string
  sessionAccess: {
    canManageJobs: boolean
    canViewCandidates: boolean
    canEditProjects: boolean
    canManageUsers: boolean
  }
}

const STORAGE_KEY = "sigpt_created_users"

export function getStoredUsers(): UserItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveStoredUser(user: UserItem): void {
  try {
    const users = getStoredUsers()
    const index = users.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase())
    if (index >= 0) {
      users[index] = { ...users[index], ...user }
    } else {
      users.push(user)
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
    window.dispatchEvent(new Event("sigpt_users_updated"))
  } catch (err) {
    console.error("Error saving user to storage:", err)
  }
}

export function getDynamicRecruiterOptions(currentUser?: any): { value: string; label: string }[] {
  const optionsMap = new Map<string, string>()

  // 1. Add current logged-in user / Admin account
  if (currentUser) {
    const name = currentUser.user_metadata?.full_name || currentUser.email?.split("@")[0] || "Admin"
    const role = currentUser.user_metadata?.role || "Super Admin"
    const formatted = `${name} (${role})`
    optionsMap.set(formatted.toLowerCase(), formatted)
  } else {
    optionsMap.set("admin (super admin)", "Admin (Super Admin)")
  }

  // 2. Add all created users from User Management
  const storedUsers = getStoredUsers()
  storedUsers.forEach((u) => {
    if (u.name) {
      const formatted = u.role ? `${u.name} (${u.role})` : u.name
      optionsMap.set(formatted.toLowerCase(), formatted)
    }
  })

  return Array.from(optionsMap.values()).map((label) => ({
    value: label,
    label: label,
  }))
}

export async function fetchDynamicRecruiterOptions(currentUser?: any): Promise<{ value: string; label: string }[]> {
  const optionsMap = new Map<string, string>()

  // 1. Fetch live user profiles from Supabase DB
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, email, role")

    if (!error && data && data.length > 0) {
      data.forEach((p) => {
        const name = p.full_name || p.email?.split("@")[0] || "User"
        const role = p.role || "Recruiter"
        const formatted = `${name} (${role})`
        optionsMap.set(formatted.toLowerCase(), formatted)
      })
    }
  } catch (err) {
    console.warn("Supabase profiles query error:", err)
  }

  // 2. Add current logged-in user if not present
  if (currentUser) {
    const name = currentUser.user_metadata?.full_name || currentUser.email?.split("@")[0] || "Admin"
    const role = currentUser.user_metadata?.role || "Super Admin"
    const formatted = `${name} (${role})`
    if (!optionsMap.has(formatted.toLowerCase())) {
      optionsMap.set(formatted.toLowerCase(), formatted)
    }
  }

  // 3. Add all local stored users
  const storedUsers = getStoredUsers()
  storedUsers.forEach((u) => {
    if (u.name) {
      const formatted = u.role ? `${u.name} (${u.role})` : u.name
      if (!optionsMap.has(formatted.toLowerCase())) {
        optionsMap.set(formatted.toLowerCase(), formatted)
      }
    }
  })

  if (optionsMap.size === 0) {
    optionsMap.set("admin (super admin)", "Admin (Super Admin)")
  }

  return Array.from(optionsMap.values()).map((label) => ({
    value: label,
    label: label,
  }))
}
