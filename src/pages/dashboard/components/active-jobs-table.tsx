import { useNavigate } from "react-router-dom"
import type { JobRequirement } from "@/types/job-types"
import { Briefcase, ArrowRight, MapPin, Users } from "lucide-react"

interface ActiveJobsTableProps {
  jobs: JobRequirement[]
}

export function ActiveJobsTable({ jobs }: ActiveJobsTableProps) {
  const navigate = useNavigate()
  const openJobs = jobs.filter((j) => j.status === "Open").slice(0, 5)

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900">Active Job Requisitions</h2>
          <p className="text-xs text-gray-500">Top open requirements currently accepting applications</p>
        </div>
        <button
          onClick={() => navigate("/jobs")}
          className="text-xs font-semibold text-[#0B192C] hover:underline cursor-pointer flex items-center gap-1"
        >
          View All ({jobs.length}) <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {openJobs.length === 0 ? (
        <div className="py-8 text-center text-xs text-gray-500 flex flex-col items-center gap-2">
          <Briefcase className="w-8 h-8 text-gray-300" />
          <span>No active open jobs found.</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200/70">
              <tr>
                <th className="py-3 px-4">Req ID</th>
                <th className="py-3 px-4">Job Title</th>
                <th className="py-3 px-4">Domain</th>
                <th className="py-3 px-4">Openings</th>
                <th className="py-3 px-4">Locations</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {openJobs.map((job) => (
                <tr
                  key={job.id}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                  className="hover:bg-gray-50/70 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono text-[11px] font-semibold text-indigo-600">
                    {job.reqId}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-gray-900">
                    {job.jobTitle}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md font-medium text-[11px]">
                      {job.domain}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-gray-900 flex items-center gap-1">
                      <Users className="w-3 h-3 text-gray-400" />
                      {job.openings}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="flex items-center gap-1 text-gray-500">
                      <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                      {job.location.join(", ")}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full font-semibold text-[11px]">
                      Open
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
