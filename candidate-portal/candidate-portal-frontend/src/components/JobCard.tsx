import { MapPin, Clock, ArrowUpRight } from "lucide-react";
import type { Job } from "../types/job";
import { getJobStatus, formatDate } from "../lib/jobStatus";

const statusConfig = {
  open: { label: "Open", color: "var(--color-status-open)" },
  closing_soon: { label: "Closing soon", color: "var(--color-status-closing)" },
  new: { label: "New", color: "var(--color-status-new)" },
};

interface JobCardProps {
  job: Job;
  onClick: () => void;
}

export function JobCard({ job, onClick }: JobCardProps) {
  const status = getJobStatus(job);
  const config = statusConfig[status];

  return (
    <button
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-xl border border-ink-100 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md"
    >
      {/* signature status rail */}
      <span
        className="absolute left-0 top-0 h-full w-1"
        style={{ backgroundColor: config.color }}
      />

      <div className="flex items-start justify-between gap-3 pl-2">
        <div>
          <span
            className="mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
            style={{ color: config.color, backgroundColor: `${config.color}1a` }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: config.color }}
            />
            {config.label}
          </span>

          <h3
            className="text-lg font-bold text-ink-900 group-hover:text-primary-800"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {job.title}
          </h3>

          <p className="mt-1 text-sm text-ink-500">{job.department}</p>
        </div>

        <ArrowUpRight
          size={20}
          className="mt-1 shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary-700"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 pl-2 text-sm text-ink-500">
        <span className="flex items-center gap-1.5">
          <MapPin size={14} />
          {job.location}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={14} />
          {job.employmentType}
        </span>
      </div>

      <div
        className="mt-4 pl-2 text-xs text-ink-500"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        Closes {formatDate(job.closingDate)}
      </div>
    </button>
  );
}
