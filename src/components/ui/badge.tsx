import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 font-bold text-[11px] transition-colors rounded-lg px-2.5 py-0.5 border",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow-xs",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-destructive/30 bg-destructive/10 text-destructive",
        outline: "text-foreground border-border",
        success: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
        purple: "bg-purple-50 text-purple-700 border-purple-200/60",
        blue: "bg-blue-50 text-blue-700 border-blue-200/60",
        amber: "bg-amber-50 text-amber-700 border-amber-200/60",
        slate: "bg-slate-50 text-slate-600 border-slate-200/60",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
