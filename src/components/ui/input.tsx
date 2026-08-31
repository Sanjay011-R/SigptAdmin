import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 transition-colors outline-none placeholder:text-gray-400 hover:border-gray-300 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/20 focus-visible:border-brand-orange focus-visible:ring-1 focus-visible:ring-brand-orange/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-50 aria-invalid:border-red-500",
        className
      )}
      {...props}
    />
  )
}

export { Input }
