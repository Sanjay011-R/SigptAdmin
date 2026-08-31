import React, { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ShieldAlert, Lock, Loader2, LogOut } from "lucide-react"

export function StepUpAuthModal() {
  const { user, requiresStepUpAuth, stepUpReason, resolveStepUpAuth, logout } = useAuth()
  const [password, setPassword] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!requiresStepUpAuth || !user) return null

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) {
      setError("Please enter your current password to continue.")
      return
    }

    setVerifying(true)
    setError(null)

    try {
      // Verify password by attempting signInWithPassword
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password,
      })

      if (authError) {
        setError("Invalid password. Please verify your credentials.")
      } else {
        // Step-up verification succeeded: rebind session fingerprint
        resolveStepUpAuth()
      }
    } catch (err: any) {
      setError(err?.message || "Re-authentication failed.")
    } finally {
      setVerifying(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    window.location.href = "/login"
  }

  return (
    <Dialog open={requiresStepUpAuth} onOpenChange={(open) => !open && handleLogout()}>
      <DialogContent className="max-w-md p-6 bg-white rounded-2xl border border-rose-200 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-extrabold text-gray-900">
                Step-Up Security Verification Required
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 font-medium mt-0.5">
                {stepUpReason || "We detected a change in your device / browser fingerprint during this active session."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleVerify} className="flex flex-col gap-4 mt-3">
          <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200 text-xs text-rose-800 font-medium">
            To protect your session against unauthorized access, please enter your password to confirm your identity and rebind your session.
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
              Confirm Account Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="pl-9 h-10 text-xs rounded-xl"
                autoFocus
              />
            </div>
            {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleLogout}
              className="h-10 border-gray-200 text-xs font-bold rounded-xl hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              <span>Log Out</span>
            </Button>

            <Button
              type="submit"
              disabled={verifying}
              className="h-10 bg-[#0B192C] hover:bg-[#162a45] text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Re-Authenticate Session</span>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
