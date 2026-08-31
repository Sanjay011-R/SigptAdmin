import { useRef, useEffect, useCallback } from "react"
import { Bold, Italic, Underline, List, ListOrdered, Link2, Heading2, RemoveFormatting } from "lucide-react"

interface RichTextEditorProps {
    value: string
    onChange: (html: string) => void
    placeholder?: string
    minHeight?: string
}

// Lightweight contentEditable-based rich text editor.
// Stores content as an HTML string, so it plugs into any string field
// (e.g. formData.jobSummary) without pulling in an external editor library.
export function RichTextEditor({ value, onChange, placeholder, minHeight = "160px" }: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null)
    const isFocused = useRef(false)

    // Only sync external value -> DOM when the field isn't being actively typed in,
    // so the caret doesn't jump on every keystroke.
    useEffect(() => {
        if (editorRef.current && !isFocused.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value || ""
        }
    }, [value])

    const emit = useCallback(() => {
        if (editorRef.current) onChange(editorRef.current.innerHTML)
    }, [onChange])

    const exec = (command: string, arg?: string) => {
        editorRef.current?.focus()
        document.execCommand(command, false, arg)
        emit()
    }

    const handleLink = () => {
        const url = window.prompt("Link URL")
        if (url) exec("createLink", url)
    }

    const isEmpty = !value || value === "<br>" || value === "<p></p>"

    const tools: { icon: React.ReactNode; label: string; action: () => void }[] = [
        { icon: <Bold className="w-3.5 h-3.5" />, label: "Bold", action: () => exec("bold") },
        { icon: <Italic className="w-3.5 h-3.5" />, label: "Italic", action: () => exec("italic") },
        { icon: <Underline className="w-3.5 h-3.5" />, label: "Underline", action: () => exec("underline") },
        { icon: <Heading2 className="w-3.5 h-3.5" />, label: "Heading", action: () => exec("formatBlock", "h4") },
        { icon: <List className="w-3.5 h-3.5" />, label: "Bulleted list", action: () => exec("insertUnorderedList") },
        { icon: <ListOrdered className="w-3.5 h-3.5" />, label: "Numbered list", action: () => exec("insertOrderedList") },
        { icon: <Link2 className="w-3.5 h-3.5" />, label: "Link", action: handleLink },
        { icon: <RemoveFormatting className="w-3.5 h-3.5" />, label: "Clear formatting", action: () => exec("removeFormat") },
    ]

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:border-gray-300 focus-within:border-brand-orange focus-within:ring-1 focus-within:ring-brand-orange/20 transition-all">
            <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50/60">
                {tools.map((tool) => (
                    <button
                        key={tool.label}
                        type="button"
                        title={tool.label}
                        onMouseDown={(e) => e.preventDefault() /* keep editor selection/focus */}
                        onClick={tool.action}
                        className="p-1.5 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-200/70 cursor-pointer transition-colors"
                    >
                        {tool.icon}
                    </button>
                ))}
            </div>

            <div className="relative">
                {isEmpty && placeholder && (
                    <div className="absolute top-3 left-3.5 text-xs text-gray-400 pointer-events-none select-none">
                        {placeholder}
                    </div>
                )}
                <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onFocus={() => (isFocused.current = true)}
                    onBlur={() => (isFocused.current = false)}
                    onInput={emit}
                    className="rte-content px-3.5 py-3 text-[13px] leading-relaxed text-gray-800 outline-none"
                    style={{ minHeight }}
                />
            </div>

            {/* Scoped styling for content produced by execCommand (h4, ul, ol, a) */}
            <style>{`
        .rte-content h4 { font-size: 13.5px; font-weight: 700; color: #111827; margin: 8px 0 4px; }
        .rte-content ul { list-style: disc; padding-left: 20px; margin: 4px 0; }
        .rte-content ol { list-style: decimal; padding-left: 20px; margin: 4px 0; }
        .rte-content li { margin: 2px 0; }
        .rte-content a { color: #FF7F50; text-decoration: underline; }
        .rte-content p { margin: 4px 0; }
      `}</style>
        </div>
    )
}