import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { MainLayout } from "@/layouts/main-layout"
import type { JobRequirement, JobStatus } from "@/types/job-types"
import { generateJobReqId } from "@/utils/job-req-id-generator"
import { fetchAllJobs, saveJobRequirement, saveLocalJobs } from "@/services/job-storage-service"

// shadcn UI Components
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { JobsTable } from "@/components/jobs/jobs-table"

const STATUS_OPTIONS: ComboboxOption[] = [
  { value: "All", label: "Status: All" },
  { value: "Open", label: "Open (Published)" },
  { value: "Draft", label: "Draft" },
  { value: "On Hold", label: "On Hold" },
  { value: "Closed", label: "Closed" },
]

import { useAuditLogger } from "@/hooks/use-audit-logger"

import { 
  Plus, 
  Search, 
  Trash2, 
  Download, 
  AlertTriangle,
} from "lucide-react"

export function JobsPage() {
  const navigate = useNavigate()
  const { logPageView, logStateMutation } = useAuditLogger()
  const [jobs, setJobs] = useState<JobRequirement[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("All")
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deleteConfirmJob, setDeleteConfirmJob] = useState<JobRequirement | null>(null)

  useEffect(() => {
    logPageView("Job Postings")
    fetchAllJobs().then((list) => setJobs(list))
  }, [logPageView])

  // Filter Jobs
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = 
      job.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
      job.reqId.toLowerCase().includes(search.toLowerCase()) ||
      job.domain.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "All" || job.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Handlers for TA Actions
  const handleOpenCreate = () => {
    navigate("/jobs/create")
  }

  const handleOpenEdit = (job: JobRequirement) => {
    navigate(`/jobs/edit/${job.id}`)
    setActiveMenuId(null)
  }

  const handleDuplicate = async (job: JobRequirement) => {
    const seq = Math.floor(41 + Math.random() * 50)
    const newReqId = generateJobReqId(job.domain, seq)
    const newJob: JobRequirement = {
      ...job,
      id: Date.now().toString(),
      reqId: newReqId,
      jobTitle: `${job.jobTitle} (Copy)`,
      status: "Draft",
      postingDate: new Date().toISOString().split("T")[0]
    }
    const updated = await saveJobRequirement(newJob)
    setJobs(updated)
    setActiveMenuId(null)

    await logStateMutation({
      category: "Jobs",
      action: "Job Requirement Duplicated",
      type: "create",
      targetEntity: `Job ${newReqId}`,
      details: `Duplicated job '${job.jobTitle}' into new draft '${newJob.jobTitle}' (${newReqId}).`,
    })
  }

  const handleStatusChange = async (jobId: string, newStatus: JobStatus) => {
    const target = jobs.find((j) => j.id === jobId)
    if (!target) return
    const updatedJob = { ...target, status: newStatus }
    const updatedList = await saveJobRequirement(updatedJob)
    setJobs(updatedList)
    setActiveMenuId(null)

    await logStateMutation({
      category: "Jobs",
      action: "Job Status Updated",
      type: "update",
      targetEntity: `Job ${target.reqId}`,
      details: `Updated status for '${target.jobTitle}' from ${target.status} to ${newStatus}.`,
      changes: [{ field: "status", from: target.status, to: newStatus }],
    })
  }

  const handleDeleteClick = (jobId: string) => {
    const target = jobs.find((j) => j.id === jobId)
    if (target) {
      setDeleteConfirmJob(target)
    }
    setActiveMenuId(null)
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirmJob) return
    const target = deleteConfirmJob
    const updatedList = jobs.filter((j) => j.id !== target.id)
    setJobs(updatedList)
    saveLocalJobs(updatedList)
    setDeleteConfirmJob(null)

    await logStateMutation({
      category: "Jobs",
      action: "Job Requirement Deleted",
      type: "delete",
      targetEntity: `Job ${target.reqId}`,
      details: `Deleted job posting '${target.jobTitle}' (${target.reqId}).`,
    })
  }

  const handleCopyLink = (jobId: string) => {
    const link = `${window.location.origin}/jobs/${jobId}`
    navigator.clipboard.writeText(link)
    setCopiedId(jobId)
    setTimeout(() => setCopiedId(null), 2000)
    setActiveMenuId(null)
  }

  const handleExportCSV = () => {
    const headers = "Req ID,Title,Domain,Experience,Location,Status,Openings,Owner\n"
    const rows = filteredJobs.map(j => 
      `"${j.reqId}","${j.jobTitle}","${j.domain}","${j.experienceMin}-${j.experienceMax} Yrs","${j.location.join(";") }","${j.status}",${j.openings},"${j.recruiterOwner}"`
    ).join("\n")
    const blob = new Blob([headers + rows], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `Job_Postings_Export_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  return (
    <MainLayout pageTitle="Job Management">
      <div className="flex flex-col gap-6 font-sans">
        {/* Top Header & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Job Management</h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Post, edit, duplicate, publish, and manage job requirements.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              className="h-10 border-gray-200 hover:bg-gray-50 text-xs font-semibold rounded-xl cursor-pointer"
            >
              <Download className="w-4 h-4 mr-1.5 text-gray-500" />
              <span>Export CSV</span>
            </Button>

            <Button
              onClick={handleOpenCreate}
              className="h-10 bg-[#FF7F50] hover:bg-[#E56A3C] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Post New Requirement</span>
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className=" flex flex-col md:flex-row items-center justify-between ">
          <div className="relative w-full md:w-80 flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none " />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Req ID, title, or domain..."
              className="pl-9 h-9 text-xs rounded-sm bg-gray-50 border-gray-200"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Status Combobox */}
            <div className="w-[180px]">
              <Combobox
                options={STATUS_OPTIONS}
                value={statusFilter}
                onValueChange={(val) => setStatusFilter(val || "All")}
                placeholder="Status: All"
                searchPlaceholder="Search status..."
                className="h-9 text-xs font-semibold bg-gray-50 border-gray-200 rounded-sm"
                allowCustom={false}
              />
            </div>

            <span className="text-xs text-gray-400 font-medium">
              Showing {filteredJobs.length} Jobs
            </span>
          </div>
        </div>

        {/* Jobs Table */}
        <JobsTable
          jobs={filteredJobs}
          activeMenuId={activeMenuId}
          setActiveMenuId={setActiveMenuId}
          copiedId={copiedId}
          handleCopyLink={handleCopyLink}
          handleOpenEdit={handleOpenEdit}
          handleDuplicate={handleDuplicate}
          handleStatusChange={handleStatusChange}
          handleDelete={handleDeleteClick}
        />

        {/* Delete Confirmation Modal */}
        <Dialog open={!!deleteConfirmJob} onOpenChange={(open) => !open && setDeleteConfirmJob(null)}>
          <DialogContent className="sm:max-w-md p-6 bg-white rounded-2xl border border-gray-200 shadow-2xl">
            <DialogHeader className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-extrabold text-gray-900">
                  Delete Job Requirement?
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                  Are you sure you want to delete <strong className="text-gray-800 font-semibold">{deleteConfirmJob?.jobTitle}</strong> ({deleteConfirmJob?.reqId})? This action cannot be undone.
                </DialogDescription>
              </div>
            </DialogHeader>

            <DialogFooter className="mt-4 flex flex-row items-center justify-end gap-2 border-t border-gray-100 pt-4 bg-transparent -mx-6 -mb-6 p-6 rounded-b-2xl">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmJob(null)}
                className="h-9 px-4 text-xs font-semibold text-gray-700 border-gray-200 hover:bg-gray-50 rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmDelete}
                className="h-9 px-4 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Job</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}
