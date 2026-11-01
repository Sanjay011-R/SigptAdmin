import React, { useState } from "react"
import type { LinkedInPostStatus } from "@/types/job-types"
import { CheckCircle2, AlertTriangle, MinusCircle, Copy, Check } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface LinkedInStatusBadgeProps {
  status?: LinkedInPostStatus
  errorMessage?: string | null
  postedAt?: string | null
  updatedAt?: string | null
  compact?: boolean
}

export function LinkedInStatusBadge({
  status = "Pending",
  errorMessage,
  postedAt,
  updatedAt,
  compact = false,
}: LinkedInStatusBadgeProps) {
  const [copied, setCopied] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleCopyError = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (errorMessage) {
      navigator.clipboard.writeText(errorMessage)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (status === "Posted") {
    const formattedDate = postedAt ? new Date(postedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }) : null

    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100/70 transition-colors cursor-pointer"
              title="Job posted successfully on LinkedIn"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Posted</span>
            </button>
          }
        />
        <PopoverContent className="w-64 p-3 text-xs bg-white border border-gray-200 shadow-md rounded-md z-50">
          <div className="font-semibold text-emerald-800 flex items-center gap-1.5 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>LinkedIn Post Live</span>
          </div>
          <p className="text-gray-600">
            {formattedDate ? `Published: ${formattedDate}` : "Job successfully published to company LinkedIn page."}
          </p>
        </PopoverContent>
      </Popover>
    )
  }

  if (status === "Failed") {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer shadow-xs animate-pulse"
              title="Click to view LinkedIn error details"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Failed</span>
            </button>
          }
        />
        <PopoverContent className="w-80 p-3.5 text-xs bg-white border border-rose-200 shadow-lg rounded-md z-50">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-rose-100">
            <div className="font-bold text-rose-700 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>LinkedIn Posting Failed</span>
            </div>
            {errorMessage && (
              <button
                type="button"
                onClick={handleCopyError}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-sm hover:bg-gray-100 flex items-center gap-1 text-[10px]"
                title="Copy error message"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            )}
          </div>

          <div className="bg-rose-50/70 border border-rose-200/80 rounded p-2 text-rose-900 font-mono text-[11px] leading-relaxed break-words max-h-36 overflow-y-auto mb-2">
            {errorMessage || "No detailed error message returned from Make.com."}
          </div>

          <div className="text-[11px] text-gray-500 space-y-1">
            <p>💡 Check Make.com scenario history and ensure LinkedIn authorization has not expired.</p>
            {updatedAt && (
              <p className="text-[10px] text-gray-400">
                Failed at: {new Date(updatedAt).toLocaleString()}
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  if (status === "Skipped") {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200/60 transition-colors cursor-pointer"
              title="Job was skipped by Make.com"
            >
              <MinusCircle className="w-3.5 h-3.5 text-gray-500" />
              <span>Skipped</span>
            </button>
          }
        />
        <PopoverContent className="w-64 p-3 text-xs bg-white border border-gray-200 shadow-md rounded-md z-50">
          <div className="font-semibold text-gray-800 flex items-center gap-1.5 mb-1">
            <MinusCircle className="w-4 h-4 text-gray-500" />
            <span>Posting Skipped</span>
          </div>
          <p className="text-gray-600">
            {errorMessage || "Job posting skipped because job status is Draft or not marked for publishing."}
          </p>
        </PopoverContent>
      </Popover>
    )
  }

  // Pending: no badge shown
  return null
}
