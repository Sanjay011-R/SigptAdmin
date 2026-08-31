import { supabase } from "@/lib/supabase";

export interface CandidateApplicationRecord {
  id: string; // Ref ID e.g. APP-849204
  jobId: string;
  reqId: string;
  jobTitle: string;
  domain: string;
  fullName: string;
  email: string;
  mobile: string;
  currentLocation: string;
  preferredLocation: string;
  totalExperience: string;
  relevantExperience: string;
  currentCompany: string;
  currentCtc: string;
  expectedCtc: string;
  noticePeriod: string;
  linkedinUrl?: string;
  shortNote?: string;
  resumeName: string;
  resumeSize?: number;
  resumeDataUrl?: string;
  appliedAt: string;
  status: "Under Review" | "Shortlisted" | "Interviewing" | "Hired" | "Rejected";
}

export const STORAGE_KEY = "sigpt_candidate_applications_v1";

export interface ApplicationPageFilters {
  search?: string;
  status?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

export const APPLICATION_PAGE_SIZE = 10;

interface ApplicationRow {
  id?: string | number | null;
  job_id?: string | null;
  job_title?: string | null;
  req_id?: string | null;
  domain?: string | null;
  full_name?: string | null;
  email?: string | null;
  mobile?: string | null;
  current_location?: string | null;
  preferred_location?: string | null;
  total_experience?: string | null;
  relevant_experience?: string | null;
  current_company?: string | null;
  current_ctc?: string | null;
  expected_ctc?: string | null;
  notice_period?: string | null;
  linkedin_url?: string | null;
  short_note?: string | null;
  resume_name?: string | null;
  resume_size?: number | null;
  resume_data_url?: string | null;
  applied_at?: string | null;
  status?: string | null;
}

async function mapApplicationRow(row: ApplicationRow): Promise<CandidateApplicationRecord> {
  let decompressedUrl = row.resume_data_url || "";
  if (decompressedUrl.startsWith("gz:")) {
    try {
      decompressedUrl = await decompressString(decompressedUrl);
    } catch (e) {
      console.warn("Could not decompress resume payload:", e);
    }
  }

  if (decompressedUrl && !decompressedUrl.startsWith("data:") && !decompressedUrl.startsWith("http")) {
    decompressedUrl = `data:application/pdf;base64,${decompressedUrl}`;
  }

  return {
    id: String(row.id),
    jobId: row.job_id || "",
    reqId: row.req_id || "REQ-000",
    jobTitle: row.job_title || "Untitled Position",
    domain: row.domain || "General",
    fullName: row.full_name || "Unknown Candidate",
    email: row.email || "",
    mobile: row.mobile || "",
    currentLocation: row.current_location || "",
    preferredLocation: row.preferred_location || "",
    totalExperience: row.total_experience || "0",
    relevantExperience: row.relevant_experience || "0",
    currentCompany: row.current_company || "",
    currentCtc: row.current_ctc || "",
    expectedCtc: row.expected_ctc || "",
    noticePeriod: row.notice_period || "",
    linkedinUrl: row.linkedin_url || "",
    shortNote: row.short_note || "",
    resumeName: row.resume_name || "resume.pdf",
    resumeSize: row.resume_size || 0,
    resumeDataUrl: decompressedUrl,
    appliedAt: row.applied_at || new Date().toISOString(),
    status: (row.status as CandidateApplicationRecord["status"]) || "Under Review",
  };
}

function filterLocalApplications(
  filters: ApplicationPageFilters
): CandidateApplicationRecord[] {
  const status = filters.status && filters.status !== "All" ? filters.status : null;
  const search = filters.search?.trim().toLowerCase() || "";
  return getLocalApplications().filter((app) => {
    const matchesStatus = !status || app.status === status;
    const matchesSearch =
      !search ||
      app.fullName.toLowerCase().includes(search) ||
      app.email.toLowerCase().includes(search) ||
      app.jobTitle.toLowerCase().includes(search) ||
      app.reqId.toLowerCase().includes(search) ||
      app.currentCompany.toLowerCase().includes(search);
    return matchesStatus && matchesSearch;
  });
}

export async function decompressString(compressedStr: string): Promise<string> {
  if (!compressedStr) return "";
  if (compressedStr.startsWith("gz:") && typeof DecompressionStream !== "undefined") {
    try {
      const binary = atob(compressedStr.slice(3));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const stream = new Blob([bytes]).stream();
      const decompressedStream = stream.pipeThrough(new DecompressionStream("gzip"));
      const response = new Response(decompressedStream);
      return await response.text();
    } catch (e) {
      console.warn("GZIP Decompression failed:", e);
    }
  }
  return compressedStr;
}

export function getLocalApplications(): CandidateApplicationRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Error reading candidate applications from localStorage:", err);
    return [];
  }
}

