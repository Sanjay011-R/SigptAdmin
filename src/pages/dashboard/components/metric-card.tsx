import React from "react"

export interface MetricCardProps {
  label: string
  value: string | number
  subtext?: string
  subtextType?: "positive" | "negative" | "neutral" | "info"
  icon: React.ElementType
  onClick?: () => void
}

export function MetricCard({
  label,
  value,
  subtext,
  subtextType = "neutral",
  icon: Icon,
  onClick,
}: MetricCardProps) {
  const subtextColorClass = {
    positive: "text-emerald-700",
    negative: "text-rose-700",
    info: "text-[#081B33]",
    neutral: "text-gray-500",
  }[subtextType]

  return (
    <div
      onClick={onClick}
      className={`bg-white p-4.5 rounded-sm border border-gray-200 flex items-center justify-between transition-all duration-150 ${
        onClick
          ? "hover:border-[#081B33]/40 hover:shadow-xs cursor-pointer group"
          : ""
      }`}
    >
      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider truncate">
          {label}
        </span>
        <span className="text-2xl font-bold text-[#081B33] tracking-tight">
          {value}
        </span>
        {subtext && (
          <span className={`text-[11px] font-medium truncate ${subtextColorClass}`}>
            {subtext}
          </span>
        )}
      </div>
      <div className="w-10 h-10 rounded-sm bg-gray-50 border border-gray-200/80 text-[#081B33] flex items-center justify-center shrink-0 group-hover:bg-[#081B33] group-hover:text-white transition-colors">
        <Icon className="w-5 h-5" />
      </div>
    </div>
  )
}

