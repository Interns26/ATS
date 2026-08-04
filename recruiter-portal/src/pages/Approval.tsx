/**
 * Copyright (c) 2026 Coworx UK. All rights reserved.
 */

import { useEffect, useState } from "react";
import { getPendingJobs, getAllJobs, approveJob } from "../services/api";
import type { Job } from "../services/api";

function Card({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
      {title && (
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">{title}</h2>
      )}
      {subtitle && (
        <p className="text-slate-400 dark:text-slate-500 text-sm mb-5">{subtitle}</p>
      )}
      {children}
    </div>
  );
}

function StatusBadge({ isApproved }: { isApproved?: boolean }) {
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
        isApproved
          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
          : "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300"
      }`}
    >
      {isApproved ? "Approved" : "Not Approved"}
    </span>
  );
}

function DetailsModal({ job, onClose }: { job: Job; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg p-6 max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{job.title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <p className="text-slate-400 dark:text-slate-500 mb-1">Department & Location</p>
            <p className="font-semibold text-slate-800 dark:text-slate-100">
              {job.department || "General"} • {job.location || "Remote"}
            </p>
          </div>
          <div>
            <p className="text-slate-400 dark:text-slate-500 mb-1">Description</p>
            <p className="text-slate-700 dark:text-slate-300">{job.description || "-"}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400 dark:text-slate-500 mb-1">Employment Type</p>
              <p className="font-semibold text-slate-800 dark:text-slate-100">{job.employment_type || "Full-time"}</p>
            </div>
            <div>
              <p className="text-slate-400 dark:text-slate-500 mb-1">Status</p>
              <StatusBadge isApproved={job.is_approved} />
            </div>
          </div>
          {job.minio_bucket && (
            <div>
              <p className="text-slate-400 dark:text-slate-500 mb-1">MinIO Storage Bucket</p>
              <p className="font-semibold text-slate-800 dark:text-slate-100">{job.minio_bucket}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Approval() {
  const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailsJob, setDetailsJob] = useState<Job | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = activeTab === "pending" ? await getPendingJobs() : await getAllJobs();
      setJobs(data);
    } catch (err) {
      console.error("Failed to load jobs for approval page:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [activeTab]);

  const selectedJob = jobs.find((j) => j.id === selectedId) || null;

  const handleApprove = async () => {
    if (!selectedId) return;
    setActionLoading(true);
    try {
      await approveJob(selectedId);
      alert("Job approved successfully! MinIO bucket created.");
      setSelectedId(null);
      fetchJobs();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to approve job.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">Approval</h1>
        <p className="text-slate-400 dark:text-slate-500 mt-1">
          HR review queue for job postings awaiting approval.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => { setActiveTab("pending"); setSelectedId(null); }}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
            activeTab === "pending"
              ? "bg-blue-600 text-white"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600"
          }`}
        >
          Pending Queue
        </button>
        <button
          onClick={() => { setActiveTab("all"); setSelectedId(null); }}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
            activeTab === "all"
              ? "bg-blue-600 text-white"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600"
          }`}
        >
          All Postings & History
        </button>
      </div>

      <Card
        title={activeTab === "pending" ? "Pending Jobs Queue" : "All Job Postings"}
        subtitle={activeTab === "pending" ? "Select a pending job to review and approve." : "Viewing all approved and unapproved job postings."}
      >
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-left">
                <th className="px-4 py-3 font-semibold w-8"></th>
                <th className="px-4 py-3 font-semibold">Job Title</th>
                <th className="px-4 py-3 font-semibold">Department</th>
                <th className="px-4 py-3 font-semibold">Description</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                    Loading jobs...
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                    {activeTab === "pending" ? "No jobs currently pending approval." : "No jobs found."}
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr
                    key={job.id}
                    className={`border-t border-slate-100 dark:border-slate-700 ${
                      selectedId === job.id ? "bg-blue-50 dark:bg-blue-950" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="radio"
                        name="selectedJob"
                        checked={selectedId === job.id}
                        onChange={() => setSelectedId(job.id)}
                      />
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">
                      {job.title}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{job.department || "General"}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-[200px] truncate">
                      {job.description || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge isApproved={job.is_approved} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDetailsJob(job)}
                        className="text-blue-600 dark:text-blue-400 text-xs font-semibold hover:underline"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Approval Details">
        {selectedJob ? (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-5 text-sm">
              <div>
                <p className="text-slate-400 dark:text-slate-500 mb-1">Job Title</p>
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {selectedJob.title}
                </p>
              </div>
              <div>
                <p className="text-slate-400 dark:text-slate-500 mb-1">Department</p>
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {selectedJob.department || "General"}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-400 dark:text-slate-500 mb-1">Description</p>
                <p className="text-slate-700 dark:text-slate-300">
                  {selectedJob.description || "-"}
                </p>
              </div>
              <div>
                <p className="text-slate-400 dark:text-slate-500 mb-1">Employment Type</p>
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {selectedJob.employment_type || "Full-time"}
                </p>
              </div>
              <div>
                <p className="text-slate-400 dark:text-slate-500 mb-1">Approval Status</p>
                <StatusBadge isApproved={selectedJob.is_approved} />
              </div>
            </div>

            {!selectedJob.is_approved ? (
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="bg-blue-600 text-white text-sm font-semibold rounded-lg px-5 py-2.5 hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading ? "Approving..." : "Approve Job"}
              </button>
            ) : (
              <div className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-lg p-3 inline-block">
                ✓ This job position is already approved and its MinIO storage bucket ({selectedJob.minio_bucket}) is active.
              </div>
            )}
          </div>
        ) : (
          <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
            Select a job from the table above to review it here.
          </div>
        )}
      </Card>

      {detailsJob && <DetailsModal job={detailsJob} onClose={() => setDetailsJob(null)} />}
    </div>
  );
}
