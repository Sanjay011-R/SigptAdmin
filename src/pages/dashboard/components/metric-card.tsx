import React from "react"

export interface MetricCardProps {
  label: string
  value: string | number
  subtext?: string
  subtextType?: "positive" | "negative" | "neutral" | "info"
  icon: React.ElementType
  iconBg: string
  iconColor: string
  onClick?: () => void
}

export function MetricCard({
  label,
  value,
  subtext,
  subtextType = "neutral",
  icon: Icon,
  iconBg,
  iconColor,
  onClick,
}: MetricCardProps) {
  const subtextColorClass = {
    positive: "text-emerald-600",
    negative: "text-rose-600",
    info: "text-indigo-600",
    neutral: "text-gray-500",
  }[subtextType]

  return (
    <div
      onClick={onClick}
      className={`bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between transition-all duration-200 ${
        onClick ? "hover:shadow-md hover:border-gray-300 cursor-pointer" : ""
      }`}
    >
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-gray-500">{label}</span>
        <span className="text-2xl font-extrabold text-gray-900 tracking-tight">{value}</span>
        {subtext && (
          <span className={`text-[11px] font-medium flex items-center gap-1 ${subtextColorClass}`}>
            {subtext}
          </span>
        )}
      </div>
      <div className={`p-3 rounded-xl shrink-0 ${iconBg} ${iconColor}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  )
}
