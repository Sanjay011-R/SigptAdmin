import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Eye, EyeOff, Loader2, AlertCircle, ArrowLeft, KeyRound, ShieldCheck } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { recordAuditLogAsync } from "@/services/audit-log-service"

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate()

  const [canReset, setCanReset] = useState<boolean>(false)
  const [checkingInitialSession, setCheckingInitialSession] = useState(true)
  const [pendingTokenHash, setPendingTokenHash] = useState<string | null>(null)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [expiredLink, setExpiredLink] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialization and auth listener
  useEffect(() => {
    let isMounted = true

    const initResetState = async () => {
      if (typeof window === "undefined") return

      // 1. Check URL hash for Supabase error redirects
      const hash = window.location.hash
      if (hash && hash.includes("error")) {
        const hashParams = new URLSearchParams(hash.replace(/^#/, ""))
        const errorDesc = hashParams.get("error_description") || hashParams.get("error_code")
        if (isMounted) {
          setExpiredLink(true)
          setError(
            errorDesc?.replace(/\+/g, " ") ||
            "This password reset link is invalid or has expired. Please request a new one."
          )
          setCheckingInitialSession(false)
        }
        return
      }

      // 2. Check search parameters for error or token_hash
      const searchParams = new URLSearchParams(window.location.search)
      const queryError = searchParams.get("error") || searchParams.get("error_description")
      if (queryError) {
        if (isMounted) {
          setExpiredLink(true)
          setError("This password reset link is invalid or has expired. Please request a new one.")
          setCheckingInitialSession(false)
        }
        return
      }

      const tokenHash = searchParams.get("token_hash")
      const type = searchParams.get("type")

      // Scanner-safe design: If token_hash exists, store in state and wait for user click to verifyOtp
      if (tokenHash && type === "recovery") {
        if (isMounted) {
          setPendingTokenHash(tokenHash)
          setCheckingInitialSession(false)
        }
        return
      }

      // 3. Verify if active recovery session exists (stale flag protection)
      const { data: { session } } = await supabase.auth.getSession()
      const hasRecoveryFlag = sessionStorage.getItem("pw_recovery") === "1"

      if (isMounted) {
        if (hasRecoveryFlag && session) {
          setCanReset(true)
        } else {
          // If flag exists without valid active session, clear stale flag
          sessionStorage.removeItem("pw_recovery")
          setCanReset(false)
        }
        setCheckingInitialSession(false)
      }
    }

    initResetState()

    // 4. Runtime auth event listener (handles implicit hash fragment & Supabase internal PKCE code exchange)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && sessionStorage.getItem("pw_recovery") === "1")) {
        if (session) {
          sessionStorage.setItem("pw_recovery", "1")
          setCanReset(true)
          setPendingTokenHash(null)
        }
      } else if (event === "SIGNED_OUT") {
        sessionStorage.removeItem("pw_recovery")
        setCanReset(false)
      }
    })

    return () => {
      isMounted = false
      authListener.subscription.unsubscribe()
      // Note: Do NOT clear sessionStorage or call signOut() here.
      // React StrictMode in development remounts components; unmount cleanup would kill recovery session.
    }
  }, [])

  // User click action to verify OTP token (defeats email scanners & prevents StrictMode double-fire)
  const handleVerifyOtpClick = async () => {
    if (!pendingTokenHash) return
    setIsVerifyingOtp(true)
    setError(null)

    try {
      const { data, error: otpErr } = await supabase.auth.verifyOtp({
        token_hash: pendingTokenHash,
        type: "recovery",
      })

      if (otpErr) {
        setExpiredLink(true)
        setError(otpErr.message || "Invalid or expired recovery link. Please request a new one.")
      } else if (data.session) {
        sessionStorage.setItem("pw_recovery", "1")
        setCanReset(true)
        setPendingTokenHash(null)

        // Clean query parameters from address bar to prevent accidental re-verification
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    } catch {
      setError("Failed to verify reset link. Please try again.")
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  // Explicit user cancel action
  const handleCancel = async () => {
    sessionStorage.removeItem("pw_recovery")
    try {
      await supabase.auth.signOut({ scope: "local" })
    } catch {}
    navigate("/login")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Password validation policy (min 8 chars, mixed case, numbers)
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.")
      return
    }

    const hasUpper = /[A-Z]/.test(password)
    const hasLower = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)

    if (!hasUpper || !hasLower || !hasNumber) {
      setError("Password must include at least one uppercase letter, one lowercase letter, and one number.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify and try again.")
      return
    }

    setLoading(true)

    try {
      const { data: updateData, error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        // Precise machine-readable code matching from GoTrue AuthApiError
        const errCode = (updateError as { code?: string })?.code || ""
        const errMsg = updateError.message.toLowerCase()

        if (
          errCode === "same_password" ||
          errMsg.includes("same_password") ||
          errMsg.includes("different from the old")
        ) {
          setError("New password cannot be the same as your current password.")
        } else if (
          errCode === "weak_password" ||
          errMsg.includes("weak_password") ||
          errMsg.includes("pwned")
        ) {
          setError("Password is too weak. Please choose a more complex combination.")
        } else {
          setError(updateError.message)
        }
        return
      }

      // 1. Pre-signout security audit log (recorded while JWT is valid for Postgres RLS)
      try {
        const currentUser = updateData.user
        await recordAuditLogAsync({
          action: "Password Reset Completed",
          category: "Security",
          type: "security",
          targetEntity: `Auth Account (${currentUser?.email || "User"})`,
          details: "User successfully reset account password via recovery link.",
          actorEmail: currentUser?.email,
          actorName: currentUser?.user_metadata?.full_name || currentUser?.email?.split("@")[0],
        })
      } catch (logErr) {
        console.warn("Audit log notice:", logErr)
      }

      // 2. Remove recovery session marker
      sessionStorage.removeItem("pw_recovery")

      // 3. Global revocation of all other device sessions
      await supabase.auth.signOut({ scope: "global" })

      // 4. Redirect to login with success banner
      navigate("/login?reset=success", { replace: true })
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Failed to update password. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  // Initial session check spinner
  if (checkingInitialSession) {
    return (
      <div className={cn("w-full max-w-md mx-auto flex flex-col items-center justify-center gap-4 py-12 text-center", className)}>
        <Loader2 className="w-8 h-8 animate-spin text-[#0B192C]" />
        <p className="text-sm font-medium text-gray-600">Checking recovery link...</p>
      </div>
    )
  }

  // Scanner-safe prompt (Wait for human click before consuming single-use OTP)
  if (pendingTokenHash && !canReset) {
    return (
      <div className={cn("w-full max-w-md mx-auto flex flex-col items-center text-center gap-6 py-2", className)} {...props}>
        {/* Security Shield Hero Graphic */}
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200/60 border border-slate-200 flex items-center justify-center shadow-xs">
            <KeyRound className="w-8 h-8 text-[#0B192C]" strokeWidth={1.75} />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-white stroke-[2.5]" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            Confirm Password Reset
          </h1>
          <p className="text-sm text-gray-500 font-medium max-w-sm">
            Click below to verify your recovery security link and choose a new password.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="w-full flex items-start gap-2.5 p-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl font-medium text-left"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="w-full flex flex-col gap-3 pt-1">
          <button
            type="button"
            disabled={isVerifyingOtp}
            onClick={handleVerifyOtpClick}
            className="w-full bg-[#0B192C] hover:bg-[#152744] text-white font-semibold text-sm py-2.5 px-4 rounded-xl shadow-sm transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isVerifyingOtp ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Security Token...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Continue to Reset Password</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            className="text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors flex items-center justify-center gap-1.5 py-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel & Back to Login</span>
          </button>
        </div>
      </div>
    )
  }

  // Expired or invalid recovery link
  if (expiredLink || !canReset) {
    return (
      <div className={cn("w-full max-w-md mx-auto flex flex-col items-center text-center gap-6 py-2", className)} {...props}>
        {/* Warning Hero Graphic */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 flex items-center justify-center shadow-xs">
          <AlertCircle className="w-8 h-8 text-amber-600" strokeWidth={1.75} />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            Reset Link Expired
          </h1>
          <p className="text-sm text-gray-500 font-medium max-w-sm">
            This password reset link is invalid, expired, or has already been used.
          </p>
        </div>

        <div
          role="alert"
          aria-live="polite"
          className="w-full flex items-start gap-2.5 p-3.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl font-medium text-left"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <span>
            {error || "For your security, password reset links are single-use and expire quickly. Please request a new link."}
          </span>
        </div>

        <div className="w-full flex flex-col gap-3 pt-1">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="w-full bg-[#0B192C] hover:bg-[#152744] text-white font-semibold text-sm py-2.5 px-4 rounded-xl shadow-sm transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Request New Reset Link</span>
          </button>
        </div>
      </div>
    )
  }

  // Active reset password form
  return (
    <div className={cn("w-full max-w-md mx-auto flex flex-col gap-6 py-4", className)} {...props}>
      {/* Title & Subtitle */}
      <div className="flex flex-col gap-1 text-center md:text-left">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
          Set New Password
        </h1>
        <p className="text-sm text-gray-500 font-medium">
          Create a strong password for your account
        </p>
      </div>

      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-start gap-2.5 p-3.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl font-medium"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-1">
        {/* New Password Field */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="new-password" className="text-xs font-bold text-gray-800">
            New Password
          </label>
          <div className="relative flex items-center">
            <input
              id="new-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full px-3.5 py-2.5 pr-10 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B192C]/20 focus:border-[#0B192C] transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <span className="text-[11px] text-gray-500 font-medium">
            At least 8 characters with uppercase, lowercase, and numbers
          </span>
        </div>

        {/* Confirm Password Field */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirm-password" className="text-xs font-bold text-gray-800">
            Confirm Password
          </label>
          <div className="relative flex items-center">
            <input
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full px-3.5 py-2.5 pr-10 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B192C]/20 focus:border-[#0B192C] transition-all"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#0B192C] hover:bg-[#152744] text-white font-semibold text-sm py-2.5 px-4 rounded-xl shadow-sm transition-all active:scale-[0.99] cursor-pointer mt-1 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{loading ? "Updating Password..." : "Update Password"}</span>
        </button>

        {/* Cancel & Back to Login */}
        <button
          type="button"
          onClick={handleCancel}
          className="text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors flex items-center justify-center gap-1.5 py-1 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Cancel & Back to Login</span>
        </button>
      </form>
    </div>
  )
}
