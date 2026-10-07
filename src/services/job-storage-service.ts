import { supabase } from "@/lib/supabase"
import { MOCK_JOBS } from "@/types/job-types"
import type { JobRequirement } from "@/types/job-types"
import { generateJobHashtags } from "@/utils/hashtag-generator"

const STORAGE_KEY = "sigpt_job_requirements_v1"

/** Retrieve stored jobs from LocalStorage or fallback to MOCK_JOBS */
export function getLocalJobs(): JobRequirement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_JOBS))
      return MOCK_JOBS
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : MOCK_JOBS
  } catch (err) {
    console.error("Error reading jobs from localStorage:", err)
    return MOCK_JOBS
  }
}

/** Save list of jobs to LocalStorage */
export function saveLocalJobs(jobs: JobRequirement[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs))
  } catch (err) {
    console.error("Error saving jobs to localStorage:", err)
  }
}

/** Fetch jobs from Supabase job_requirements table (or fallback to local jobs) */
export async function fetchAllJobs(): Promise<JobRequirement[]> {
  try {
    const { data, error } = await supabase
      .from("job_requirements")
      .select("*")
      .order("created_at", { ascending: false })

    if (error || !data || data.length === 0) {
      return getLocalJobs()
    }

    // Map database table columns to JobRequirement
    const remoteList: JobRequirement[] = data.map((row) => ({
      id: row.id || String(row.req_id),
      reqId: row.req_id || row.reqId,
      jobTitle: row.job_title || row.jobTitle,
      domain: row.domain,
      experienceMin: Number(row.experience_min ?? row.experienceMin ?? 3),
      experienceMax: Number(row.experience_max ?? row.experienceMax ?? 7),
      location: Array.isArray(row.location) ? row.location : [row.location || "Bengaluru"],
      employmentType: row.employment_type || row.employmentType || "Full-time",
      jobSummary: row.job_summary || row.jobSummary || "",
      responsibilities: row.responsibilities || [],
      mandatorySkills: row.mandatory_skills || row.mandatorySkills || [],
      preferredSkills: row.preferred_skills || row.preferredSkills || [],
      qualification: row.qualification || "",
      openings: Number(row.openings || 1),
      status: row.status || "Open",
      postingDate: row.posting_date || row.postingDate || new Date().toISOString().split("T")[0],
      closingDate: row.closing_date || row.closingDate || "",
      recruiterOwner: row.recruiter_owner || row.recruiterOwner || "Sarah Jenkins (TA Lead)",
      whyJoinSI: row.why_join_si || row.whyJoinSI || [],
      hashtags: row.hashtags || generateJobHashtags(row),
    }))

    // Save to local storage for quick offline sync
    saveLocalJobs(remoteList)
    return remoteList
  } catch (err) {
    console.warn("Supabase fetch failed, falling back to local jobs:", err)
    return getLocalJobs()
  }
}

/** Publish/Save job requirement to both Supabase job_requirements table and local storage */
export async function saveJobRequirement(job: JobRequirement): Promise<JobRequirement[]> {
  const hashtags = job.hashtags || generateJobHashtags(job)
  const jobWithHashtags: JobRequirement = { ...job, hashtags }

  const currentJobs = getLocalJobs()
  const existingIdx = currentJobs.findIndex((j) => j.id === job.id || j.reqId === job.reqId)

  let updatedList: JobRequirement[]
  if (existingIdx >= 0) {
    updatedList = [...currentJobs]
    updatedList[existingIdx] = { ...jobWithHashtags }
  } else {
    updatedList = [jobWithHashtags, ...currentJobs]
  }

  // Save to local storage
  saveLocalJobs(updatedList)

  // Save/upsert to Supabase job_requirements table asynchronously
  try {
    const payload: Record<string, any> = {
      id: jobWithHashtags.id,
      req_id: jobWithHashtags.reqId,
      job_title: jobWithHashtags.jobTitle,
      domain: jobWithHashtags.domain,
      experience_min: jobWithHashtags.experienceMin,
      experience_max: jobWithHashtags.experienceMax,
      location: jobWithHashtags.location,
      employment_type: jobWithHashtags.employmentType,
      job_summary: jobWithHashtags.jobSummary,
      responsibilities: jobWithHashtags.responsibilities,
      mandatory_skills: jobWithHashtags.mandatorySkills,
      preferred_skills: jobWithHashtags.preferredSkills,
      qualification: jobWithHashtags.qualification,
      openings: jobWithHashtags.openings,
      status: jobWithHashtags.status,
      posting_date: jobWithHashtags.postingDate,
      closing_date: jobWithHashtags.closingDate || null,
      recruiter_owner: jobWithHashtags.recruiterOwner,
      why_join_si: jobWithHashtags.whyJoinSI,
      hashtags: jobWithHashtags.hashtags,
      updated_at: new Date().toISOString(),
    }

    let { error } = await supabase.from("job_requirements").upsert(payload, { onConflict: "id" })

    // If hashtags column not added to DB yet, retry without hashtags column
    if (error && error.message && error.message.toLowerCase().includes("hashtags")) {
      console.warn("[Jobs] 'hashtags' column missing in Supabase, retrying without it:", error.message)
      delete payload.hashtags
      const retry = await supabase.from("job_requirements").upsert(payload, { onConflict: "id" })
      error = retry.error
    }

    if (error) {
      console.error("[Jobs] Supabase upsert error:", error.message, error.details || "")
    } else {
      console.log("[Jobs] Successfully upserted job to Supabase:", jobWithHashtags.reqId)
    }
  } catch (err) {
    console.warn("Could not upsert to Supabase job_requirements table:", err)
  }

  return updatedList
}

/** Delete job requirement from both Supabase and localStorage */
export async function deleteJobRequirement(id: string, reqId?: string): Promise<JobRequirement[]> {
  const currentJobs = getLocalJobs()
  const updatedList = currentJobs.filter((j) => j.id !== id && (!reqId || j.reqId !== reqId))
  saveLocalJobs(updatedList)

  try {
    const filter = reqId ? `id.eq.${id},req_id.eq.${reqId}` : `id.eq.${id}`
    const { error } = await supabase
      .from("job_requirements")
      .delete()
      .or(filter)

    if (error) {
      console.warn("[Jobs] Supabase delete warning:", error.message)
    } else {
      console.log("[Jobs] Successfully deleted job from Supabase:", id, reqId)
    }
  } catch (err) {
    console.warn("Could not delete from Supabase job_requirements table:", err)
  }

  return updatedList
}
