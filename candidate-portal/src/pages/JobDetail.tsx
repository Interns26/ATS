/**
 * Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.
 */

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, Calendar } from "lucide-react";
import { Header } from "../components/Header";
import { fetchJob } from "../services/api";
import { formatDate, getJobStatus } from "../lib/jobStatus";
import type { Job } from "../types/job";

const statusConfig = {
  open: { label: "Open", color: "var(--color-status-open)" },
  closing_soon: { label: "Closing soon", color: "var(--color-status-closing)" },
  new: { label: "New", color: "var(--color-status-new)" },
};

export function JobDetail() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;
    fetchJob(jobId)
      .then(setJob)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [jobId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-50">
        <Header />
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <p className="text-ink-500">Loading…</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-ink-50">
        <Header />
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <p className="text-ink-500">
            {error ?? "This job posting couldn't be found."}
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 text-sm font-semibold text-primary-800 hover:underline"
          >
            Back to all openings
          </button>
        </div>
      </div>
    );
  }

  const status = getJobStatus(job);
  const config = statusConfig[status];

  return (
    <div className="min-h-screen bg-ink-50">
      <Header />

      <div className="mx-auto max-w-3xl px-6 py-10">
        <button
          onClick={() => navigate("/")}
          className="mb-6 flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-primary-800"
        >
          <ArrowLeft size={16} />
          Back to all openings
        </button>

        <div className="overflow-hidden rounded-xl border border-ink-100 bg-white shadow-sm">
          <div className="border-b border-ink-100 p-8">
            <span
              className="mb-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{ color: config.color, backgroundColor: `${config.color}1a` }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: config.color }}
              />
              {config.label}
            </span>

            <h1
              className="text-3xl font-extrabold text-primary-900"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {job.title}
            </h1>
            <p className="mt-1 text-ink-500">{job.department}</p>

            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-700">
              <span className="flex items-center gap-1.5">
                <MapPin size={15} />
                {job.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={15} />
                {job.employmentType}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={15} />
                Closes {formatDate(job.closingDate)}
              </span>
            </div>
          </div>

          <div className="space-y-8 p-8">
            {job.description && (
              <section>
                <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-500">
                  About the role
                </h2>
                <p className="text-ink-700 leading-relaxed whitespace-pre-line">{job.description}</p>
              </section>
            )}

            {job.responsibilities && job.responsibilities.length > 0 && (
              <section>
                <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-500">
                  Responsibilities
                </h2>
                <ul className="space-y-2">
                  {job.responsibilities.map((item, i) => (
                    <li key={i} className="flex gap-2 text-ink-700">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {job.requirements && job.requirements.length > 0 && (
              <section>
                <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-500">
                  Requirements
                </h2>
                <ul className="space-y-2">
                  {job.requirements.map((item, i) => (
                    <li key={i} className="flex gap-2 text-ink-700">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <div className="border-t border-ink-100 p-8">
            <button
              onClick={() => navigate(`/apply/${job.id}`)}
              className="w-full rounded-lg bg-primary-800 py-3.5 text-center font-semibold text-white transition hover:bg-primary-900 sm:w-auto sm:px-8"
            >
              Apply for this role
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
