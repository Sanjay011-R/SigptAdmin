import { supabase } from "@/lib/supabase"

export type BlockType =
  | "paragraph"
  | "heading"
  | "image"
  | "video"
  | "table"
  | "callout"
  | "list"
  | "divider"
  | "grid"
  | "split"
  | "metrics"
  | "badge"

export type CardStyle = "minimal" | "outlined" | "filled" | "elevated"

export type CardColor =
  | "white"
  | "slate"
  | "orange"
  | "indigo"
  | "emerald"
  | "rose"
  | "amber"
  | "sky"
  | "violet"
  | "custom"

export interface BaseBlock {
  id: string
  type: BlockType
}

export interface ParagraphBlock extends BaseBlock {
  type: "paragraph"
  text: string
  bold?: boolean
  italic?: boolean
  fontFamily?: "sans" | "serif" | "mono"
  align?: "left" | "center" | "right"
}

export interface HeadingBlock extends BaseBlock {
  type: "heading"
  level: 2 | 3
  text: string
  bold?: boolean
  italic?: boolean
  fontFamily?: "sans" | "serif" | "mono"
  align?: "left" | "center" | "right"
}

export interface ImageBlock extends BaseBlock {
  type: "image"
  url: string
  caption: string
}

export interface VideoBlock extends BaseBlock {
  type: "video"
  url: string
  caption?: string
  posterUrl?: string
  autoplay?: boolean
}

export interface TableBlock extends BaseBlock {
  type: "table"
  headers: string[]
  rows: string[][]
}

export interface CalloutBlock extends BaseBlock {
  type: "callout"
  text: string
  tone?: "info" | "success" | "warning"
}

export type BulletStyle = "check" | "dot" | "arrow" | "number"

export interface ListBlock extends BaseBlock {
  type: "list"
  ordered?: boolean
  bulletStyle?: BulletStyle
  items: string[]
}

export interface DividerBlock extends BaseBlock {
  type: "divider"
}

export interface GridColumn {
  title: string
  text: string
  imageUrl?: string
  color?: CardColor
  customColor?: string
  style?: CardStyle
}

export interface GridBlock extends BaseBlock {
  type: "grid"
  columns: GridColumn[]
}

export interface SplitBlock extends BaseBlock {
  type: "split"
  imageUrl: string
  imagePosition: "left" | "right"
  heading: string
  text: string
  color?: CardColor
  customColor?: string
  style?: CardStyle
}

export interface MetricItem {
  value: string
  label: string
}

export interface MetricsBlock extends BaseBlock {
  type: "metrics"
  items: MetricItem[]
}

export interface BadgeBlock extends BaseBlock {
  type: "badge"
  categoryTitle?: string
  tags: string[]
}

export type ContentBlock =
  | ParagraphBlock
  | HeadingBlock
  | ImageBlock
  | VideoBlock
  | TableBlock
  | CalloutBlock
  | ListBlock
  | DividerBlock
  | GridBlock
  | SplitBlock
  | MetricsBlock
  | BadgeBlock

