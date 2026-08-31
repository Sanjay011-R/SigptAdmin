import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { MainLayout } from "@/layouts/main-layout"
import { useAuditLogger } from "@/hooks/use-audit-logger"
import {
  getProjectById,
  type ProjectRecord,
  type ContentBlock,
  type CardStyle,
  type CardColor,
} from "@/services/project-storage-service"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  ArrowUpRight,
  Pencil,
  Check,
  Share2,
  Printer,
  Calendar,
  Building,
  User,
  FolderKanban,
  Mail,
} from "lucide-react"

/* Helper to render inline **bold** and *italic* formatting */
function renderFormattedContent(text: string) {
  if (!text) return null
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g)
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index} className="font-bold text-[#161C2D]">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={index} className="italic text-[#3A4150]">{part.slice(1, -1)}</em>
    }
    return part
  })
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { logPageView } = useAuditLogger()
  const [project, setProject] = useState<ProjectRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
    logPageView("View Project Details")
    if (id) {
      getProjectById(id).then((res) => {
        if (res) setProject(res)
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [id, logPageView])

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: project?.name || "Project Details",
        url: window.location.href,
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  if (loading) {
    return (
      <MainLayout pageTitle="Loading Project Details...">
        <div className="w-full min-h-[60vh] flex flex-col items-center justify-center text-center py-20 px-6 bg-[#FDF8F1] text-[#161C2D]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7A00] mb-3" />
          <span className="font-mono text-xs font-bold text-[#9A9284] uppercase tracking-wider">
            Loading publication report...
          </span>
        </div>
      </MainLayout>
    )
  }

  if (!project) {
    return (
      <MainLayout pageTitle="Project Not Found">
        <div className="w-full min-h-[60vh] flex flex-col items-center justify-center text-center py-24 px-6 bg-[#FDF8F1] text-[#161C2D]">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold mb-3 text-[#161C2D]">
            Recruitment Project Not Found
          </h1>
          <p className="font-sans text-sm text-[#5B6472] mb-8 max-w-sm">
            This project record may have been updated or moved.
          </p>
          <button
            onClick={() => navigate("/projects")}
            className="inline-flex items-center gap-2 px-5 h-10 bg-[#161C2D] hover:bg-[#FF7A00] text-white font-mono text-xs font-bold tracking-wider uppercase transition-colors duration-300 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to recruitment projects
          </button>
        </div>
      </MainLayout>
    )
  }

  // Extract stats blocks if present
  const metricsBlocks = (project.blocks || []).filter((b) => b.type === "metrics")
  const badgeBlocks = (project.blocks || []).filter((b) => b.type === "badge")

  return (
    <MainLayout pageTitle={`Project: ${project.name}`}>
      <div className="w-full min-h-screen bg-[#FDF8F1] text-[#161C2D] pt-6 pb-24 font-sans">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">

          {/* ================= TOP NAVIGATION BAR ================= */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-10 border-b border-[#E8E1D6] pb-4 print:hidden">
            <button
              onClick={() => navigate("/projects")}
              className="group inline-flex items-center gap-2 text-xs font-mono font-bold tracking-wider text-[#9A9284] hover:text-[#FF7A00] transition-colors cursor-pointer uppercase"
            >
              <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
              BACK TO PROJECTS
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-[#5B6472] hover:text-[#FF7A00] transition-colors cursor-pointer"
              >
                {copied ? (
                  <span className="text-[#161C2D] font-bold">Link copied</span>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </>
                )}
              </button>

              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-[#5B6472] hover:text-[#FF7A00] transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              <button
                onClick={() => navigate(`/projects/edit/${project.id}`)}
                className="inline-flex items-center gap-2 px-4 h-9 bg-[#161C2D] hover:bg-[#FF7A00] text-white font-mono text-xs font-bold tracking-wider uppercase transition-colors duration-300 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Project</span>
              </button>
            </div>
          </div>

          {/* ================= HEADER SECTION ================= */}
          <header className="mb-12">
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <div className="relative pl-4 inline-flex items-center">
                <span className="font-mono text-[12px] font-bold tracking-[2.5px] text-[#FF7A00] uppercase">
                  {project.department || "ENGINEERING"}
                </span>
                <span className="absolute left-0 top-1/2 h-3.5 w-1 -translate-y-1/2 bg-[#FF7A00]" />
              </div>
              <span className="font-mono text-[11px] text-[#9A9284]">
                PROJECT RECORD #{project.id}
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-[44px] font-bold leading-[1.15] tracking-tight max-w-3xl mb-5 text-[#161C2D]">
              {project.name}
            </h1>

            {project.summary && (
              <p className="font-sans text-base sm:text-lg text-[#5B6472] max-w-2xl leading-relaxed mb-10 italic border-l-2 border-[#FF7A00] pl-4">
                {project.summary}
              </p>
            )}

            {/* Metadata — plain hairline-divided row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-b border-[#E8E1D6] divide-x divide-[#E8E1D6]">
              <div className="py-4 px-4 sm:px-6 first:pl-0">
                <div className="font-mono text-[10px] font-bold tracking-wider uppercase text-[#9A9284] mb-1">
                  Department
                </div>
                <div className="font-sans text-sm font-semibold text-[#161C2D] truncate">
                  {project.department || "Engineering"}
                </div>
              </div>
              <div className="py-4 px-4 sm:px-6">
                <div className="font-mono text-[10px] font-bold tracking-wider uppercase text-[#9A9284] mb-1">
                  Project Lead
                </div>
                <div className="font-sans text-sm font-semibold text-[#FF7A00] truncate">
                  {project.postedBy || "Recruiter"}
                </div>
              </div>
              <div className="py-4 px-4 sm:px-6">
                <div className="font-mono text-[10px] font-bold tracking-wider uppercase text-[#9A9284] mb-1">
                  Headcount / Openings
                </div>
                <div className="font-sans text-sm font-semibold text-[#161C2D]">
                  {project.openPositions} Position{project.openPositions > 1 ? "s" : ""}
                </div>
              </div>
              <div className="py-4 px-4 sm:px-6">
                <div className="font-mono text-[10px] font-bold tracking-wider uppercase text-[#9A9284] mb-1">
                  Status
                </div>
                <div className="font-sans text-sm font-semibold text-[#161C2D]">
                  {project.status}
                </div>
              </div>
            </div>

            {/* Display Stats Row if Metrics block exists */}
            {metricsBlocks.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E8E1D6] mt-2 border-b border-[#E8E1D6] pb-6">
                {metricsBlocks[0].items.map((st, i) => (
                  <div key={i} className="py-6 sm:px-6 first:pl-0">
                    <div className="font-mono text-3xl sm:text-4xl font-bold text-[#FF7A00] tracking-tight mb-1">
                      {st.value}
                    </div>
                    <div className="font-mono text-[11px] text-[#9A9284] uppercase tracking-wider font-bold">
                      {st.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </header>

          {/* Hero Inline Photograph (if coverImage exists) */}
          {project.coverImage && (
            <figure className="mb-12 border border-[#E8E1D6] bg-white p-2">
              <img
                src={project.coverImage}
                alt={project.name}
                className="w-full max-h-[440px] object-cover"
              />
            </figure>
          )}

          {/* ================= MAIN CONTENT GRID ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">

            {/* LEFT — Report Content */}
            <div className="lg:col-span-8 space-y-10 text-[#3A4150] leading-relaxed">
              {project.blocks && project.blocks.length > 0 ? (
                project.blocks.map((block) => {
                  /* PARAGRAPH BLOCK */
                  if (block.type === "paragraph") {
                    return (
                      <p
                        key={block.id}
                        className={`font-sans text-[15px] leading-relaxed ${
                          block.bold ? "font-bold text-[#161C2D]" : "font-normal"
                        } ${block.italic ? "italic" : ""} ${
                          block.fontFamily === "serif"
                            ? "font-serif text-base"
                            : block.fontFamily === "mono"
                            ? "font-mono text-xs"
                            : "font-sans"
                        } ${
                          block.align === "center"
                            ? "text-center"
                            : block.align === "right"
                            ? "text-right"
                            : "text-left"
                        }`}
                      >
                        {renderFormattedContent(block.text)}
                      </p>
                    )
                  }

                  /* HEADING BLOCK */
                  if (block.type === "heading") {
                    return block.level === 2 ? (
                      <h2
                        key={block.id}
                        className={`font-serif text-2xl sm:text-3xl font-bold text-[#161C2D] pt-4 border-b border-[#E8E1D6] pb-2 ${
                          block.align === "center" ? "text-center" : block.align === "right" ? "text-right" : "text-left"
                        }`}
                      >
                        {renderFormattedContent(block.text)}
                      </h2>
                    ) : (
                      <h3
                        key={block.id}
                        className={`font-serif text-xl font-bold text-[#161C2D] pt-2 ${
                          block.align === "center" ? "text-center" : block.align === "right" ? "text-right" : "text-left"
                        }`}
                      >
                        {renderFormattedContent(block.text)}
                      </h3>
                    )
                  }

                  /* BULLET & CHECKLIST BLOCK */
                  if (block.type === "list") {
                    return (
                      <section key={block.id} className="pt-2">
                        <ul className="space-y-3">
                          {block.items.map((item, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-3 font-sans text-sm text-[#3A4150] leading-relaxed"
                            >
                              <Check className="w-4 h-4 text-[#FF7A00] shrink-0 mt-0.5 stroke-[2.5]" />
                              <span>{renderFormattedContent(item)}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )
                  }

                  /* GRID CARDS BLOCK */
                  if (block.type === "grid") {
                    return (
                      <div key={block.id} className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-4">
                        {block.columns.map((col, idx) => (
                          <div key={idx} className="flex flex-col gap-2">
                            {col.imageUrl && <img src={col.imageUrl} alt={col.title} className="w-full h-40 object-cover border border-[#E8E1D6] mb-1" />}
                            <h4 className="font-serif font-bold text-[#161C2D] text-base">{col.title}</h4>
                            <p className="font-sans text-xs text-[#5B6472] leading-relaxed">{renderFormattedContent(col.text)}</p>
                          </div>
                        ))}
                      </div>
                    )
                  }

                  /* SPLIT SECTION BLOCK */
                  if (block.type === "split") {
                    return (
                      <div key={block.id} className="my-4">
                        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 items-center ${block.imagePosition === "right" ? "sm:[&>*:first-child]:order-2" : ""}`}>
                          {block.imageUrl && <img src={block.imageUrl} alt={block.heading} className="w-full h-56 object-cover border border-[#E8E1D6]" />}
                          <div className="flex flex-col justify-center gap-2">
                            <h3 className="font-serif text-lg font-bold text-[#161C2D]">{block.heading}</h3>
                            <p className="font-sans text-xs text-[#5B6472] leading-relaxed">{renderFormattedContent(block.text)}</p>
                          </div>
                        </div>
                      </div>
                    )
                  }

                  /* IMAGE BLOCK */
                  if (block.type === "image") {
                    return (
                      <figure key={block.id} className="my-4 border border-[#E8E1D6] p-2">
                        <img src={block.url} alt={block.caption || "Figure"} className="w-full max-h-[400px] object-cover" />
                        {block.caption && <figcaption className="text-center text-xs text-[#9A9284] font-mono mt-2">{block.caption}</figcaption>}
                      </figure>
                    )
                  }

                  /* VIDEO BLOCK */
                  if (block.type === "video") {
                    return (
                      <figure key={block.id} className="my-4 border border-[#E8E1D6] bg-black p-1">
                        {block.url && (block.url.includes("youtube.com") || block.url.includes("youtu.be")) ? (
                          <iframe
                            src={block.url.replace("watch?v=", "embed/")}
                            title={block.caption || "Video player"}
                            className="w-full aspect-video"
                            allowFullScreen
                          />
                        ) : (
                          <video src={block.url} poster={block.posterUrl} controls className="w-full max-h-[450px] object-contain" />
                        )}
                        {block.caption && <figcaption className="text-center text-xs text-white font-mono p-2">{block.caption}</figcaption>}
                      </figure>
                    )
                  }

                  /* TABLE BLOCK */
                  if (block.type === "table") {
                    return (
                      <div key={block.id} className="my-4 border border-[#E8E1D6]">
                        <table className="w-full text-left text-xs border-collapse font-sans">
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

                  /* CALLOUT QUOTE BLOCK */
                  if (block.type === "callout") {
                    return (
                      <blockquote key={block.id} className="my-4 p-5 border-l-4 border-[#FF7A00] border-y border-r border-[#E8E1D6] font-serif text-base italic text-[#161C2D]">
                        "{renderFormattedContent(block.text)}"
                      </blockquote>
                    )
                  }

                  /* BADGE TAGS BLOCK */
                  if (block.type === "badge") {
                    return (
                      <div key={block.id} className="my-4 pt-4 border-t border-[#E8E1D6]">
                        {block.categoryTitle && (
                          <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#9A9284] mb-3">
                            {block.categoryTitle}
                          </h3>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {block.tags.map((tool, i) => (
                            <span key={i} className="px-3 py-1 border border-[#E8E1D6] text-[#161C2D] font-mono text-xs font-medium">
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  }

                  return null
                })
              ) : (
                <p className="font-sans text-sm text-[#9A9284] italic">No content blocks found for this project.</p>
              )}
            </div>

            {/* RIGHT — Sidebar CTA Card */}
            <aside className="lg:col-span-4 lg:sticky lg:top-10 space-y-6">
              <div className="border border-[#E8E1D6] bg-white/80 p-7 shadow-2xs">
                <h3 className="font-serif text-xl font-bold text-[#161C2D] mb-2">
                  Need recruitment details?
                </h3>
                <p className="font-sans text-sm text-[#5B6472] leading-relaxed mb-7">
                  Contact the lead recruiter for applicant status, candidate screening, or team allocations.
                </p>

                <button
                  onClick={() => navigate(`/projects/edit/${project.id}`)}
                  className="w-full bg-[#161C2D] hover:bg-[#FF7A00] text-white font-mono text-xs font-bold tracking-wider uppercase transition-colors duration-300 flex items-center justify-between px-5 h-12 cursor-pointer border-none"
                >
                  <span>Edit project details</span>
                  <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                </button>

                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-[#E8E1D6]" />
                  <span className="font-mono text-[10px] text-[#9A9284] font-bold uppercase">
                    or
                  </span>
                  <div className="flex-1 h-px bg-[#E8E1D6]" />
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-[#FF7A00] shrink-0" />
                  <span className="font-mono text-[#161C2D] font-semibold truncate">
                    recruitment@si-gpt.com
                  </span>
                </div>
              </div>
            </aside>
          </div>

        </div>
      </div>
    </MainLayout>
  )
}
