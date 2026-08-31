import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    // Form input validation
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.")
      return
    }

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long.")
      return
    }

    setLoading(true)

    try {
      // Authenticate with Supabase DB
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      })

      if (signInError) throw signInError

      if (data.user) {
        navigate("/dashboard")
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes("Invalid login credentials")) {
          setError("Invalid email or password. Please verify your credentials in Supabase.")
        } else if (err.message.includes("Email not confirmed")) {
          setError("Your email address is not verified yet. Please check your inbox.")
        } else {
          setError(err.message)
        }
      } else {
        setError("Authentication failed. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("w-full max-w-md mx-auto flex flex-col gap-6 py-4", className)} {...props}>
      {/* Title & Subtitle */}
      <div className="flex flex-col gap-1 text-center md:text-left">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
          Login
        </h1>
        <p className="text-sm text-gray-500 font-medium">
          Hi, Welcome back 👋
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="p-3.5 text-xs text-green-700 bg-green-50 border border-green-200 rounded-xl font-medium">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-1">
        {/* Email Field */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs font-bold text-gray-800">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E.g. johndoe@email.com"
            required
            className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B192C]/20 focus:border-[#0B192C] transition-all"
          />
        </div>

        {/* Password Field */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-xs font-bold text-gray-800">
            Password
          </label>
          <div className="relative flex items-center">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              minLength={6}
              className="w-full px-3.5 py-2.5 pr-10 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B192C]/20 focus:border-[#0B192C] transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Remember Me & Forgot Password Row */}
        <div className="flex items-center justify-between text-xs mt-0.5">
          <label className="flex items-center gap-2 cursor-pointer text-gray-600 font-medium select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-[#0B192C] focus:ring-[#0B192C]/30 accent-[#0B192C]"
            />
            <span>Remember Me</span>
          </label>
          <a
            href="#"
            className="text-[#0B192C] font-semibold hover:underline transition-colors"
          >
            Forgot Password?
          </a>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#0B192C] hover:bg-[#152744] text-white font-semibold text-sm py-2.5 px-4 rounded-xl shadow-sm transition-all active:scale-[0.99] cursor-pointer mt-1 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>Login</span>
        </button>
      </form>
    </div>
  )
}
