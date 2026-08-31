import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"
import type { UserPresence } from "@/lib/auth-utils"

export function usePresence(user: User | null) {
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([])

  useEffect(() => {
    if (!user?.id) {
      setOnlineUsers([])
      return
    }

    const channelName = "global_user_presence"

    // Remove pre-existing channels with same topic
    const existingChannels = supabase.getChannels()
    existingChannels.forEach((ch) => {
      if (ch.topic === `realtime:${channelName}` || ch.topic === channelName) {
        supabase.removeChannel(ch)
      }
    })

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id,
        },
      },
    })

    const sendPresenceHeartbeat = async () => {
      const now = new Date().toISOString()
      const presencePayload: UserPresence = {
        user_id: user.id,
        email: user.email || "Unknown",
        is_online: true,
        last_seen_at: now,
      }

      try {
        await channel.track(presencePayload)
      } catch {
        // Silently handle if channel tracking fails
      }
    }

    // Register presence listener before subscribing
    try {
      channel.on("presence" as any, { event: "sync" }, () => {
        const newState = channel.presenceState<UserPresence>()
        const users: UserPresence[] = []

        Object.values(newState).forEach((presenceArray) => {
          if (presenceArray && presenceArray.length > 0) {
            users.push(presenceArray[0])
          }
        })

        setOnlineUsers(users)
      })

      // Subscribe to realtime presence
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          sendPresenceHeartbeat()
        }
      })
    } catch (err) {
      console.warn("Realtime presence initialization notice:", err)
    }

    // Heartbeat every 30 seconds
    const intervalId = setInterval(() => {
      sendPresenceHeartbeat()
    }, 30000)

    return () => {
      clearInterval(intervalId)
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  return {
    onlineUsers,
    isOnline: !!user,
  }
}
