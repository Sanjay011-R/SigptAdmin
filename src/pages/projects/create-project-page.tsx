import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { MainLayout } from "@/layouts/main-layout"
import { useAuditLogger } from "@/hooks/use-audit-logger"
import { useAuth } from "@/hooks/use-auth"
import {
  saveProject,
  getProjectById,
  type ProjectRecord,
  type ContentBlock,
  type BlockType,
  type BulletStyle,
  type CardStyle,
  type CardColor,
  type GridBlock,
  type SplitBlock,
  type MetricsBlock,
  type BadgeBlock,
  type ListBlock,
  type ParagraphBlock,
  type HeadingBlock,
  type TableBlock,
  type ImageBlock,
  type VideoBlock,
  type CalloutBlock,
} from "@/services/project-storage-service"
import { compressImage, extractVideoPoster } from "@/services/media-compressor-service"
import { saveMediaAsset, resolveMediaUrl } from "@/services/media-storage-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  Trash2,
  Image as ImageIcon,
  Video,
  Table as TableIcon,
  Heading,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Quote,
  List,
  Upload,
  Eye,
  Edit3,
  CheckCircle2,
  Calendar,
  User,
  Building,
  PlusCircle,
  MinusCircle,
  Sparkles,
  Sliders,
  ArrowUp,
  ArrowDown,
  Bold,
  Italic,
  Type,
  LayoutGrid,
  Minus,
  Undo2,
  Redo2,
  Scissors,
  Copy,
  Clipboard,
  Check,
  Tag,
  BarChart3,
  ArrowRight,
  FlipHorizontal2,
  Columns2,
} from "lucide-react"

/* ============================================================================
   COLOR PALETTE SYSTEM
   ============================================================================ */

const CARD_COLORS: Record<
  Exclude<CardColor, "custom">,
  { bg: string; border: string; text: string; swatch: string; label: string }
