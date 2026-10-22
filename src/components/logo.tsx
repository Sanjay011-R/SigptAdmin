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
        style={{
          filter:
            "brightness(1.18) saturate(1.35) drop-shadow(0 0 12px rgba(255, 122, 0, 0.9)) drop-shadow(0 0 24px rgba(255, 122, 0, 0.45)) drop-shadow(0 0 38px rgba(255, 122, 0, 0.25))",
          transition: "filter 0.2s ease, transform 0.2s ease",
          transform: "translateY(-1px)",
        }}
      />
      {showText && (
        <span
          className="text-lg font-bold tracking-tight text-gray-900 font-sora"
          style={{
            textShadow:
              "0 0 10px rgba(255, 122, 0, 0.9), 0 0 18px rgba(255, 122, 0, 0.65)",
          }}
        >
          SI-Career
        </span>
      )}
    </div>
  )
}
