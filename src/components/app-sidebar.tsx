"use client"

import * as React from "react"
import { useAuth } from "@/hooks/use-auth"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  MessageSquare, 
  Activity, 
  FolderKanban,
  UserCog,
} from "lucide-react"
import sigptLogo from "@/assets/sigpt-logo.avif"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { permissions, user: authUser } = useAuth()

  const allNavItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboard />,
      allowed: true,
    },
    {
      title: "User Management",
      url: "/users",
      icon: <UserCog />,
      allowed: permissions.canManageUsers,
    },
    {
      title: "Job Management",
      url: "/jobs",
      icon: <Briefcase />,
      allowed: permissions.canManageJobs,
    },
    {
      title: "Candidate / Applications",
      url: "/applications",
      icon: <Users />,
      allowed: permissions.canViewCandidates,
    },
    {
      title: "Projects",
      url: "/projects",
      icon: <FolderKanban />,
      allowed: permissions.canEditProjects,
    },
    {
      title: "Requests",
      url: "/requests",
      icon: <MessageSquare />,
      allowed: true,
    },
    {
      title: "Activity Log",
      url: "/activity-log",
      icon: <Activity />,
      allowed: permissions.canViewAuditLogs,
    },
  ]

  const filteredNavMain = allNavItems.filter((item) => item.allowed)

  const activeUserData = {
    name: authUser?.user_metadata?.full_name || authUser?.email?.split("@")[0] || "User",
    email: authUser?.email || "user@sicareer.com",
    avatar: "/avatars/admin.jpg",
  }

  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<a href="/dashboard" />}>
              <img
                src={sigptLogo}
                alt="SI-GPT Logo"
                className="h-8 w-auto object-contain shrink-0 rounded-md"
              />
              
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={activeUserData} />
      </SidebarFooter>
    </Sidebar>
  )
}
