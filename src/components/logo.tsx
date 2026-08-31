import sigptLogo from "@/assets/sigpt-logo.avif"

interface LogoProps {
  className?: string
  imgClassName?: string
  showText?: boolean
}

export function Logo({
  className = "",
  imgClassName = "h-8 w-auto object-contain",
  showText = false,
}: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src={sigptLogo}
        alt="SI-GPT Logo"
        className={imgClassName}
      />
      {showText && (
        <span className="text-lg font-bold tracking-tight text-gray-900 font-sora">
          SI-Career
        </span>
      )}
    </div>
  )
}
