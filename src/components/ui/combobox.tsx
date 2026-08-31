import * as React from "react"
import { Check, ChevronsUpDown, Search, Plus } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  popoverClassName?: string
  allowCustom?: boolean
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search or enter custom domain...",
  className,
  popoverClassName,
  allowCustom = true,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase()) ||
    opt.value.toLowerCase().includes(search.toLowerCase())
  )

  const selectedOption = options.find((opt) => opt.value === value)

  const handleSelect = (val: string) => {
    onValueChange(val)
    setOpen(false)
    setSearch("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between h-9 bg-gray-50 border border-gray-200 rounded-sm px-3 text-xs font-medium text-left cursor-pointer hover:bg-white hover:border-gray-300 focus:border-[#FF7F50] focus:ring-1 focus:ring-[#FF7F50]/20 transition-all shadow-none outline-none",
              open && "border-[#FF7F50] ring-1 ring-[#FF7F50]/20 bg-white",
              className
            )}
          />
        }
      >
        <span className={cn("truncate text-left flex-1", selectedOption || value ? "text-gray-900 font-semibold" : "text-gray-400 font-normal")}>
          {selectedOption ? selectedOption.label : value || placeholder}
        </span>
        <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 text-gray-400" />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={4}
        className={cn(
          "w-[var(--anchor-width)] min-w-[320px] max-w-full p-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50",
          popoverClassName
        )}
      >
        <div className="flex items-center gap-2 px-2.5 py-1.5 border-b border-gray-100 mb-1">
          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-7 text-xs border-0 focus-visible:ring-0 px-1 bg-transparent placeholder:text-gray-400"
          />
        </div>

        <div className="max-h-56 overflow-y-auto flex flex-col gap-0.5">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "flex items-center justify-between w-full px-2.5 py-1.5 text-xs rounded-sm text-left font-medium transition-colors cursor-pointer",
                  value === option.value
                    ? "bg-[#0B192C] text-white font-bold"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <span>{option.label}</span>
                {value === option.value && <Check className="w-3.5 h-3.5 text-[#FF7F50]" />}
              </button>
            ))
          ) : allowCustom && search.trim() ? (
            <button
              type="button"
              onClick={() => handleSelect(search.trim())}
              className="flex items-center gap-2 w-full px-2.5 py-2 text-xs rounded-sm text-left font-semibold text-[#FF7F50] hover:bg-[#FF7F50]/10 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add "{search.trim()}"</span>
            </button>
          ) : (
            <div className="py-3 px-2 text-center text-xs text-gray-400">No results found.</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