export interface ProjectRecord {
  id: string
  name: string
  department: string
  postedBy: string
  postedDate: string
  status: "Draft" | "Published"
  openPositions: number
  candidatesCount: number
  deadline?: string
  coverImage?: string
  summary?: string
  blocks: ContentBlock[]
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = "sigpt_projects_db_v1"

const DEFAULT_PROJECTS: ProjectRecord[] = [
  {
    id: "PRJ-01",
    name: "Q4 Tech Hiring Drive",
    department: "Engineering",
    postedBy: "Sarah Jenkins",
    postedDate: "Oct 15, 2026",
    status: "Published",
    openPositions: 8,
    candidatesCount: 42,
    deadline: "Nov 30, 2026",
    coverImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
    summary: "Comprehensive hiring campaign across Physical Design, Verification, and Embedded Firmware engineering streams.",
    createdAt: "2026-10-15T09:00:00.000Z",
    updatedAt: "2026-10-15T09:00:00.000Z",
    blocks: [
      {
        id: "b-1",
        type: "paragraph",
        text: "We are expanding our silicon engineering core team to accelerate next-generation SoC deliverables. This initiative spans senior technical leads, verification architects, and physical implementation specialists.",
      },
      {
        id: "b-2",
        type: "heading",
        level: 2,
        text: "Target Openings & Budget Matrix",
      },
      {
        id: "b-3",
        type: "table",
        headers: ["Role Specialty", "Headcount", "Experience Tier", "Target Deadline"],
        rows: [
          ["Physical Design Lead", "2", "8-12 Years", "Nov 15, 2026"],
          ["DV Lead Architect", "3", "7-10 Years", "Nov 20, 2026"],
          ["Embedded Firmware Engineer", "3", "4-7 Years", "Nov 30, 2026"],
        ],
      },
      {
        id: "b-4",
        type: "callout",
        tone: "info",
        text: "Key Requirement: Candidates must have proven tapeout experience with 5nm / 3nm advanced technology nodes.",
      },
      {
        id: "b-5",
        type: "image",
        url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1000&q=80",
        caption: "Engineering team alignment session for Q4 recruitment pipeline.",
      },
    ],
  },
  {
    id: "PRJ-02",
    name: "Campus Recruitment 2026",
    department: "University Relations",
    postedBy: "Michael Ross",
    postedDate: "Sep 01, 2026",
    status: "Published",
    openPositions: 15,
    candidatesCount: 120,
    deadline: "Dec 15, 2026",
    coverImage: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
    summary: "Annual tier-1 university intake program for graduate VLSI and Embedded Systems engineering candidates.",
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-01T10:00:00.000Z",
    blocks: [
      {
        id: "b-1",
        type: "paragraph",
        text: "Partnering with top technical universities to recruit entry-level design & verification engineers for our semiconductor operations.",
      },
      {
        id: "b-2",
        type: "heading",
        level: 2,
        text: "Campus Drive Schedule",
      },
      {
        id: "b-3",
        type: "table",
        headers: ["University", "Date", "Expected Intake"],
        rows: [
          ["IISc Bangalore", "Nov 05, 2026", "5 Engineers"],
          ["IIT Madras", "Nov 12, 2026", "6 Engineers"],
          ["IIT Kharagpur", "Nov 18, 2026", "4 Engineers"],
        ],
      },
    ],
  },
  {
    id: "PRJ-03",
    name: "Executive Leadership Search",
    department: "Human Resources",
    postedBy: "David Miller",
    postedDate: "Aug 20, 2026",
    status: "Published",
    openPositions: 2,
    candidatesCount: 11,
    deadline: "Oct 20, 2026",
    coverImage: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80",
    summary: "Retained executive search for Vice President of ASIC Engineering and Director of Product Operations.",
    createdAt: "2026-08-20T11:00:00.000Z",
    updatedAt: "2026-08-20T11:00:00.000Z",
    blocks: [
      {
        id: "b-1",
        type: "paragraph",
        text: "Targeting seasoned executive leaders with 15+ years managing multi-site semiconductor engineering organizations.",
      },
    ],
  },
  {
    id: "PRJ-04",
    name: "Design Team Expansion",
    department: "Product Design",
    postedBy: "Elena Rostova",
    postedDate: "Aug 10, 2026",
    status: "Draft",
    openPositions: 4,
    candidatesCount: 29,
    deadline: "Sep 30, 2026",
    coverImage: "https://images.unsplash.com/photo-1542744094-3a3172720177?auto=format&fit=crop&w=1200&q=80",
    summary: "Building out UI/UX and product design team for SI-GPT developer workspace tools.",
    createdAt: "2026-08-10T12:00:00.000Z",
    updatedAt: "2026-08-10T12:00:00.000Z",
    blocks: [
      {
        id: "b-1",
        type: "paragraph",
        text: "Recruiting UI/UX leads to refine our web platform visual design system and component architecture.",
      },
    ],
  },
]

let projectsCache: ProjectRecord[] = []

/**
 * Helper to map Supabase database row to frontend ProjectRecord
 */
function mapRowToProject(row: any): ProjectRecord {
  const rawSt = String(row.status || "").toLowerCase().trim()
  const status: "Draft" | "Published" =
    rawSt === "draft" || rawSt === "planning" ? "Draft" : "Published"

  return {
    id: row.id,
    name: row.project_name || row.name || "Untitled Project",
    department: row.department || "Engineering",
    postedBy: row.posted_by || row.postedBy || "Recruiter",
    postedDate: row.posted_date || row.postedDate || new Date().toISOString().split("T")[0],
    status,
    openPositions: Number(row.open_positions ?? row.openPositions ?? 1),
    candidatesCount: Number(row.candidates_count ?? row.candidatesCount ?? 0),
    deadline: row.deadline || "",
    coverImage: row.cover_image_url || row.coverImage || "",
    summary: row.summary || "",
    blocks: Array.isArray(row.blocks) ? row.blocks : typeof row.blocks === "string" ? JSON.parse(row.blocks) : [],
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  }
}

/**
 * Fetches all recruitment projects directly from Supabase Cloud Database (`projects` table)
 */
export async function fetchProjects(): Promise<ProjectRecord[]> {
  try {
    let response = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false })