> = {
  white:   { bg: "bg-white",      border: "border-gray-200",    text: "text-gray-900",    swatch: "#ffffff", label: "White" },
  slate:   { bg: "bg-slate-50",   border: "border-slate-200",   text: "text-slate-900",   swatch: "#cbd5e1", label: "Slate" },
  orange:  { bg: "bg-orange-50",  border: "border-orange-200",  text: "text-orange-900",  swatch: "#fb923c", label: "Orange" },
  indigo:  { bg: "bg-indigo-50",  border: "border-indigo-200",  text: "text-indigo-900",  swatch: "#818cf8", label: "Indigo" },
  emerald: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-900", swatch: "#34d399", label: "Emerald" },
  rose:    { bg: "bg-rose-50",    border: "border-rose-200",    text: "text-rose-900",    swatch: "#fb7185", label: "Rose" },
  amber:   { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-900",   swatch: "#fbbf24", label: "Amber" },
  sky:     { bg: "bg-sky-50",     border: "border-sky-200",     text: "text-sky-900",     swatch: "#38bdf8", label: "Sky" },
  violet:  { bg: "bg-violet-50",  border: "border-violet-200",  text: "text-violet-900",  swatch: "#a78bfa", label: "Violet" },
}

const PALETTE_ORDER: Exclude<CardColor, "custom">[] = [
  "white", "slate", "orange", "amber", "rose", "violet", "indigo", "sky", "emerald",
]

function cardStyleClasses(style: CardStyle = "minimal", color: CardColor = "white", customColor?: string) {
  if (color === "custom" && customColor) {
    switch (style) {
      case "filled":
        return { className: "border shadow-none", style: { backgroundColor: `${customColor}1A`, borderColor: `${customColor}66` } }
      case "outlined":
        return { className: "bg-white border-2 shadow-none", style: { borderColor: customColor } }
      case "elevated":
        return { className: "bg-white border border-gray-100 shadow-md", style: {} }
      case "minimal":
      default:
        return { className: "bg-white border-none shadow-none", style: {} }
    }
  }

  const c = CARD_COLORS[color as Exclude<CardColor, "custom">] || CARD_COLORS.white
  switch (style) {
    case "filled":
      return { className: `${c.bg} ${c.border} border shadow-none`, style: {} }
    case "outlined":
      return { className: `bg-white ${c.border} border-2 shadow-none`, style: {} }
    case "elevated":
      return { className: `bg-white border border-gray-100 shadow-md`, style: {} }
    case "minimal":
    default:
      return { className: `bg-white border-none shadow-none`, style: {} }
  }
}

function swatchFor(color: CardColor, customColor?: string) {
  if (color === "custom") return customColor || "#ffffff"
  return CARD_COLORS[color]?.swatch || "#ffffff"
}



function renderFormattedContent(rawText: string) {
  if (!rawText) return null

  const html = rawText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/&lt;b&gt;(.*?)&lt;\/b&gt;/gi, "<strong>$1</strong>")
    .replace(/&lt;i&gt;(.*?)&lt;\/i&gt;/gi, "<em>$1</em>")
    .replace(/&lt;strong&gt;(.*?)&lt;\/strong&gt;/gi, "<strong>$1</strong>")
    .replace(/&lt;em&gt;(.*?)&lt;\/em&gt;/gi, "<em>$1</em>")
    .replace(/\*\*(.*?)\*\*/g, "<strong class='font-bold text-gray-900'>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em class='italic'>$1</em>")

  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

export function CreateProjectPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const { logPageView, logStateMutation } = useAuditLogger()
  const isEditing = Boolean(id)

  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor")
  const [saving, setSaving] = useState(false)

  const [activeSelection, setActiveSelection] = useState<{
    blockId: string
    start: number
    end: number
  } | null>(null)

  const [copiedBlock, setCopiedBlock] = useState<ContentBlock | null>(null)
  const [history, setHistory] = useState<ContentBlock[][]>([])
  const [historyIndex, setHistoryIndex] = useState<number>(-1)
  const isUndoRedoAction = useRef(false)

  const [name, setName] = useState("")
  const [department, setDepartment] = useState("Engineering")
  const [postedBy, setPostedBy] = useState(
    authUser?.email ? authUser.email.split("@")[0] : ""
  )
  const [deadline, setDeadline] = useState("")
  const [status, setStatus] = useState<ProjectRecord["status"]>("Draft")
  const [openPositions, setOpenPositions] = useState(1)
  const [coverImage, setCoverImage] = useState("")
  const [summary, setSummary] = useState("")

  const [blocks, setBlocks] = useState<ContentBlock[]>([
    {
      id: "block-1",
      type: "paragraph",
      text: "",
      fontFamily: "sans",
      align: "left",
    },
  ])

  useEffect(() => {
    logPageView(isEditing ? "Edit Project" : "Create Project")
  }, [logPageView, isEditing])

  useEffect(() => {
    if (id) {
      getProjectById(id).then((existing) => {
        if (existing) {
          setName(existing.name)
          setDepartment(existing.department)
          setPostedBy(existing.postedBy)
          setDeadline(existing.deadline || "")
          setStatus(existing.status)
          setOpenPositions(existing.openPositions)
          setCoverImage(existing.coverImage || "")
          setSummary(existing.summary || "")
          if (existing.blocks && existing.blocks.length > 0) {
            setBlocks(existing.blocks)
          }
        }
      })
    }
  }, [id])

  useEffect(() => {
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false
      return
    }

    if (history.length === 0) {
      setHistory([blocks])
      setHistoryIndex(0)
    } else {
      const currentHistory = history.slice(0, historyIndex + 1)
      setHistory([...currentHistory, blocks])
      setHistoryIndex(currentHistory.length)
    }
  }, [blocks])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey
      if (isCmdOrCtrl) {
        if (e.key.toLowerCase() === "z") {
          if (e.shiftKey) {
            e.preventDefault()
            handleRedo()
          } else {
            e.preventDefault()
            handleUndo()
          }
        } else if (e.key.toLowerCase() === "y") {
          e.preventDefault()
          handleRedo()
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [historyIndex, history])

  const handleUndo = () => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true
      setBlocks(history[historyIndex - 1])
      setHistoryIndex(historyIndex - 1)
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      isUndoRedoAction.current = true
      setBlocks(history[historyIndex + 1])
      setHistoryIndex(historyIndex + 1)
    }
  }

  const handleCopyBlock = (block: ContentBlock) => {
    setCopiedBlock(block)
    const textToCopy = "text" in block ? (block as ParagraphBlock | HeadingBlock).text : JSON.stringify(block)
    navigator.clipboard.writeText(textToCopy)
  }

  const handleCutBlock = (blockId: string) => {
    const target = blocks.find((b) => b.id === blockId)
    if (target) {
      setCopiedBlock(target)
      const textToCopy = "text" in target ? (target as ParagraphBlock | HeadingBlock).text : JSON.stringify(target)
      navigator.clipboard.writeText(textToCopy)
      deleteBlock(blockId)
    }
  }

  const handlePasteBlock = (targetIndex?: number) => {
    if (copiedBlock) {
      const pasted: ContentBlock = { ...copiedBlock, id: `block-${Date.now()}` }
      if (typeof targetIndex === "number") {
        const next = [...blocks]
        next.splice(targetIndex + 1, 0, pasted)
        setBlocks(next)
      } else {
        setBlocks((prev) => [...prev, pasted])
      }
    } else {
      navigator.clipboard.readText().then((clipText) => {
        if (clipText.trim()) {
          const newBlock: ContentBlock = {
            id: `block-${Date.now()}`,
            type: "paragraph",
            text: clipText.trim(),
            fontFamily: "sans",
          }
          if (typeof targetIndex === "number") {
            const next = [...blocks]
            next.splice(targetIndex + 1, 0, newBlock)
            setBlocks(next)
          } else {
            setBlocks((prev) => [...prev, newBlock])
          }
        }
      })
    }
  }

  const addBlock = (type: BlockType) => {
    const newId = `block-${Date.now()}`
    let newBlock: ContentBlock

    switch (type) {
      case "heading":
        newBlock = {
          id: newId,
          type: "heading",
          level: 2,
          text: "",
          fontFamily: "serif",
          bold: true,
        }
        break
      case "image":
        newBlock = {
          id: newId,
          type: "image",
          url: "",
          caption: "",
        }
        break
      case "video":
        newBlock = {
          id: newId,
          type: "video",
          url: "",
          caption: "",
          posterUrl: "",
        }
        break
      case "table":
        newBlock = {
          id: newId,
          type: "table",
          headers: ["Column 1", "Column 2"],
          rows: [
            ["", ""],
          ],
        }
        break
      case "callout":
        newBlock = {
          id: newId,
          type: "callout",
          tone: "info",
          text: "",
        }
        break
      case "list":
        newBlock = {
          id: newId,
          type: "list",
          bulletStyle: "check",
          items: [""],
        }
        break
      case "metrics":
        newBlock = {
          id: newId,
          type: "metrics",
          items: [
            { value: "", label: "" },
          ],
        }
        break
      case "badge":
        newBlock = {
          id: newId,
          type: "badge",
          categoryTitle: "",
          tags: [],
        }
        break
      case "divider":
        newBlock = { id: newId, type: "divider" }
        break
      case "grid":
        newBlock = {
          id: newId,
          type: "grid",
          columns: [
            {
              title: "",
              text: "",
              color: "white",
              style: "elevated",
            },
            {
              title: "",
              text: "",
              color: "white",
              style: "elevated",
            },
          ],
        }
        break
      case "split":
        newBlock = {
          id: newId,
          type: "split",
          imageUrl: "",
          imagePosition: "left",
          heading: "",
          text: "",
          color: "white",
          style: "elevated",
        }
        break
      case "paragraph":
      default:
        newBlock = {
          id: newId,
          type: "paragraph",
          text: "",
          fontFamily: "sans",
          align: "left",
        }
        break
    }

    setBlocks((prev) => [...prev, newBlock])
  }

  const updateBlock = (blockId: string, updated: Partial<ContentBlock>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? ({ ...b, ...updated } as ContentBlock) : b))
    )
  }

  const deleteBlock = (blockId: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId))
  }

  const applyInlineFormatting = (blockId: string, formatType: "bold" | "italic") => {
    const targetBlock = blocks.find((b) => b.id === blockId)
    if (!targetBlock || (targetBlock.type !== "paragraph" && targetBlock.type !== "heading")) return

    const text = (targetBlock as ParagraphBlock | HeadingBlock).text
    const range = activeSelection && activeSelection.blockId === blockId ? activeSelection : null
    const wrapper = formatType === "bold" ? "**" : "*"

    if (range && range.start !== range.end) {
      const before = text.substring(0, range.start)
      const selected = text.substring(range.start, range.end)
      const after = text.substring(range.end)

      let newText = ""
      if (selected.startsWith(wrapper) && selected.endsWith(wrapper)) {
        newText = before + selected.slice(wrapper.length, -wrapper.length) + after
      } else {
        newText = `${before}${wrapper}${selected}${wrapper}${after}`
      }
      updateBlock(blockId, { text: newText } as Partial<ContentBlock>)
    } else {
      const placeholder = formatType === "bold" ? "bold text" : "italic text"
      updateBlock(blockId, { text: `${text} ${wrapper}${placeholder}${wrapper}` } as Partial<ContentBlock>)
    }
  }

  const moveBlockUp = (index: number) => {
    if (index <= 0) return
    setBlocks((prev) => {
      const copy = [...prev]
      const temp = copy[index - 1]
      copy[index - 1] = copy[index]
      copy[index] = temp
      return copy
    })
  }

  const moveBlockDown = (index: number) => {
    setBlocks((prev) => {
      if (index >= prev.length - 1) return prev
      const copy = [...prev]
      const temp = copy[index + 1]
      copy[index + 1] = copy[index]
      copy[index] = temp
      return copy
    })
  }

  const addTableRow = (tableId: string) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id === tableId && b.type === "table") {
          const newRow = new Array(b.headers.length).fill("Cell Data")
          return { ...b, rows: [...b.rows, newRow] }
        }
        return b
      })
    )
  }

  const removeTableRow = (tableId: string, rowIndex: number) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id === tableId && b.type === "table") {
          return { ...b, rows: b.rows.filter((_, idx) => idx !== rowIndex) }
        }
        return b
      })
    )
  }

  const addTableColumn = (tableId: string) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id === tableId && b.type === "table") {
          const colNum = b.headers.length + 1
          const newHeaders = [...b.headers, `Column ${colNum}`]
          const newRows = b.rows.map((row) => [...row, "-"])
          return { ...b, headers: newHeaders, rows: newRows }
        }
        return b
      })
    )
  }

  const removeTableColumn = (tableId: string, colIndex: number) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id === tableId && b.type === "table" && b.headers.length > 1) {
          const newHeaders = b.headers.filter((_, idx) => idx !== colIndex)
          const newRows = b.rows.map((row) => row.filter((_, idx) => idx !== colIndex))
          return { ...b, headers: newHeaders, rows: newRows }
        }
        return b
      })
    )
  }

  const handleSave = async (publishStatus: ProjectRecord["status"] = status) => {
    if (!name.trim()) {
      alert("Please enter a project title.")
      return
    }

    setSaving(true)
    try {
      const saved = await saveProject({
        id: id || undefined,
        name: name.trim(),
        department,
        postedBy,
        deadline,
        status: publishStatus,
        openPositions: Number(openPositions),
        coverImage,
        summary,
        blocks,
      })

      await logStateMutation({
        category: "Jobs",
        action: isEditing ? "Project Updated" : "New Project Published",
        type: isEditing ? "update" : "create",
        targetEntity: `${saved.id} (${saved.name})`,
        details: `Published recruitment project with ${blocks.length} content blocks.`,
        changes: [{ field: "status", from: status, to: publishStatus }],
      })

      navigate("/projects")
    } catch (err) {
      console.error("Failed to save project:", err)
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: "cover" | string) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const compressed = await compressImage(file)
      const mediaId = `media_img_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
      await saveMediaAsset(mediaId, compressed.blob)
      const activeUrl = compressed.dataUrl || URL.createObjectURL(compressed.blob)

      if (target === "cover") {
        setCoverImage(activeUrl)
      } else {
        updateBlock(target, { url: activeUrl } as Partial<ImageBlock>)
      }
    } catch (err) {
      console.error("Image compression/storage failed:", err)
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        if (target === "cover") setCoverImage(result)
        else updateBlock(target, { url: result } as Partial<ImageBlock>)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGridImageUpload = async (blockId: string, colIdx: number, file: File) => {
    try {
      const compressed = await compressImage(file)
      const mediaId = `media_grid_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
      await saveMediaAsset(mediaId, compressed.blob)
      const activeUrl = compressed.dataUrl || URL.createObjectURL(compressed.blob)

      setBlocks((prev) =>
        prev.map((b) => {
          if (b.id === blockId && b.type === "grid") {
            const newCols = [...b.columns]
            newCols[colIdx] = { ...newCols[colIdx], imageUrl: activeUrl }
            return { ...b, columns: newCols }
          }
          return b
        })
      )
    } catch (err) {
      console.error("Grid image upload error:", err)
    }
  }

  const handleSplitImageUpload = async (blockId: string, file: File) => {
    try {
      const compressed = await compressImage(file)
      const mediaId = `media_split_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
      await saveMediaAsset(mediaId, compressed.blob)
      const activeUrl = compressed.dataUrl || URL.createObjectURL(compressed.blob)
      updateBlock(blockId, { imageUrl: activeUrl } as Partial<SplitBlock>)
    } catch (err) {
      console.error("Split image upload error:", err)
    }
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>, blockId: string) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const mediaId = `media_vid_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
      await saveMediaAsset(mediaId, file)
      const videoObjectUrl = URL.createObjectURL(file)

      let posterDataUrl = ""
      try {
        const poster = await extractVideoPoster(file)
        const posterId = `${mediaId}_poster`
        await saveMediaAsset(posterId, poster.blob)
        posterDataUrl = poster.dataUrl
      } catch (posterErr) {
        console.warn("Could not extract video poster thumbnail frame:", posterErr)
      }

      updateBlock(blockId, {
        url: videoObjectUrl,
        posterUrl: posterDataUrl || undefined,
      } as Partial<VideoBlock>)
    } catch (err) {
      console.error("Video upload error:", err)
    }
  }

  return (
    <MainLayout pageTitle={isEditing ? "Edit Project" : "Create Recruitment Project"}>
      <div className="flex flex-col gap-6 font-sans w-full max-w-7xl mx-auto pb-16">
        {/* Top Control Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E1D6]">
          <button
            onClick={() => navigate("/projects")}
            className="group inline-flex items-center gap-2 text-xs font-mono font-bold tracking-wider text-[#9A9284] hover:text-[#FF7A00] transition-colors cursor-pointer w-fit uppercase"
          >
            <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
            <span>BACK TO PROJECTS</span>
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-[#F7F2EA] p-1 rounded-xl flex items-center gap-1 border border-[#E8E1D6]">
              <button
                type="button"
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-1.5 rounded-lg text-xs font-bold transition-all text-[#5B6472] hover:text-[#161C2D] hover:bg-white disabled:opacity-30 cursor-pointer"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-1.5 rounded-lg text-xs font-bold transition-all text-[#5B6472] hover:text-[#161C2D] hover:bg-white disabled:opacity-30 cursor-pointer"
                title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#F7F2EA] p-1 rounded-xl flex items-center gap-1 border border-[#E8E1D6]">
              <button
                type="button"
                onClick={() => setActiveTab("editor")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "editor"
                    ? "bg-white text-[#161C2D] shadow-xs font-mono"
                    : "text-[#5B6472] hover:text-[#161C2D]"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editor</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "preview"
                    ? "bg-[#161C2D] text-[#FF7A00] shadow-xs font-mono"
                    : "text-[#5B6472] hover:text-[#161C2D]"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
            </div>

            <Button
              variant="outline"
              onClick={() => handleSave("Draft")}
              disabled={saving}
              className="h-9 text-xs font-mono font-bold rounded-xl border-[#E8E1D6] bg-white text-[#161C2D] hover:bg-[#F7F2EA] cursor-pointer"
            >
              Save Draft
            </Button>

            <Button
              onClick={() => handleSave("Published")}
              disabled={saving}
              className="h-9 bg-[#161C2D] hover:bg-[#FF7A00] text-white text-xs font-mono font-bold tracking-wider uppercase rounded-xl shadow-xs cursor-pointer px-5 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              <span>{isEditing ? "Update Project" : "Publish Project"}</span>
            </Button>
          </div>
        </div>

        {activeTab === "editor" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
            {/* LEFT MAIN COLUMN */}
            <div className="lg:col-span-8 flex flex-col gap-6 bg-white p-6 sm:p-10 rounded-3xl border border-[#E8E1D6] shadow-sm text-[#161C2D]">
              {/* Cover Image Banner */}
              {coverImage ? (
                <div className="relative group rounded-2xl overflow-hidden border border-[#E8E1D6] bg-[#FDF8F1] min-h-[180px] max-h-[300px] flex items-center justify-center">
                  <img src={coverImage} alt="Project Banner" className="w-full h-64 object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <label className="px-4 py-2 bg-white text-[#161C2D] font-mono font-bold text-xs rounded-xl shadow-lg cursor-pointer hover:bg-[#FDF8F1] transition-colors flex items-center gap-2">
                      <Upload className="w-4 h-4 text-[#FF7A00]" />
                      <span>Upload Cover Image</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "cover")} />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const url = prompt("Enter Cover Image URL:", coverImage)
                        if (url !== null) setCoverImage(url)
                      }}
                      className="px-4 py-2 bg-[#161C2D] text-white font-mono font-bold text-xs rounded-xl shadow-lg hover:bg-[#FF7A00] transition-colors cursor-pointer"
                    >
                      Paste Image URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoverImage("")}
                      className="px-4 py-2 bg-rose-600 text-white font-mono font-bold text-xs rounded-xl shadow-lg hover:bg-rose-700 transition-colors cursor-pointer flex items-center gap-1.5"
                      title="Remove Cover Image"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <label className="px-3.5 py-2 bg-[#FDF8F1] hover:bg-white border border-[#E8E1D6] text-[#161C2D] font-mono font-bold text-xs rounded-xl cursor-pointer transition-colors flex items-center gap-2 w-fit">
                    <ImageIcon className="w-4 h-4 text-[#FF7A00]" />
                    <span>Add Cover Photograph</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "cover")} />
                  </label>
                </div>
              )}

              {/* Title & Subtitle */}
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Project Title (e.g. Silicon Architecture Hiring Drive)"
                  className="w-full text-2xl sm:text-4xl font-bold font-serif tracking-tight text-[#161C2D] focus:outline-none placeholder:text-gray-300 border-b border-transparent focus:border-[#E8E1D6] pb-2"
                />
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Subtitle or brief project summary..."
                  rows={2}
                  className="w-full text-base font-sans text-[#5B6472] focus:outline-none placeholder:text-gray-400 resize-none border-l-2 border-[#FF7A00] pl-3 italic"
                />
              </div>

              <hr className="border-[#E8E1D6]" />

              {/* Content Blocks List */}
              <div className="flex flex-col gap-6">
                {blocks.map((block, index) => (
                  <div
                    key={block.id}
                    className="relative group rounded-xl border border-transparent hover:border-gray-200 p-4 -mx-4 transition-all"
                  >
                    {/* Right action toolbar */}
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm transition-opacity z-10">
                      <button type="button" onClick={() => moveBlockUp(index)} disabled={index === 0}
                        className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-gray-700 rounded-md disabled:opacity-30 cursor-pointer transition-colors" title="Move Up">
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button type="button" onClick={() => moveBlockDown(index)} disabled={index === blocks.length - 1}
                        className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-gray-700 rounded-md disabled:opacity-30 cursor-pointer transition-colors" title="Move Down">
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <div className="w-px h-4 bg-gray-200" />
                      <button type="button" onClick={() => handleCopyBlock(block)}
                        className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-gray-700 rounded-md cursor-pointer transition-colors" title="Copy Block">
                        <Copy className="w-3 h-3" />
                      </button>
                      <button type="button" onClick={() => handleCutBlock(block.id)}
                        className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-amber-600 rounded-md cursor-pointer transition-colors" title="Cut Block">
                        <Scissors className="w-3 h-3" />
                      </button>
                      <div className="w-px h-4 bg-gray-200" />
                      <button type="button" onClick={() => deleteBlock(block.id)}
                        className="p-1.5 hover:bg-rose-50 text-gray-500 hover:text-rose-600 rounded-md cursor-pointer transition-colors" title="Delete Block">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Rich text toolbar */}
                    {(block.type === "paragraph" || block.type === "heading") && (
                      <div className="flex flex-wrap items-center gap-1.5 mb-2 p-1 bg-gray-50/80 rounded-lg border border-gray-200/60 w-fit text-xs">
                        <button type="button" onMouseDown={(e) => { e.preventDefault(); applyInlineFormatting(block.id, "bold") }}
                          className={`p-1 rounded transition-colors cursor-pointer text-gray-700 hover:text-gray-900 hover:bg-white ${block.bold ? "bg-white font-black text-gray-900 shadow-2xs" : ""}`}
                          title="Bold Selected Text">
                          <Bold className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onMouseDown={(e) => { e.preventDefault(); applyInlineFormatting(block.id, "italic") }}
                          className={`p-1 rounded transition-colors cursor-pointer text-gray-700 hover:text-gray-900 hover:bg-white ${block.italic ? "bg-white font-black text-gray-900 shadow-2xs" : ""}`}
                          title="Italicize Selected Text">
                          <Italic className="w-3.5 h-3.5" />
                        </button>
                        <div className="w-px h-3.5 bg-gray-300 my-auto" />
                        <div className="flex items-center gap-1">
                          <Type className="w-3 h-3 text-gray-400" />
                          <select
                            value={block.fontFamily || (block.type === "heading" ? "serif" : "sans")}
                            onChange={(e) => updateBlock(block.id, { fontFamily: e.target.value as "sans" | "serif" | "mono" } as Partial<ParagraphBlock | HeadingBlock>)}
                            className="bg-transparent font-bold text-[11px] text-gray-700 outline-none cursor-pointer"
                          >
                            <option value="sans">Sans-Serif</option>
                            <option value="serif">Serif</option>
                            <option value="mono">Monospace</option>
                          </select>
                        </div>
                        <div className="w-px h-3.5 bg-gray-300 my-auto" />
                        <div className="flex items-center gap-0.5">
                          <button type="button" onClick={() => updateBlock(block.id, { align: "left" } as Partial<ParagraphBlock | HeadingBlock>)}
                            className={`p-1 rounded cursor-pointer ${block.align === "left" || !block.align ? "bg-white text-gray-900 font-bold" : "text-gray-400"}`} title="Align Left">
                            <AlignLeft className="w-3 h-3" />
                          </button>
                          <button type="button" onClick={() => updateBlock(block.id, { align: "center" } as Partial<ParagraphBlock | HeadingBlock>)}
                            className={`p-1 rounded cursor-pointer ${block.align === "center" ? "bg-white text-gray-900 font-bold" : "text-gray-400"}`} title="Align Center">
                            <AlignCenter className="w-3 h-3" />
                          </button>
                          <button type="button" onClick={() => updateBlock(block.id, { align: "right" } as Partial<ParagraphBlock | HeadingBlock>)}
                            className={`p-1 rounded cursor-pointer ${block.align === "right" ? "bg-white text-gray-900 font-bold" : "text-gray-400"}`} title="Align Right">
                            <AlignRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Paragraph */}
                    {block.type === "paragraph" && (
                      <div className="flex flex-col gap-1">
                        <Textarea
                          value={block.text}
                          onChange={(e) => updateBlock(block.id, { text: e.target.value } as Partial<ParagraphBlock>)}
                          onSelect={(e) => setActiveSelection({ blockId: block.id, start: e.currentTarget.selectionStart, end: e.currentTarget.selectionEnd })}
                          onMouseUp={(e) => setActiveSelection({ blockId: block.id, start: e.currentTarget.selectionStart, end: e.currentTarget.selectionEnd })}
                          onKeyUp={(e) => setActiveSelection({ blockId: block.id, start: e.currentTarget.selectionStart, end: e.currentTarget.selectionEnd })}
                          placeholder="Write your story, project specifications, or notes here..."
                          rows={3}
                          className={`w-full border-none focus-visible:ring-0 p-0 text-sm leading-relaxed text-gray-800 resize-none ${block.bold ? "font-bold" : "font-normal"} ${block.italic ? "italic" : ""} ${block.fontFamily === "serif" ? "font-serif" : block.fontFamily === "mono" ? "font-mono" : "font-sans"} ${block.align === "center" ? "text-center" : block.align === "right" ? "text-right" : "text-left"}`}
                        />
                        {(block.text.includes("**") || block.text.includes("*") || block.text.includes("<b>")) && (
                          <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 mt-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Formatted Preview:</span>
                            <div>{renderFormattedContent(block.text)}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Heading */}
                    {block.type === "heading" && (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <select
                            value={block.level}
                            onChange={(e) => updateBlock(block.id, { level: Number(e.target.value) as 2 | 3 } as Partial<HeadingBlock>)}
                            className="text-xs font-bold text-gray-400 bg-transparent outline-none cursor-pointer"
                          >
                            <option value={2}>H2</option>
                            <option value={3}>H3</option>
                          </select>
                          <input
                            type="text"
                            value={block.text}
                            onChange={(e) => updateBlock(block.id, { text: e.target.value } as Partial<HeadingBlock>)}
                            onSelect={(e) => setActiveSelection({ blockId: block.id, start: e.currentTarget.selectionStart || 0, end: e.currentTarget.selectionEnd || 0 })}
                            onMouseUp={(e) => setActiveSelection({ blockId: block.id, start: e.currentTarget.selectionStart || 0, end: e.currentTarget.selectionEnd || 0 })}
                            onKeyUp={(e) => setActiveSelection({ blockId: block.id, start: e.currentTarget.selectionStart || 0, end: e.currentTarget.selectionEnd || 0 })}
                            placeholder="Heading Title..."
                            className={`w-full text-gray-900 border-none focus:outline-none placeholder:text-gray-300 ${block.level === 2 ? "text-xl sm:text-2xl" : "text-lg"} ${block.bold ? "font-bold" : "font-semibold"} ${block.italic ? "italic" : ""} ${block.fontFamily === "sans" ? "font-sans" : block.fontFamily === "mono" ? "font-mono" : "font-serif"} ${block.align === "center" ? "text-center" : block.align === "right" ? "text-right" : "text-left"}`}
                          />
                        </div>
                        {(block.text.includes("**") || block.text.includes("*") || block.text.includes("<b>")) && (
                          <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-800 font-medium mt-1">
                            {renderFormattedContent(block.text)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* METRICS STATS COUNTER BLOCK */}
                    {block.type === "metrics" && (
                      <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 flex flex-col gap-3">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                          <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-slate-500 font-bold">
                            <BarChart3 className="w-3.5 h-3.5 text-slate-600" /> Key Metrics &amp; Performance Stats
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateBlock(block.id, {
                                items: [...block.items, { value: "100%", label: "METRIC LABEL" }],
                              } as Partial<MetricsBlock>)
                            }
                            className="text-xs text-[#FF7F50] hover:text-[#E56A3C] font-semibold cursor-pointer transition-colors"
                          >
                            + Add Stat
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {block.items.map((metric, mIdx) => (
                            <div key={mIdx} className="p-3 bg-white rounded-lg border border-slate-200 flex flex-col gap-1.5 relative group/stat shadow-2xs">
                              <button
                                type="button"
                                onClick={() =>
                                  updateBlock(block.id, {
                                    items: block.items.filter((_, idx) => idx !== mIdx),
                                  } as Partial<MetricsBlock>)
                                }
                                className="absolute top-2 right-2 text-gray-400 hover:text-rose-600 cursor-pointer opacity-0 group-hover/stat:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Stat Value</label>
                              <Input
                                value={metric.value}
                                onChange={(e) => {
                                  const newItems = [...block.items]
                                  newItems[mIdx].value = e.target.value
                                  updateBlock(block.id, { items: newItems } as Partial<MetricsBlock>)
                                }}
                                placeholder="e.g. 2.1 GHz"
                                className="h-8 text-base font-extrabold text-slate-900 bg-slate-50/50 border-slate-200 font-mono focus:bg-white"
                              />
                              <label className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">Sub Label</label>
                              <Input
                                value={metric.label}
                                onChange={(e) => {
                                  const newItems = [...block.items]
                                  newItems[mIdx].label = e.target.value
                                  updateBlock(block.id, { items: newItems } as Partial<MetricsBlock>)
                                }}
                                placeholder="CLOCK FREQUENCY"
                                className="h-7 text-[11px] font-semibold text-slate-600 bg-slate-50/50 border-slate-200 tracking-wider focus:bg-white"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* TECH STACK / TOOLCHAIN TAG BADGES BLOCK */}
                    {block.type === "badge" && (
                      <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 flex flex-col gap-3">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                          <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-slate-500 font-bold">
                            <Tag className="w-3.5 h-3.5 text-slate-600" /> Tech Stack &amp; Tag Badges
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateBlock(block.id, {
                                tags: [...block.tags, "New Tool / Tag"],
                              } as Partial<BadgeBlock>)
                            }
                            className="text-xs text-[#FF7F50] hover:text-[#E56A3C] font-semibold cursor-pointer transition-colors"
                          >
                            + Add Tag Badge
                          </button>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category Title</label>
                          <Input
                            value={block.categoryTitle || ""}
                            onChange={(e) => updateBlock(block.id, { categoryTitle: e.target.value } as Partial<BadgeBlock>)}
                            placeholder="e.g. TOOLCHAIN or DELIVERABLES"
                            className="h-8 text-xs font-medium bg-white border-slate-200 max-w-xs"
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {block.tags.map((tag, tIdx) => (
                            <div key={tIdx} className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-md px-2.5 py-1 text-xs shadow-2xs">
                              <input
                                type="text"
                                value={tag}
                                onChange={(e) => {
                                  const newTags = [...block.tags]
                                  newTags[tIdx] = e.target.value
                                  updateBlock(block.id, { tags: newTags } as Partial<BadgeBlock>)
                                }}
                                className="font-mono text-slate-800 bg-transparent outline-none w-auto max-w-[160px]"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  updateBlock(block.id, {
                                    tags: block.tags.filter((_, idx) => idx !== tIdx),
                                  } as Partial<BadgeBlock>)
                                }
                                className="text-gray-400 hover:text-rose-600 cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ENHANCED BULLET LIST BLOCK */}
                    {block.type === "list" && (
                      <div className="flex flex-col gap-3 p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-700">Bullet Style:</span>
                            <select
                              value={block.bulletStyle || "check"}
                              onChange={(e) =>
                                updateBlock(block.id, {
                                  bulletStyle: e.target.value as BulletStyle,
                                } as Partial<ListBlock>)
                              }
                              className="text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1 outline-none cursor-pointer"
                            >
                              <option value="check">✓ Checkmark (Verified Outcomes)</option>
                              <option value="dot">• Standard Bullet Dot</option>
                              <option value="arrow">→ Arrow Bullet</option>
                              <option value="number">1. Numbered List</option>
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              updateBlock(block.id, { items: [...block.items, "New list requirement item"] } as Partial<ListBlock>)
                            }
                            className="text-xs text-[#FF7F50] hover:text-[#E56A3C] font-semibold cursor-pointer transition-colors"
                          >
                            + Add Bullet Item
                          </button>
                        </div>

                        {block.items.map((item, itemIdx) => (
                          <div key={itemIdx} className="flex items-center gap-2">
                            {block.bulletStyle === "check" ? (
                              <Check className="w-4 h-4 text-[#FF7F50] shrink-0 font-bold" />
                            ) : block.bulletStyle === "arrow" ? (
                              <ArrowRight className="w-3.5 h-3.5 text-[#FF7F50] shrink-0" />
                            ) : block.bulletStyle === "number" ? (
                              <span className="text-xs font-bold font-mono text-gray-500 w-4 text-right shrink-0">{itemIdx + 1}.</span>
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-[#FF7F50] shrink-0" />
                            )}
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => {
                                const newItems = [...block.items]
                                newItems[itemIdx] = e.target.value
                                updateBlock(block.id, { items: newItems } as Partial<ListBlock>)
                              }}
                              className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                updateBlock(block.id, {
                                  items: block.items.filter((_, idx) => idx !== itemIdx),
                                } as Partial<ListBlock>)
                              }
                              className="text-gray-400 hover:text-rose-600 cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Divider */}
                    {block.type === "divider" && (
                      <div className="py-3 flex items-center justify-center">
                        <hr className="w-full border-t border-slate-200 border-dashed" />
                      </div>
                    )}

                    {/* GRID BLOCK */}
                    {block.type === "grid" && (
                      <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 flex flex-col gap-3">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                          <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-slate-500 font-bold">
                            <LayoutGrid className="w-3.5 h-3.5 text-slate-600" />
                            <span>Responsive Grid Split Cards</span>
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateBlock(block.id, {
                                columns: [
                                  ...block.columns,
                                  { title: `Column ${block.columns.length + 1}`, text: "Column details...", color: "white", style: "elevated" },
                                ],
                              } as Partial<GridBlock>)
                            }
                            className="text-xs text-[#FF7F50] hover:text-[#E56A3C] font-semibold cursor-pointer transition-colors"
                          >
                            + Add Column Card
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {block.columns.map((col, colIdx) => {
                            const sc = cardStyleClasses(col.style, col.color, col.customColor)
                            return (
                              <div
                                key={colIdx}
                                className={`p-3 rounded-xl flex flex-col gap-2 relative group/col transition-colors ${sc.className}`}
                                style={sc.style}
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateBlock(block.id, { columns: block.columns.filter((_, idx) => idx !== colIdx) } as Partial<GridBlock>)
                                  }
                                  className="absolute top-2 right-2 text-gray-400 hover:text-rose-600 cursor-pointer opacity-0 group-hover/col:opacity-100 transition-opacity z-10"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>

                                <div className="relative rounded-lg overflow-hidden bg-gray-100 border border-gray-200 min-h-[90px] flex items-center justify-center">
                                  {col.imageUrl ? (
                                    <img src={col.imageUrl} alt={col.title} className="w-full h-28 object-cover" />
                                  ) : (
                                    <span className="text-[10px] text-gray-400">No image</span>
                                  )}
                                  <label className="absolute bottom-1 right-1 px-2 py-1 bg-white/90 text-[10px] font-bold rounded-md border border-gray-200 cursor-pointer hover:bg-white flex items-center gap-1">
                                    <Upload className="w-3 h-3" />
                                    Image
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) handleGridImageUpload(block.id, colIdx, file)
                                      }}
                                    />
                                  </label>
                                </div>

                                <Input
                                  value={col.title}
                                  onChange={(e) => {
                                    const newCols = [...block.columns]
                                    newCols[colIdx] = { ...newCols[colIdx], title: e.target.value }
                                    updateBlock(block.id, { columns: newCols } as Partial<GridBlock>)
                                  }}
                                  placeholder="Column Title..."
                                  className="h-8 text-xs font-bold bg-white/70 border-gray-200"
                                />
                                <Textarea
                                  value={col.text}
                                  onChange={(e) => {
                                    const newCols = [...block.columns]
                                    newCols[colIdx] = { ...newCols[colIdx], text: e.target.value }
                                    updateBlock(block.id, { columns: newCols } as Partial<GridBlock>)
                                  }}
                                  placeholder="Column description text..."
                                  rows={2}
                                  className="text-xs bg-white/70 border-gray-200 resize-none"
                                />
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* SPLIT BLOCK */}
                    {block.type === "split" && (
                      (() => {
                        const sc = cardStyleClasses(block.style, block.color, block.customColor)
                        return (
                          <div className={`p-4 rounded-xl border border-slate-200/80 flex flex-col gap-3 ${sc.className}`} style={sc.style}>
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                              <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-slate-500 font-bold">
                                <Columns2 className="w-3.5 h-3.5 text-slate-600" />
                                <span>Split Image / Text Section</span>
                              </span>
                              <button
                                  type="button"
                                  onClick={() =>
                                    updateBlock(block.id, {
                                      imagePosition: block.imagePosition === "left" ? "right" : "left",
                                    } as Partial<SplitBlock>)
                                  }
                                  className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold hover:bg-gray-50 cursor-pointer flex items-center gap-1"
                                >
                                  <FlipHorizontal2 className="w-3 h-3" />
                                  Flip to {block.imagePosition === "left" ? "Right" : "Left"}
                                </button>
                            </div>

                            <div
                              className={`grid grid-cols-1 md:grid-cols-2 gap-4 items-center ${
                                block.imagePosition === "right" ? "md:[&>*:first-child]:order-2" : ""
                              }`}
                            >
                              <div className="relative rounded-xl overflow-hidden bg-gray-100 border border-gray-200 min-h-[160px] flex items-center justify-center">
                                {block.imageUrl ? (
                                  <img src={block.imageUrl} alt={block.heading} className="w-full h-48 object-cover" />
                                ) : (
                                  <span className="text-xs text-gray-400">No image selected</span>
                                )}
                                <label className="absolute bottom-2 right-2 px-2.5 py-1.5 bg-white text-gray-800 font-bold text-[11px] rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 shadow-xs flex items-center gap-1">
                                  <Upload className="w-3.5 h-3.5" /> Upload
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0]
                                      if (file) handleSplitImageUpload(block.id, file)
                                    }}
                                  />
                                </label>
                              </div>

                              <div className="flex flex-col gap-2">
                                <Input
                                  value={block.heading}
                                  onChange={(e) => updateBlock(block.id, { heading: e.target.value } as Partial<SplitBlock>)}
                                  placeholder="Section heading..."
                                  className="h-9 text-sm font-bold bg-white/80 border-gray-200"
                                />
                                <Textarea
                                  value={block.text}
                                  onChange={(e) => updateBlock(block.id, { text: e.target.value } as Partial<SplitBlock>)}
                                  placeholder="Describe this feature, offering, or story beat..."
                                  rows={4}
                                  className="text-sm bg-white/80 border-gray-200 resize-none"
                                />
                              </div>
                            </div>
                          </div>
                        )
                      })()
                    )}

                    {/* Image block */}
                    {block.type === "image" && (
                      <div className="flex flex-col gap-2 p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
                        <div className="flex items-center justify-between gap-2">
                          <Input
                            type="text"
                            value={block.url}
                            onChange={(e) => updateBlock(block.id, { url: e.target.value } as Partial<ImageBlock>)}
                            placeholder="Image URL..."
                            className="h-8 text-xs bg-white border-gray-200"
                          />
                          <label className="px-3 py-1 bg-white text-gray-700 font-bold text-xs rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 shrink-0">
                            Browse...
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, block.id)} />
                          </label>
                        </div>
                        {block.url && (
                          <img src={block.url} alt="Block media" className="w-full max-h-80 object-cover rounded-lg border border-gray-200" />
                        )}
                        <input
                          type="text"
                          value={block.caption}
                          onChange={(e) => updateBlock(block.id, { caption: e.target.value } as Partial<ImageBlock>)}
                          placeholder="Image caption text..."
                          className="text-center text-xs text-gray-500 italic bg-transparent focus:outline-none border-b border-transparent focus:border-gray-200 py-1"
                        />
                      </div>
                    )}

                    {/* Video block */}
                    {block.type === "video" && (
                      <div className="flex flex-col gap-3 p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold text-slate-500">
                            <Video className="w-3.5 h-3.5 text-slate-600" />
                            <span>Video Player Block</span>
                          </div>
                          <label className="px-3 py-1 bg-white text-slate-700 font-bold text-xs rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 shrink-0 flex items-center gap-1.5 transition-colors">
                            <Upload className="w-3.5 h-3.5 text-[#FF7F50]" />
                            <span>Upload Video File (MP4/WebM)</span>
                            <input type="file" accept="video/*" className="hidden" onChange={(e) => handleVideoUpload(e, block.id)} />
                          </label>
                        </div>

                        <div className="flex items-center gap-2">
                          <Input
                            type="text"
                            value={block.url}
                            onChange={(e) => updateBlock(block.id, { url: e.target.value } as Partial<VideoBlock>)}
                            placeholder="Or paste video URL (YouTube embed, Vimeo, MP4 link)..."
                            className="h-8 text-xs bg-white border-slate-200"
                          />
                        </div>

                        {block.url && (
                          <div className="relative rounded-xl overflow-hidden bg-black border border-slate-200 max-h-96 flex items-center justify-center">
                            {block.url.includes("youtube.com") || block.url.includes("youtu.be") ? (
                              <iframe
                                src={block.url.replace("watch?v=", "embed/")}
                                title={block.caption || "Video player"}
                                className="w-full aspect-video rounded-xl"
                                allowFullScreen
                              />
                            ) : (
                              <video
                                src={block.url}
                                poster={block.posterUrl}
                                controls
                                className="w-full max-h-96 object-contain rounded-xl"
                              />
                            )}
                          </div>
                        )}

                        <input
                          type="text"
                          value={block.caption || ""}
                          onChange={(e) => updateBlock(block.id, { caption: e.target.value } as Partial<VideoBlock>)}
                          placeholder="Video caption text..."
                          className="text-center text-xs text-slate-500 italic bg-transparent focus:outline-none border-b border-transparent focus:border-slate-200 py-1"
                        />
                      </div>
                    )}

                    {/* Table block */}
                    {block.type === "table" && (
                      <div className="flex flex-col gap-3 p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold text-slate-500">
                            <TableIcon className="w-3.5 h-3.5 text-slate-600" />
                            <span>Interactive Data Table</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => addTableColumn(block.id)}
                              className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-[11px] font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1 cursor-pointer transition-colors">
                              <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
                              <span>Add Column</span>
                            </button>
                            <button type="button" onClick={() => addTableRow(block.id)}
                              className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-[11px] font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1 cursor-pointer transition-colors">
                              <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
                              <span>Add Row</span>
                            </button>
                          </div>
                        </div>

                        <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
                          <table className="w-full border-collapse text-xs text-left">
                            <thead>
                              <tr className="bg-gray-100 border-b border-gray-200 text-gray-700">
                                {block.headers.map((h, colIdx) => (
                                  <th key={colIdx} className="p-2 border-r border-gray-200 last:border-r-0">
                                    <div className="flex items-center justify-between gap-1">
                                      <input
                                        type="text"
                                        value={h}
                                        onChange={(e) => {
                                          const newHeaders = [...block.headers]
                                          newHeaders[colIdx] = e.target.value
                                          updateBlock(block.id, { headers: newHeaders } as Partial<TableBlock>)
                                        }}
                                        className="font-bold text-gray-900 bg-transparent focus:bg-white focus:outline-none w-full px-1 py-0.5 rounded"
                                      />
                                      {block.headers.length > 1 && (
                                        <button type="button" onClick={() => removeTableColumn(block.id, colIdx)}
                                          className="text-gray-400 hover:text-rose-600 p-0.5 cursor-pointer" title="Delete column">
                                          <MinusCircle className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  </th>
                                ))}
                                <th className="w-8 p-2 text-center bg-gray-100"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {block.rows.map((row, rowIdx) => (
                                <tr key={rowIdx} className="hover:bg-gray-50">
                                  {row.map((cell, colIdx) => (
                                    <td key={colIdx} className="p-2 border-r border-gray-200 last:border-r-0">
                                      <input
                                        type="text"
                                        value={cell}
                                        onChange={(e) => {
                                          const newRows = block.rows.map((r, rI) =>
                                            rI === rowIdx ? r.map((c, cI) => (cI === colIdx ? e.target.value : c)) : r
                                          )
                                          updateBlock(block.id, { rows: newRows } as Partial<TableBlock>)
                                        }}
                                        className="text-gray-700 bg-transparent focus:bg-white focus:outline-none w-full px-1 py-0.5 rounded"
                                      />
                                    </td>
                                  ))}
                                  <td className="p-2 text-center">
                                    <button type="button" onClick={() => removeTableRow(block.id, rowIdx)}
                                      className="text-gray-400 hover:text-rose-600 p-0.5 cursor-pointer" title="Delete row">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Callout */}
                    {block.type === "callout" && (
                      <div className="p-4 bg-slate-50 border-l-4 border-[#FF7F50] rounded-r-xl flex items-start gap-3">
                        <Quote className="w-5 h-5 text-[#FF7F50] shrink-0 mt-0.5" />
                        <Textarea
                          value={block.text}
                          onChange={(e) => updateBlock(block.id, { text: e.target.value } as Partial<CalloutBlock>)}
                          placeholder="Write a highlight quote or key insight callout..."
                          rows={2}
                          className="w-full border-none focus-visible:ring-0 p-0 text-sm font-semibold text-gray-900 bg-transparent resize-none"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Bottom Inserter Toolbar — Medium-style */}
              <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add block</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { type: "paragraph" as BlockType, icon: <AlignLeft className="w-3.5 h-3.5" />, label: "Text" },
                    { type: "heading" as BlockType, icon: <Heading className="w-3.5 h-3.5" />, label: "Heading" },
                    { type: "metrics" as BlockType, icon: <BarChart3 className="w-3.5 h-3.5" />, label: "Stats" },
                    { type: "badge" as BlockType, icon: <Tag className="w-3.5 h-3.5" />, label: "Tags" },
                    { type: "list" as BlockType, icon: <Check className="w-3.5 h-3.5" />, label: "Checklist" },
                    { type: "table" as BlockType, icon: <TableIcon className="w-3.5 h-3.5" />, label: "Table" },
                    { type: "grid" as BlockType, icon: <LayoutGrid className="w-3.5 h-3.5" />, label: "Grid" },
                    { type: "split" as BlockType, icon: <Columns2 className="w-3.5 h-3.5" />, label: "Split" },
                    { type: "image" as BlockType, icon: <ImageIcon className="w-3.5 h-3.5" />, label: "Image" },
                    { type: "video" as BlockType, icon: <Video className="w-3.5 h-3.5" />, label: "Video" },
                    { type: "callout" as BlockType, icon: <Quote className="w-3.5 h-3.5" />, label: "Callout" },
                    { type: "divider" as BlockType, icon: <Minus className="w-3.5 h-3.5" />, label: "Divider" },
                  ].map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => addBlock(item.type)}
                      className="px-2.5 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-[11px] font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1.5 transition-all cursor-pointer hover:border-gray-300 hover:shadow-xs"
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT SIDEBAR COLUMN */}
            <div className="lg:col-span-4 flex flex-col gap-6 sticky top-6 self-start">
              <div className="bg-white/90 p-6 rounded-3xl border border-[#E8E1D6] shadow-sm flex flex-col gap-5 text-[#161C2D]">
                <div className="flex items-center gap-2 border-b border-[#E8E1D6] pb-3 font-serif font-bold text-[#161C2D] text-base">
                  <Sliders className="w-4 h-4 text-[#FF7A00]" />
                  <span>Project Metadata</span>
                </div>

                <div className="flex flex-col gap-4 text-xs">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono font-bold text-[#9A9284] uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-[#FF7A00]" /> Department
                    </label>
                    <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Engineering" className="h-9 text-xs font-sans bg-[#FDF8F1] border-[#E8E1D6] text-[#161C2D]" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono font-bold text-[#9A9284] uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-[#FF7A00]" /> Project Lead
                    </label>
                        <div className="flex flex-col gap-1.5">
                          <label className="font-mono font-bold text-[#9A9284] uppercase tracking-wider text-[10px]">Status</label>
                          <select value={status} onChange={(e) => setStatus(e.target.value as ProjectRecord["status"])}
                            className="h-9 px-2 text-xs font-sans font-bold bg-[#FDF8F1] border border-[#E8E1D6] rounded-lg w-full outline-none text-[#161C2D]">
                            <option value="Draft">Draft</option>
                            <option value="Published">Published</option>
                          </select>
                        </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-mono font-bold text-[#9A9284] uppercase tracking-wider text-[10px]">Headcount</label>
                      <Input type="number" min={1} value={openPositions} onChange={(e) => setOpenPositions(Number(e.target.value))}
                        className="h-9 text-xs bg-[#FDF8F1] border-[#E8E1D6] text-center font-mono font-bold text-[#161C2D]" />
                    </div>
                  </div>
                </div>
              </div>

              {copiedBlock && (
                <div className="bg-white p-4 rounded-2xl border border-[#E8E1D6] shadow-2xs flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-[#5B6472]">Block copied to clipboard</span>
                  <button type="button" onClick={() => handlePasteBlock()}
                    className="text-xs text-[#161C2D] hover:text-[#FF7A00] font-mono font-bold flex items-center gap-1.5 px-3 py-1.5 bg-[#FDF8F1] hover:bg-white border border-[#E8E1D6] rounded-lg cursor-pointer transition-colors">
                    <Clipboard className="w-3.5 h-3.5 text-[#FF7A00]" />
                    Paste block
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ================= EDITORIAL READING VIEW (PREVIEW) ================= */
          <div className="w-full text-[#161C2D] max-w-4xl mx-auto flex flex-col gap-8 font-sans py-4">
            {/* Header Section */}
            <header className="flex flex-col gap-5 border-b border-[#E8E1D6] pb-8">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative pl-4 inline-flex items-center">
                  <span className="font-mono text-[12px] font-bold tracking-[2.5px] text-[#FF7A00] uppercase">
                    {department || "ENGINEERING"}
                  </span>
                  <span className="absolute left-0 top-1/2 h-3.5 w-1 -translate-y-1/2 bg-[#FF7A00]" />
                </div>
                <span className="font-mono text-[11px] text-[#9A9284]">
                  PREVIEW MODE • {status || "Draft"}
                </span>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl font-bold leading-[1.15] tracking-tight text-[#161C2D]">
                {name || "Untitled Project"}
              </h1>

              {summary && (
                <p className="font-sans text-base sm:text-lg text-[#5B6472] leading-relaxed italic border-l-2 border-[#FF7A00] pl-4">
                  {summary}
                </p>
              )}

              {/* Metadata Hairline Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-b border-[#E8E1D6] divide-x divide-[#E8E1D6] mt-4">
                <div className="py-3 px-4 first:pl-0">
                  <div className="font-mono text-[10px] font-bold tracking-wider uppercase text-[#9A9284] mb-0.5">
                    Department
                  </div>
                  <div className="font-sans text-xs font-semibold text-[#161C2D] truncate">
                    {department || "Engineering"}
                  </div>
                </div>
                <div className="py-3 px-4">
                  <div className="font-mono text-[10px] font-bold tracking-wider uppercase text-[#9A9284] mb-0.5">
                    Project Lead
                  </div>
                  <div className="font-sans text-xs font-semibold text-[#FF7A00] truncate">
                    {postedBy || "Recruiter"}
                  </div>
                </div>
                <div className="py-3 px-4">
                  <div className="font-mono text-[10px] font-bold tracking-wider uppercase text-[#9A9284] mb-0.5">
                    Headcount
                  </div>
                  <div className="font-sans text-xs font-semibold text-[#161C2D]">
                    {openPositions} Position{openPositions > 1 ? "s" : ""}
                  </div>
                </div>
                <div className="py-3 px-4">
                  <div className="font-mono text-[10px] font-bold tracking-wider uppercase text-[#9A9284] mb-0.5">
                    Status
                  </div>
                  <div className="font-sans text-xs font-semibold text-[#161C2D]">
                    {status}
                  </div>
                </div>
              </div>
            </header>

            {coverImage && (
              <figure className="border border-[#E8E1D6] bg-white p-2">
                <img src={coverImage} alt={name} className="w-full max-h-[420px] object-cover" />
              </figure>
            )}

            <div className="flex flex-col gap-6 text-[#3A4150] leading-relaxed font-sans text-base">
              {blocks.map((block) => {
                if (block.type === "paragraph") {
                  return (
                    <p key={block.id} className={`text-[15px] leading-relaxed ${block.bold ? "font-bold text-[#161C2D]" : "font-normal"} ${block.italic ? "italic text-[#3A4150]" : ""} ${block.fontFamily === "serif" ? "font-serif text-base" : block.fontFamily === "mono" ? "font-mono text-xs" : "font-sans"} ${block.align === "center" ? "text-center" : block.align === "right" ? "text-right" : "text-left"}`}>
                      {renderFormattedContent(block.text)}
                    </p>
                  )
                }

                if (block.type === "heading") {
                  return block.level === 2 ? (
                    <h2 key={block.id} className={`font-serif text-2xl font-bold text-[#161C2D] pt-4 border-b border-[#E8E1D6] pb-2 ${block.align === "center" ? "text-center" : block.align === "right" ? "text-right" : "text-left"}`}>
                      {renderFormattedContent(block.text)}
                    </h2>
                  ) : (
                    <h3 key={block.id} className={`font-serif text-xl font-bold text-[#161C2D] pt-2 ${block.align === "center" ? "text-center" : block.align === "right" ? "text-right" : "text-left"}`}>
                      {renderFormattedContent(block.text)}
                    </h3>
                  )
                }

                if (block.type === "metrics") {
                  return (
                    <div key={block.id} className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E8E1D6] border-y border-[#E8E1D6] my-4 py-4">
                      {block.items.map((stat, sIdx) => (
                        <div key={sIdx} className="py-3 sm:px-6 first:pl-0 flex flex-col gap-1">
                          <span className="font-mono text-3xl font-bold text-[#FF7A00] tracking-tight">
                            {stat.value}
                          </span>
                          <span className="font-mono text-[11px] text-[#9A9284] uppercase tracking-wider font-bold">
                            {stat.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                }

                if (block.type === "badge") {
                  return (
                    <div key={block.id} className="flex flex-col gap-2 my-3">
                      {block.categoryTitle && (
                        <span className="font-mono text-[11px] font-bold text-[#9A9284] uppercase tracking-wider">
                          {block.categoryTitle}
                        </span>
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        {block.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="px-3 py-1 border border-[#E8E1D6] text-[#161C2D] font-mono text-xs font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                }

                if (block.type === "list") {
                  const style = block.bulletStyle || "check"
                  return (
                    <ul key={block.id} className="space-y-3 my-2">
                      {block.items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3 font-sans text-sm text-[#3A4150]">
                          {style === "check" ? (
                            <Check className="w-4 h-4 text-[#FF7A00] shrink-0 font-bold mt-0.5 stroke-[2.5]" />
                          ) : style === "arrow" ? (
                            <ArrowRight className="w-4 h-4 text-[#FF7A00] shrink-0 mt-0.5 stroke-[2.5]" />
                          ) : style === "number" ? (
                            <span className="text-xs font-bold font-mono text-[#9A9284] w-5 text-right shrink-0 mt-0.5">{idx + 1}.</span>
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-[#FF7A00] shrink-0 mt-2" />
                          )}
                          <div className="leading-relaxed font-medium">{renderFormattedContent(item)}</div>
                        </li>
                      ))}
                    </ul>
                  )
                }

                if (block.type === "divider") {
                  return <hr key={block.id} className="my-4 border-t border-[#E8E1D6]" />
                }

                if (block.type === "grid") {
                  return (
                    <div key={block.id} className="grid grid-cols-1 md:grid-cols-2 gap-6 my-2">
                      {block.columns.map((col, idx) => (
                        <div key={idx} className="flex flex-col gap-2">
                          {col.imageUrl && <img src={col.imageUrl} alt={col.title} className="w-full h-40 object-cover border border-[#E8E1D6] mb-1" />}
                          <h4 className="font-serif font-bold text-[#161C2D] text-base">{col.title}</h4>
                          <div className="font-sans text-xs text-[#5B6472] leading-relaxed">{renderFormattedContent(col.text)}</div>
                        </div>
                      ))}
                    </div>
                  )
                }

                if (block.type === "split") {
                  return (
                    <div key={block.id} className="my-2">
                      <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 items-center ${block.imagePosition === "right" ? "md:[&>*:first-child]:order-2" : ""}`}>
                        {block.imageUrl && <img src={block.imageUrl} alt={block.heading} className="w-full h-56 object-cover border border-[#E8E1D6]" />}
                        <div className="flex flex-col justify-center gap-2">
                          <h3 className="font-serif text-lg font-bold text-[#161C2D]">{block.heading}</h3>
                          <div className="font-sans text-xs text-[#5B6472] leading-relaxed">{renderFormattedContent(block.text)}</div>
                        </div>
                      </div>
                    </div>
                  )
                }

                if (block.type === "image") {
                  return (
                    <figure key={block.id} className="flex flex-col gap-2 my-2 border border-[#E8E1D6] p-2">
                      <img src={block.url} alt={block.caption || "Article figure"} className="w-full max-h-[400px] object-cover" />
                      {block.caption && <figcaption className="text-center text-xs text-[#9A9284] font-mono mt-1">{block.caption}</figcaption>}
                    </figure>
                  )
                }

                if (block.type === "video") {
                  return (
                    <figure key={block.id} className="flex flex-col gap-2 my-2 border border-[#E8E1D6] bg-black p-1">
                      {block.url && (block.url.includes("youtube.com") || block.url.includes("youtu.be")) ? (
                        <iframe
                          src={block.url.replace("watch?v=", "embed/")}
                          title={block.caption || "Video player"}
                          className="w-full aspect-video"
                          allowFullScreen
                        />
                      ) : (
                        <video
                          src={block.url}
                          poster={block.posterUrl}
                          controls
                          className="w-full max-h-[450px] object-contain"
                        />
                      )}
                      {block.caption && <figcaption className="text-center text-xs text-white font-mono p-2">{block.caption}</figcaption>}
                    </figure>
                  )
                }

                if (block.type === "table") {
                  return (
                    <div key={block.id} className="my-4 border border-[#E8E1D6]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#F7F2EA] text-[#161C2D] font-bold border-b border-[#E8E1D6]">
                            {block.headers.map((h, i) => <th key={i} className="p-3 font-mono">{h}</th>)}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E8E1D6]">
                          {block.rows.map((row, rI) => (
                            <tr key={rI} className="odd:bg-[#FAF8F1]">
                              {row.map((cell, cI) => <td key={cI} className="p-3 text-[#3A4150]">{renderFormattedContent(cell)}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                }

                if (block.type === "callout") {
                  return (
                    <blockquote key={block.id} className="p-5 my-3 border-l-4 border-[#FF7A00] border-y border-r border-[#E8E1D6] font-serif text-base italic text-[#161C2D]">
                      "{renderFormattedContent(block.text)}"
                    </blockquote>
                  )
                }

                return null
              })}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}