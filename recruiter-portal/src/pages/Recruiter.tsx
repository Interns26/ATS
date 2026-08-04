/**
 * Copyright (c) 2026 Coworx UK. All rights reserved.
 */

import { useEffect, useState } from "react";
import { getAllJobs, createJob, deleteJob } from "../services/api";

type JobStatus = "Approved" | "Not Approved";

type Job = {
  id: string;
  name: string;
  tl: string;
  description: string;
  status: JobStatus;
  approvedBy: string;
  budget: string;
  creator: string;
};

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

function StatusBadge({ status }: { status: JobStatus }) {
  const isApproved = status === "Approved";
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
        isApproved
          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
          : "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300"
      }`}
    >
      {status}
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
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{job.name}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <p className="text-slate-400 dark:text-slate-500 mb-1">Team Lead</p>
            <p className="font-semibold text-slate-800 dark:text-slate-100">{job.tl}</p>
          </div>
          <div>
            <p className="text-slate-400 dark:text-slate-500 mb-1">Description</p>
            <p className="text-slate-700 dark:text-slate-300">{job.description || "-"}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400 dark:text-slate-500 mb-1">Budget</p>
              <p className="font-semibold text-slate-800 dark:text-slate-100">{job.budget}</p>
            </div>
            <div>
              <p className="text-slate-400 dark:text-slate-500 mb-1">Status</p>
              <StatusBadge status={job.status} />
            </div>
          </div>
          <div>
            <p className="text-slate-400 dark:text-slate-500 mb-1">Approved By</p>
            <p className="font-semibold text-slate-800 dark:text-slate-100">{job.approvedBy}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Recruiter() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"All" | JobStatus>("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newJob, setNewJob] = useState({ name: "", tl: "", description: "", budget: "" });
  const [detailsJob, setDetailsJob] = useState<Job | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await getAllJobs();
      const mapped: Job[] = data.map((item) => ({
        id: item.id,
        name: item.title,
        tl: item.department || "General",
        description: item.description || "",
        status: item.is_approved ? "Approved" : "Not Approved",
        approvedBy: item.is_approved ? "HR Admin" : "-",
        budget: "150000",
        creator: item.department || "General",
      }));
      setJobs(mapped);
    } catch (err) {
      console.error("Failed to load jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter((j) => filter === "All" || j.status === filter);

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/[^0-9]/g, "");
    setNewJob({ ...newJob, budget: digitsOnly });
  };

  const handleCreateJob = async () => {
    if (!newJob.name.trim() || !newJob.tl.trim()) {
      alert("Please fill in Job Name and Team Lead.");
      return;
    }
    setActionLoading(true);
    try {
      await createJob({
        title: newJob.name,
        department: newJob.tl,
        description: newJob.description,
      });
      alert("Job created successfully! It is now pending HR approval.");
      setNewJob({ name: "", tl: "", description: "", budget: "" });
      setShowCreateForm(false);
      fetchJobs();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to create job.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteJob = async () => {
    if (!selectedId) return;
    if (!confirm("Are you sure you want to delete this job?")) return;
    setActionLoading(true);
    try {
      await deleteJob(selectedId);
      setSelectedId(null);
      fetchJobs();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to delete job.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">Recruiter</h1>
        <p className="text-slate-400 dark:text-slate-500 mt-1">
          Post jobs, track approval status, and manage openings.
        </p>
      </div>

      <Card title="Job Postings" subtitle="Create, filter, and review job openings.">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateForm((v) => !v)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700"
            >
              {showCreateForm ? "Cancel" : "Create Job"}
            </button>
            <button
              onClick={handleDeleteJob}
              disabled={!selectedId || actionLoading}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Delete Job
            </button>
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as "All" | JobStatus)}
            className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            <option value="All">All statuses</option>
            <option value="Approved">Approved</option>
            <option value="Not Approved">Not approved</option>
          </select>
        </div>

        {showCreateForm && (
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-5 grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900">
            <input
              placeholder="Job name"
              value={newJob.name}
              onChange={(e) => setNewJob({ ...newJob, name: e.target.value })}
              className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:text-slate-100"
            />
            <input
              placeholder="Team lead"
              value={newJob.tl}
              onChange={(e) => setNewJob({ ...newJob, tl: e.target.value })}
              className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:text-slate-100"
            />
            <input
              placeholder="Description"
              value={newJob.description}
              onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
              className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm col-span-2 bg-white dark:bg-slate-800 dark:text-slate-100"
            />
            <input
              placeholder="Budget"
              inputMode="numeric"
              value={newJob.budget}
              onChange={handleBudgetChange}
              className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:text-slate-100"
            />
            <button
              onClick={handleCreateJob}
              disabled={actionLoading}
              className="bg-blue-600 text-white text-sm font-semibold rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
            >
              {actionLoading ? "Adding..." : "Add Job"}
            </button>
          </div>
        )}

        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-left">
                <th className="px-4 py-3 font-semibold w-8"></th>
                <th className="px-4 py-3 font-semibold">Job Name</th>
                <th className="px-4 py-3 font-semibold">Team Lead</th>
                <th className="px-4 py-3 font-semibold">Description</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Details</th>
                <th className="px-4 py-3 font-semibold">Approved By</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                    Loading job postings...
                  </td>
                </tr>
              ) : filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                    No jobs match this filter.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
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
                      {job.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{job.tl}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-[200px] truncate">
                      {job.description || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDetailsJob(job)}
                        className="text-blue-600 dark:text-blue-400 text-xs font-semibold hover:underline"
                      >
                        View Details
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {job.approvedBy}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {detailsJob && <DetailsModal job={detailsJob} onClose={() => setDetailsJob(null)} />}
    </div>
  );
}
