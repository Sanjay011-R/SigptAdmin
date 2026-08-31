import React from "react"
import { useLocation } from "react-router-dom"
import { AppSidebar } from "@/components/app-sidebar"
import { StepUpAuthModal } from "@/components/step-up-auth-modal"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

interface MainLayoutProps {
  children: React.ReactNode
  pageTitle?: string
}

export function MainLayout({ children, pageTitle }: MainLayoutProps) {
  const location = useLocation()

  const getBreadcrumbTitle = () => {
    if (pageTitle) return pageTitle
    switch (location.pathname) {
      case "/jobs":
        return "Job Management"
      case "/jobs/create":
        return "Create Job Requirement"
      case "/applications":
        return "Candidate / Applications"
      case "/projects":
        return "Projects"
      case "/projects/create":
        return "Create Project"
      case "/requests":
        return "Requests"
      case "/activity-log":
        return "Activity Log"
      default:
        return "Overview"
    }
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <StepUpAuthModal />
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b px-4 bg-white/50 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/dashboard">
                      Dashboard
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{getBreadcrumbTitle()}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 bg-[#FAF8F5] w-full min-w-0">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
