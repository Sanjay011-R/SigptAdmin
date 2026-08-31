import { supabase } from "@/lib/supabase"
import { MOCK_JOBS } from "@/types/job-types"
import type { JobRequirement } from "@/types/job-types"

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
  const currentJobs = getLocalJobs()
  const existingIdx = currentJobs.findIndex((j) => j.id === job.id || j.reqId === job.reqId)

  let updatedList: JobRequirement[]
  if (existingIdx >= 0) {
    updatedList = [...currentJobs]
    updatedList[existingIdx] = { ...job }
  } else {
    updatedList = [job, ...currentJobs]
  }

  // Save to local storage
  saveLocalJobs(updatedList)

  // Save/upsert to Supabase job_requirements table asynchronously
  try {
    const { error } = await supabase.from("job_requirements").upsert(
      {
        id: job.id,
        req_id: job.reqId,
        job_title: job.jobTitle,
        domain: job.domain,
        experience_min: job.experienceMin,
        experience_max: job.experienceMax,
        location: job.location,
        employment_type: job.employmentType,
        job_summary: job.jobSummary,
        responsibilities: job.responsibilities,
        mandatory_skills: job.mandatorySkills,
        preferred_skills: job.preferredSkills,
        qualification: job.qualification,
        openings: job.openings,
        status: job.status,
        posting_date: job.postingDate,
        closing_date: job.closingDate || null,
        recruiter_owner: job.recruiterOwner,
        why_join_si: job.whyJoinSI,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )

    if (error) {
      console.warn("Supabase table store notification:", error.message)
    }
  } catch (err) {
    console.warn("Could not upsert to Supabase job_requirements table:", err)
  }

  return updatedList
}
