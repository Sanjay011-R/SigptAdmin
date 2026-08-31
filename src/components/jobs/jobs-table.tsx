import { Link } from "react-router-dom"
import type { JobRequirement, JobStatus } from "@/types/job-types"
import {
  Eye,
  Copy,
  Edit,
  MoreVertical,
  Play,
  Pause,
  Archive,
  Users,
  Trash2,
  Check,
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface JobsTableProps {
  jobs: JobRequirement[]
  activeMenuId: string | null
  setActiveMenuId: (id: string | null) => void
  copiedId: string | null
  handleCopyLink: (jobId: string) => void
  handleOpenEdit: (job: JobRequirement) => void
  handleDuplicate: (job: JobRequirement) => void
  handleStatusChange: (jobId: string, newStatus: JobStatus) => void
  handleDelete: (jobId: string) => void
}

export function JobsTable({
  jobs,
  activeMenuId,
  setActiveMenuId,
  copiedId,
  handleCopyLink,
  handleOpenEdit,
  handleDuplicate,
  handleStatusChange,
  handleDelete,
}: JobsTableProps) {
  return (
    <div className="bg-white rounded-sm border border-gray-200/80 overflow-visible min-h-[420px] flex flex-col justify-between">
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-xs text-gray-600">
          <thead className="bg-gray-50/80 text-gray-700 font-bold border-b border-gray-200/70">
            <tr>
              <th className="py-3.5 px-5">Req ID & Title</th>
              <th className="py-3.5 px-4">Domain</th>
              <th className="py-3.5 px-4">Exp & Type</th>
              <th className="py-3.5 px-4">Location</th>
              <th className="py-3.5 px-4">TA Owner</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-medium">
            {jobs.map((job) => (
              <tr
                key={job.id}
                className="even:bg-gray-50/50 odd:bg-white hover:bg-orange-50/60 transition-colors"
              >
                {/* Req ID & Title */}
                <td className="py-4 px-5">
                  <div className="flex flex-col gap-0.5">
                    <Link
                      to={`/jobs/${job.id}`}
                      className="font-bold text-gray-900 text-sm hover:text-[#FF7F50] transition-colors"
                    >
                      {job.jobTitle}
                    </Link>
                    <span className="text-[11px] text-gray-400 font-mono">
                      {job.reqId} • Posted {job.postingDate}
                    </span>
                  </div>
                </td>

                {/* Domain */}
                <td className="py-4 px-4">
                  <span className="px-2.5 py-1 bg-indigo-50 text-[#0B192C] rounded-md font-semibold text-[11px]">
                    {job.domain}
                  </span>
                </td>

                {/* Exp & Type */}
                <td className="py-4 px-4">
                  <div className="flex flex-col gap-0.5 text-gray-700">
                    <span>
                      {job.experienceMin}-{job.experienceMax} Years
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {job.employmentType}
                    </span>
                  </div>
                </td>

                {/* Location */}
                <td className="py-4 px-4 text-gray-700 font-medium">
                  {job.location.join(", ")}
                </td>

                {/* TA Owner */}
                <td className="py-4 px-4 text-gray-600">
                  {job.recruiterOwner}
                </td>

                {/* Status */}
                <td className="py-4 px-4">
                  <span
                    className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                      job.status === "Open"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : job.status === "Draft"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : job.status === "On Hold"
                        ? "bg-purple-50 text-purple-700 border border-purple-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {job.status}
                  </span>
                </td>

                {/* Actions */}
                <td className="py-4 px-5 text-right relative">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link
                      to={`/jobs/${job.id}`}
                      className="p-1.5 text-gray-500 hover:text-[#0B192C] hover:bg-gray-100 rounded-lg transition-colors"
                      title="View Detail Page"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>

                    <button
                      onClick={() => handleCopyLink(job.id)}
                      className="p-1.5 text-gray-500 hover:text-[#FF7F50] hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                      title="Copy Share Link"
                    >
                      {copiedId === job.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => handleOpenEdit(job)}
                      className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit Requirement"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <Popover
                      open={activeMenuId === job.id}
                      onOpenChange={(open) => setActiveMenuId(open ? job.id : null)}
                    >
                      <PopoverTrigger
                        render={
                          <button
                            onClick={() =>
                              setActiveMenuId(activeMenuId === job.id ? null : job.id)
                            }
                            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer"
                            title="More Actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        }
                      />

                      <PopoverContent
                        align="end"
                        sideOffset={4}
                        className="w-48 p-1.5 bg-white border border-gray-200 rounded-xl shadow-xl flex flex-col text-xs font-medium text-gray-700 z-50"
                      >
                        <button
                          onClick={() => handleDuplicate(job)}
                          className="px-3.5 py-2 hover:bg-gray-50 flex items-center gap-2 cursor-pointer rounded-lg text-left w-full"
                        >
                          <Copy className="w-3.5 h-3.5" /> Duplicate Job
                        </button>

                        {job.status !== "Open" && (
                          <button
                            onClick={() => handleStatusChange(job.id, "Open")}
                            className="px-3.5 py-2 hover:bg-emerald-50 text-emerald-700 flex items-center gap-2 cursor-pointer rounded-lg text-left w-full font-semibold"
                          >
                            <Play className="w-3.5 h-3.5" /> Publish (Open)
                          </button>
                        )}

                        {job.status === "Open" && (
                          <button
                            onClick={() => handleStatusChange(job.id, "On Hold")}
                            className="px-3.5 py-2 hover:bg-purple-50 text-purple-700 flex items-center gap-2 cursor-pointer rounded-lg text-left w-full"
                          >
                            <Pause className="w-3.5 h-3.5" /> Put On Hold
                          </button>
                        )}

                        {job.status !== "Closed" && (
                          <button
                            onClick={() => handleStatusChange(job.id, "Closed")}
                            className="px-3.5 py-2 hover:bg-gray-100 text-gray-800 flex items-center gap-2 cursor-pointer rounded-lg text-left w-full"
                          >
                            <Archive className="w-3.5 h-3.5" /> Close Job
                          </button>
                        )}

                        <Link
                          to={`/applications?reqId=${job.reqId}`}
                          onClick={() => setActiveMenuId(null)}
                          className="px-3.5 py-2 hover:bg-gray-50 flex items-center gap-2 cursor-pointer rounded-lg border-t border-gray-100 text-left w-full"
                        >
                          <Users className="w-3.5 h-3.5" /> View Applications
                        </Link>

                        <button
                          onClick={() => handleDelete(job.id)}
                          className="px-3.5 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 cursor-pointer rounded-lg border-t border-gray-100 text-left w-full"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete Job
                        </button>
                      </PopoverContent>
                    </Popover>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
