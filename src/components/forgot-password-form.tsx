import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Loader2, AlertCircle, ArrowLeft, Mail, Check, Inbox, RotateCw } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface ForgotPasswordFormProps extends React.ComponentProps<"div"> {
  onBackToLogin: () => void
}

export function ForgotPasswordForm({
  className,
  onBackToLogin,
  ...props
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  // Countdown timer for rate limiting
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const sendResetEmail = async () => {
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.")
      return
    }

    if (cooldown > 0) return

    setLoading(true)
    setError(null)

    try {
      // 1. Verify if account exists in database before sending reset link
      let accountExists: boolean | null = null

      try {
        const { data: rpcExists, error: rpcErr } = await supabase.rpc("check_user_email_exists", {
          check_email: email.trim(),
        })

        if (!rpcErr && typeof rpcExists === "boolean") {
          accountExists = rpcExists
        } else {
          // Fallback check against profiles table
          const { data: profileRow, error: profileErr } = await supabase
            .from("profiles")
            .select("id")
            .ilike("email", email.trim())
            .maybeSingle()

          if (!profileErr) {
            accountExists = !!profileRow
          }
        }
      } catch (checkErr) {
        console.warn("Account existence check warning:", checkErr)
      }

      // If account confirmed not to exist, inform user immediately
      if (accountExists === false) {
        setError("This account does not exist. Please check your email address or contact your administrator.")
        return
      }

      // 2. Account exists (or check inconclusive), dispatch password reset recovery email
      const isLocalhost =
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")

      const configuredUrl = (import.meta.env.VITE_APP_URL || "").trim().replace(/^[\\/]+/, "")
      const productionUrl = configuredUrl.startsWith("http")
        ? configuredUrl
        : configuredUrl
        ? `https://${configuredUrl}`
        : window.location.origin

      const appUrl = isLocalhost ? window.location.origin : productionUrl
      const redirectTo = `${appUrl}/reset-password`

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo }
      )

      if (resetError) {
        if (
          resetError.status === 429 ||
          resetError.message.toLowerCase().includes("rate limit") ||
          resetError.message.toLowerCase().includes("over_email_send_rate_limit")
        ) {
          setCooldown(60)
          setError("Rate limit reached. Please wait 60 seconds before requesting another link.")
          return
        }

        setError(resetError.message)
        return
      }

      setSubmitted(true)
    } catch {
      setError("Failed to process password reset. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await sendResetEmail()
  }

  const handleResend = async () => {
    await sendResetEmail()
  }

  return (
    <div
      className={cn("w-full max-w-md mx-auto flex flex-col gap-6 py-4", className)}
      {...props}
    >
      {submitted ? (
        /* Professional Success State */
        <div className="flex flex-col items-center text-center gap-6 py-2">
          {/* Animated/Layered Mail Icon Graphic */}
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200/60 border border-slate-200 flex items-center justify-center shadow-xs">
              <Mail className="w-8 h-8 text-[#0B192C]" strokeWidth={1.75} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-xs">
              <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
            </div>
          </div>

          {/* Heading & Target Email */}
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              Check your email
            </h1>
            <p className="text-sm text-gray-500 font-medium">
              We've sent a password reset link to
              <br />
              <span className="font-semibold text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded-lg border border-gray-200/80 inline-block mt-1.5 break-all text-xs">
                {email.trim()}
              </span>
            </p>
          </div>

          {/* Error notice if resend fails */}
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

          {/* Instructions Box */}
          <div className="w-full bg-gray-50/90 border border-gray-200/80 rounded-2xl p-4 text-xs text-gray-600 font-medium flex flex-col gap-2 text-left">
            <div className="flex items-center gap-2 text-gray-900 font-semibold">
              <Inbox className="w-4 h-4 text-gray-500" />
              <span>Next Steps</span>
            </div>
            <p className="leading-relaxed text-gray-600">
              Click the link inside the email to choose a new password. If you don't receive it within a few minutes, check your spam or junk folder.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex flex-col gap-3 pt-1">
            <button
              type="button"
              onClick={onBackToLogin}
              className="w-full bg-[#0B192C] hover:bg-[#152744] text-white font-semibold text-sm py-2.5 px-4 rounded-xl shadow-sm transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Login</span>
            </button>

            {/* Resend and Edit controls */}
            <div className="flex flex-col items-center gap-2 text-xs pt-1">
              <div className="flex items-center gap-1.5 text-gray-500 font-medium">
                <span>Didn't get the email?</span>
                <button
                  type="button"
                  disabled={loading || cooldown > 0}
                  onClick={handleResend}
                  className="font-semibold text-[#0B192C] hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  {loading && <RotateCw className="w-3 h-3 animate-spin" />}
                  <span>{cooldown > 0 ? `Resend in ${cooldown}s` : "Click to resend"}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSubmitted(false)
                  setError(null)
                }}
                className="text-gray-500 hover:text-gray-800 font-medium cursor-pointer text-[11px] underline"
              >
                Try a different email
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Initial Input Form */
        <>
          {/* Title & Subtitle */}
          <div className="flex flex-col gap-1 text-center md:text-left">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
              Reset Password
            </h1>
            <p className="text-sm text-gray-500 font-medium">
              Enter your email to receive recovery instructions
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
            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reset-email" className="text-xs font-bold text-gray-800">
                Email Address
              </label>
              <div className="relative flex items-center">
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E.g. johndoe@email.com"
                  required
                  autoComplete="email"
                  disabled={loading || cooldown > 0}
                  className="w-full px-3.5 py-2.5 pl-10 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B192C]/20 focus:border-[#0B192C] transition-all disabled:bg-gray-50 disabled:text-gray-500"
                />
                <Mail className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || cooldown > 0}
              className="w-full bg-[#0B192C] hover:bg-[#152744] text-white font-semibold text-sm py-2.5 px-4 rounded-xl shadow-sm transition-all active:scale-[0.99] cursor-pointer mt-1 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>
                {cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : loading
                  ? "Sending link..."
                  : "Send Reset Link"}
              </span>
            </button>

            {/* Back to Login Button */}
            <button
              type="button"
              onClick={onBackToLogin}
              disabled={loading}
              className="text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors flex items-center justify-center gap-1.5 py-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </button>
          </form>
        </>
      )}
    </div>
  )
}
