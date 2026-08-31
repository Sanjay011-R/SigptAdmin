import React from "react"

interface RootLayoutProps {
  children: React.ReactNode
}

export function RootLayout({ children }: RootLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased overflow-x-hidden">
      {children}
    </div>
  )
}