    if (response.error) {
      // Fallback query without ordering if created_at column fails
      response = await supabase.from("projects").select("*")
    }

    if (response.error) {
      console.warn("Supabase projects query notice:", response.error.message)
      return projectsCache.length > 0 ? projectsCache : DEFAULT_PROJECTS
    }

    if (response.data && Array.isArray(response.data)) {
      const list = response.data.map(mapRowToProject)
      projectsCache = list
      return list
    }

    return projectsCache.length > 0 ? projectsCache : DEFAULT_PROJECTS
  } catch (err) {
    console.error("Error reading projects from Supabase database:", err)
    return projectsCache.length > 0 ? projectsCache : DEFAULT_PROJECTS
  }
}

/**
 * Synchronous accessor for cached projects
 */
export function fetchProjectsSync(): ProjectRecord[] {
  return projectsCache.length > 0 ? projectsCache : DEFAULT_PROJECTS
}

/**
 * Saves or updates a project directly inside Supabase Cloud Database (`projects` table)
 */
export async function saveProject(project: Partial<ProjectRecord> & { name: string }): Promise<ProjectRecord> {
  const existing = await fetchProjects()
  const now = new Date().toISOString()
  const formattedDate = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  const targetId = project.id || `PRJ-${String(existing.length + 1).padStart(2, "0")}`

  const targetRecord: ProjectRecord = {
    id: targetId,
    name: project.name,
    department: project.department || "Engineering",
    postedBy: project.postedBy || "Recruiter",
    postedDate: formattedDate,
    status: (project.status as "Draft" | "Published") || "Draft",
    openPositions: Number(project.openPositions || 1),
    candidatesCount: Number(project.candidatesCount || 0),
    deadline: project.deadline || "",
    coverImage: project.coverImage || "",
    summary: project.summary || "",
    blocks: project.blocks || [{ id: "b-1", type: "paragraph", text: "" }],
    createdAt: now,
    updatedAt: now,
  }

  // Execute direct SQL upsert to Supabase
  try {
    const { error } = await supabase.from("projects").upsert(
      {
        id: targetRecord.id,
        project_name: targetRecord.name,
        summary: targetRecord.summary,
        department: targetRecord.department,
        posted_by: targetRecord.postedBy,
        posted_date: targetRecord.postedDate,
        status: targetRecord.status,
        open_positions: targetRecord.openPositions,
        candidates_count: targetRecord.candidatesCount,
        deadline: targetRecord.deadline || null,
        cover_image_url: targetRecord.coverImage,
        blocks: targetRecord.blocks,
        updated_at: now,
      },
      { onConflict: "id" }
    )

    if (error) {
      console.warn("Supabase project upsert notice:", error.message)
    }

    await fetchProjects()
    return targetRecord
  } catch (err) {
    console.error("Failed to save project to Supabase database:", err)
    return targetRecord
  }
}

/**
 * Retrieves a single project record by ID directly from Supabase Cloud Database (`projects` table)
 */
export async function getProjectById(id: string): Promise<ProjectRecord | undefined> {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single()

    if (error || !data) {
      const all = await fetchProjects()
      return all.find((p) => p.id === id)
    }

    return mapRowToProject(data)
  } catch (err) {
    console.error("Failed to get project by ID from Supabase:", err)
    const projects = await fetchProjects()
    return projects.find((p) => p.id === id)
  }
}

/**
 * Deletes a project record by ID directly from Supabase Cloud Database (`projects` table)
 */
export async function deleteProject(id: string): Promise<void> {
  try {
    const { error } = await supabase.from("projects").delete().eq("id", id)
    if (error) {
      console.warn("Supabase project delete notice:", error.message)
    }
    await fetchProjects()
  } catch (err) {
    console.error("Failed to delete project from Supabase database:", err)
  }
}
