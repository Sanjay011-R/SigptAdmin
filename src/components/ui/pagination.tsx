import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface PaginationBarProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  className?: string
}

function getPageNumbers(current: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  const pages = new Set<number>()
  pages.add(1)
  pages.add(totalPages)
  for (let i = Math.max(1, current - 2); i <= Math.min(totalPages, current + 2); i++) {
    pages.add(i)
  }
  const sorted = Array.from(pages).sort((a, b) => a - b)
  const result: (number | "...")[] = []
  let prev = 0
  for (const p of sorted) {
    if (p - prev > 1) result.push("...")
    result.push(p)
    prev = p
  }
  return result
}

export function PaginationBar({
  page,
  pageSize,
  total,
  onPageChange,
  className,
}: PaginationBarProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(Math.max(page, 1), totalPages)
  const start = total === 0 ? 0 : (current - 1) * pageSize + 1
  const end = Math.min(current * pageSize, total)

  if (total === 0) return null

  const pageBtn =
    "h-8 min-w-8 px-2 inline-flex items-center justify-center rounded-lg text-xs font-bold transition-colors cursor-pointer"
  const pageBtnIdle = "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
  const pageBtnActive = "bg-[#0B192C] text-white border border-[#0B192C]"

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-gray-200/80 bg-gray-50/60",
        className
      )}
    >
      <span className="text-[11px] font-bold text-gray-400 font-mono">
        Showing {start.toLocaleString()}–{end.toLocaleString()} of{" "}
        <span className="text-gray-700">{total.toLocaleString()}</span> records
      </span>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={current <= 1}
          onClick={() => onPageChange(current - 1)}
          className={cn(pageBtn, pageBtnIdle, "disabled:cursor-not-allowed disabled:opacity-40")}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getPageNumbers(current, totalPages).map((item, idx) =>
          item === "..." ? (
            <span key={`dots-${idx}`} className="px-1 text-xs font-bold text-gray-400">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              className={cn(pageBtn, item === current ? pageBtnActive : pageBtnIdle)}
            >
              {item}
            </button>
          )
        )}

        <button
          type="button"
          disabled={current >= totalPages}
          onClick={() => onPageChange(current + 1)}
          className={cn(pageBtn, pageBtnIdle, "disabled:cursor-not-allowed disabled:opacity-40")}
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}