export function updateLocalApplicationStatus(
  appId: string,
  newStatus: CandidateApplicationRecord["status"]
): void {
  try {
    const apps = getLocalApplications();
    const updated = apps.map((app) =>
      app.id === appId || app.reqId === appId ? { ...app, status: newStatus } : app
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Error updating candidate application in localStorage:", err);
  }
}

export async function fetchCandidateApplications(): Promise<CandidateApplicationRecord[]> {
  const localApps = getLocalApplications();
  try {
    const { data, error } = await supabase
      .from("candidate_applications")
      .select("*")
      .order("applied_at", { ascending: false });

    if (error || !data) {
      return localApps;
    }

    const dbMapped = await Promise.all(data.map((row) => mapApplicationRow(row)));
    const dbIds = new Set(dbMapped.map((a) => a.id));
    const merged = [...dbMapped, ...localApps.filter((a) => !dbIds.has(a.id))];

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch (e) {
      console.warn("Could not cache candidate applications to localStorage:", e);
    }

    return merged;
  } catch (err) {
    console.warn("Supabase fetch failed, using local applications:", err);
    return localApps;
  }
}

export async function fetchCandidateApplicationsPage(
  page: number,
  pageSize: number = APPLICATION_PAGE_SIZE,
  filters: ApplicationPageFilters = {}
): Promise<PaginatedResult<CandidateApplicationRecord>> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const localFiltered = filterLocalApplications(filters);

  try {
    let query = supabase
      .from("candidate_applications")
      .select("*", { count: "exact" });

    if (filters.status && filters.status !== "All") {
      query = query.eq("status", filters.status);
    }
    if (filters.search?.trim()) {
      const q = filters.search.trim().toLowerCase();
      query = query.or(
        `full_name.ilike.%${q}%,email.ilike.%${q}%,job_title.ilike.%${q}%,req_id.ilike.%${q}%,current_company.ilike.%${q}%`
      );
    }

    const { data, error, count } = await query
      .order("applied_at", { ascending: false })
      .range(from, to);

    if (error || !data) {
      console.warn("Supabase paged fetch failed, using local applications:", error?.message ?? error);
      return { data: localFiltered.slice(from, to + 1), total: localFiltered.length };
    }

    const mapped = await Promise.all(data.map((row) => mapApplicationRow(row)));
    if (mapped.length === 0) {
      return { data: localFiltered.slice(from, to + 1), total: localFiltered.length };
    }

    return { data: mapped, total: count ?? localFiltered.length };
  } catch (err) {
    console.warn("Supabase paged fetch failed, using local applications:", err);
    return { data: localFiltered.slice(from, to + 1), total: localFiltered.length };
  }
}

export async function updateApplicationStatus(
  appId: string,
  newStatus: CandidateApplicationRecord["status"],
  extraIdentifier?: { reqId?: string; email?: string }
): Promise<boolean> {
  // Update local storage for instant UI sync
  updateLocalApplicationStatus(appId, newStatus);
  if (extraIdentifier?.reqId) {
    updateLocalApplicationStatus(extraIdentifier.reqId, newStatus);
  }

  try {
    const rawId = appId.trim();
    const digitsOnly = rawId.replace(/\D/g, "");
    const numericId = digitsOnly ? parseInt(digitsOnly, 10) : null;
    const userEmail = extraIdentifier?.email?.trim();
    const reqId = extraIdentifier?.reqId?.trim();

    // 0. Try RPC procedure first if created in Supabase
    try {
      const { data: rpcData, error: rpcErr } = await supabase.rpc(
        "update_candidate_application_status",
        {
          p_app_id: rawId,
          p_status: newStatus,
        }
      );
      if (!rpcErr && rpcData?.success) {
        return true;
      }
    } catch {
      // Ignore RPC if not created yet
    }

    // 1. Primary Attempt: update by exact candidate text ID (e.g. "APP-908896")
    {
      const { data, error } = await supabase
        .from("candidate_applications")
        .update({ status: newStatus })
        .eq("id", rawId)
        .select("id");

      if (!error && data && data.length > 0) {
        return true;
      }
    }

    // 2. Secondary Attempt: update by candidate numeric ID (e.g. 908896 or 1)
    if (numericId !== null && !isNaN(numericId)) {
      const { data, error } = await supabase
        .from("candidate_applications")
        .update({ status: newStatus })
        .eq("id", numericId)
        .select("id");

      if (!error && data && data.length > 0) {
        return true;
      }
    }

    // 3. Attempt by ref_id column matching rawId
    try {
      const { data, error } = await supabase
        .from("candidate_applications")
        .update({ status: newStatus })
        .eq("ref_id", rawId)
        .select("id");

      if (!error && data && data.length > 0) {
        return true;
      }
    } catch {
      // Ignore if ref_id column does not exist
    }

    // 4. Tertiary Attempt: update by candidate email + req_id
    if (userEmail) {
      if (reqId) {
        const { data, error } = await supabase
          .from("candidate_applications")
          .update({ status: newStatus })
          .eq("email", userEmail)
          .eq("req_id", reqId)
          .select("id");

        if (!error && data && data.length > 0) {
          return true;
        }
      }

      // Fallback: update by candidate email
      const { data: emailData, error: emailErr } = await supabase
        .from("candidate_applications")
        .update({ status: newStatus })
        .eq("email", userEmail)
        .select("id");

      if (!emailErr && emailData && emailData.length > 0) {
        return true;
      }
    }

    // 5. Fallback attempt by req_id if provided
    if (reqId) {
      const { data, error } = await supabase
        .from("candidate_applications")
        .update({ status: newStatus })
        .eq("req_id", reqId)
        .select("id");

      if (!error && data && data.length > 0) {
        return true;
      }
    }
  } catch (err) {
    console.warn("Supabase update status error:", err);
  }

  return true;
}

