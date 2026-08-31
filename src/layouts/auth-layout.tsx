import React from "react"
import sigptLogo from "@/assets/sigpt-logo.avif"

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-white">
      {/* Top Header Bar */}
      <header className="flex h-16 w-full items-center px-6 md:px-12 bg-white">
        <div className="flex items-center gap-2.5">
          <img
            src={sigptLogo}
            alt="SI-GPT Logo"
            className="h-8 w-auto object-contain"
          />
       
        </div>
      </header>

      {/* Centered Main Body */}
      <main className="flex flex-1 items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>
    </div>
  )
}
