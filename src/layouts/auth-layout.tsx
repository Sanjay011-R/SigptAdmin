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
            style={{
              filter:
                "brightness(1.18) saturate(1.35) drop-shadow(0 0 12px rgba(255, 122, 0, 0.9)) drop-shadow(0 0 24px rgba(255, 122, 0, 0.45)) drop-shadow(0 0 38px rgba(255, 122, 0, 0.25))",
              transform: "translateY(-1px)",
            }}
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
