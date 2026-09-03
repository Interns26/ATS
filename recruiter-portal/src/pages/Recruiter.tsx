/**
 * Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.
 */

import { useEffect, useState } from "react";
import {
  getAllJobs,
  createJob,
  deleteJob,
  updateJob,
  getTeamLeads,
  getMyJobComments,
  type TeamLead,
  type JobComment,
} from "../services/api";

type JobStatus = "Approved" | "Not Approved";

type Job = {
  id: string;
  name: string;
  tl: string;
  description: string;
  numPositions: number;
  location: string[];
  employmentType: string;
  closingDate: string | null;
  responsibilities?: string[];
  requirements?: string[];
  status: JobStatus;
  approvedBy: string;
  creator: string;
};

const LOCATIONS = [
  "Coventry, England",
  "Lahore, Pakistan",
  "Faisalabad, Pakistan",
  "Remote",
];

const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Temporary",
];

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
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
          {title}
        </h2>
      )}

      {subtitle && (
        <p className="text-slate-400 dark:text-slate-500 text-sm mb-5">
          {subtitle}
        </p>
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

function DetailsModal({
  job,
  onClose,
}: {
  job: Job;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {job.name}
          </h2>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <p className="text-slate-400 dark:text-slate-500 mb-1">
              Team Lead
            </p>

            <p className="font-semibold text-slate-800 dark:text-slate-100">
              {job.tl}
            </p>
          </div>

          <div>
            <p className="text-slate-400 dark:text-slate-500 mb-1">
              Number of Positions
            </p>

            <p className="font-semibold text-slate-800 dark:text-slate-100">
              {job.numPositions}
            </p>
          </div>

          <div>
            <p className="text-slate-400 dark:text-slate-500 mb-1">
              Location
            </p>

            <p className="font-semibold text-slate-800 dark:text-slate-100">
              {job.location && job.location.length > 0
                ? job.location.join(", ")
                : "-"}
            </p>
          </div>

          <div>
            <p className="text-slate-400 dark:text-slate-500 mb-1">
              Employment Type
            </p>

            <p className="font-semibold text-slate-800 dark:text-slate-100">
              {job.employmentType || "-"}
            </p>
          </div>

          <div>
            <p className="text-slate-400 dark:text-slate-500 mb-1">
              Closing Date
            </p>

            <p className="font-semibold text-slate-800 dark:text-slate-100">
              {job.closingDate || "-"}
            </p>
          </div>

          <div>
            <p className="text-slate-400 dark:text-slate-500 mb-1 font-semibold">
              Summary
            </p>

            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              {job.description || "-"}
            </p>
          </div>

          {job.responsibilities &&
            job.responsibilities.length > 0 && (
              <div>
                <p className="text-slate-400 dark:text-slate-500 mb-1 font-semibold">
                  Responsibilities
                </p>

                <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-1">
                  {job.responsibilities.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

          {job.requirements &&
            job.requirements.length > 0 && (
              <div>
                <p className="text-slate-400 dark:text-slate-500 mb-1 font-semibold">
                  Requirements
                </p>

                <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-1">
                  {job.requirements.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

          <div>
            <p className="text-slate-400 dark:text-slate-500 mb-1">
              Status
            </p>

            <StatusBadge status={job.status} />
          </div>

          <div>
            <p className="text-slate-400 dark:text-slate-500 mb-1">
              Approved By
            </p>

            <p className="font-semibold text-slate-800 dark:text-slate-100">
              {job.approvedBy}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditModal({
  job,
  teamLeads,
  onClose,
  onSave,
}: {
  job: Job;
  teamLeads: TeamLead[];
  onClose: () => void;
  onSave: (updated: {
    id: string;
    name: string;
    tl: string;
    description: string;
    responsibilities: string[];
    requirements: string[];
    numPositions: number;
    location: string[];
    employmentType: string;
    closingDate: string | null;
  }) => Promise<void>;
}) {
  const [name, setName] = useState(job.name);

  const [tl, setTl] = useState(
    job.tl || (teamLeads[0]?.name ?? "General")
  );

  const [description, setDescription] = useState(job.description);

  const [numPositions, setNumPositions] = useState(
    job.numPositions || 1
  );

  const [location, setLocation] = useState(
    job.location?.[0] || LOCATIONS[0]
  );

  const [employmentType, setEmploymentType] = useState(
    job.employmentType || "Full-time"
  );

  const [closingDate, setClosingDate] = useState(
    job.closingDate || ""
  );

  const [responsibilitiesText, setResponsibilitiesText] =
    useState((job.responsibilities || []).join("\n"));

  const [requirementsText, setRequirementsText] =
    useState((job.requirements || []).join("\n"));

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !name.trim() ||
      !tl.trim() ||
      !location ||
      !employmentType ||
      !closingDate
    ) {
      alert(
        "Please fill in Job Name, select a Team Lead, Location, Employment Type, and Closing Date."
      );
      return;
    }

    setSaving(true);

    try {
      const respList = responsibilitiesText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const reqList = requirementsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      await onSave({
        id: job.id,
        name,
        tl,
        description,
        numPositions,
        responsibilities: respList,
        requirements: reqList,
        location: [location],
        employmentType,
        closingDate: closingDate || null,
      });

      onClose();
    } catch (err) {
      console.error(err);

      alert(
        err instanceof Error
          ? err.message
          : "Failed to update job."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Edit Job Details
          </h2>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 text-sm"
        >
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">
              Job Name
            </label>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 dark:text-slate-100"
              required
            />
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">
              Team Lead
            </label>

            <select
              value={tl}
              onChange={(e) => setTl(e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 dark:text-slate-100"
              required
            >
              {teamLeads.length === 0 ? (
                <option value={tl}>{tl}</option>
              ) : (
                teamLeads.map((lead) => (
                  <option
                    key={lead.id}
                    value={lead.name}
                  >
                    {lead.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">
              Number of Positions
            </label>

            <input
              type="number"
              min={1}
              value={numPositions === 0 ? "" : numPositions}
              onChange={(e) => {
                const val = e.target.value;

                if (val === "") {
                  setNumPositions(0);
                } else {
                  setNumPositions(
                    Math.max(1, Number(val))
                  );
                }
              }}
              onBlur={() => {
                if (numPositions === 0) {
                  setNumPositions(1);
                }
              }}
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 dark:text-slate-100"
              required
            />
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">
              Location
            </label>

            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 dark:text-slate-100"
              required
            >
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">
              Employment Type
            </label>

            <select
              value={employmentType}
              onChange={(e) =>
                setEmploymentType(e.target.value)
              }
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 dark:text-slate-100"
              required
            >
              <option value="" disabled>
                Select Employment Type
              </option>

              {EMPLOYMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">
              Closing Date
            </label>

            <input
              type="date"
              value={closingDate}
              onChange={(e) =>
                setClosingDate(e.target.value)
              }
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 dark:text-slate-100"
              required
            />
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">
              Job Summary
            </label>

            <textarea
              rows={3}
              placeholder="Overview / Summary of the role"
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">
              Responsibilities (one per line)
            </label>

            <textarea
              rows={4}
              placeholder={
                "e.g. Design ML models\nBuild data pipelines"
              }
              value={responsibilitiesText}
              onChange={(e) =>
                setResponsibilitiesText(e.target.value)
              }
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 dark:text-slate-100 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">
              Requirements (one per line)
            </label>

            <textarea
              rows={4}
              placeholder={
                "e.g. 3+ years experience in Python\nFamiliarity with PostgreSQL"
              }
              value={requirementsText}
              onChange={(e) =>
                setRequirementsText(e.target.value)
              }
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 dark:text-slate-100 font-mono text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-sm"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Recruiter() {
  const [jobs, setJobs] = useState<Job[]>([]);

  const [myJobComments, setMyJobComments] =
    useState<JobComment[]>([]);

  const [commentsLoading, setCommentsLoading] =
    useState(true);

  const [teamLeads, setTeamLeads] =
    useState<TeamLead[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [filter, setFilter] =
    useState<"All" | JobStatus>("All");

  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [newJob, setNewJob] = useState({
    name: "",
    tl: "",
    summary: "",
    responsibilities: "",
    requirements: "",
    numPositions: 1,
    location: "",
    employmentType: "",
    closingDate: "",
  });

  const [detailsJob, setDetailsJob] =
    useState<Job | null>(null);

  const [editJob, setEditJob] =
    useState<Job | null>(null);

  const [actionLoading, setActionLoading] =
    useState(false);

  const fetchJobs = async () => {
    setLoading(true);

    try {
      const data = await getAllJobs();

      const mapped: Job[] = data.map(
        (item) => ({
          id: item.id,
          name: item.title,
          tl: item.department || "General",
          description: item.description || "",
          numPositions:
            item.num_positions ?? 1,

          location: item.location
            ? Array.isArray(item.location)
              ? item.location
              : [item.location]
            : [],

          employmentType:
            item.employment_type ||
            "Full-time",

          closingDate:
            item.closing_date || null,

          responsibilities:
            Array.isArray(
              item.responsibilities
            )
              ? item.responsibilities
              : typeof item.responsibilities ===
                "string"
              ? JSON.parse(
                  item.responsibilities
                )
              : [],

          requirements:
            Array.isArray(
              item.requirements
            )
              ? item.requirements
              : typeof item.requirements ===
                "string"
              ? JSON.parse(
                  item.requirements
                )
              : [],

          status: item.is_approved
            ? "Approved"
            : "Not Approved",

          approvedBy: item.is_approved
            ? "HR Admin"
            : "-",

          creator:
            item.department || "General",
        })
      );

      setJobs(mapped);
    } catch (err) {
      console.error(
        "Failed to load jobs:",
        err
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * Load reviews/comments assigned to
   * the currently logged-in recruiter.
   */
  const fetchMyJobComments = async () => {
    setCommentsLoading(true);

    try {
      const data = await getMyJobComments();
      setMyJobComments(data);
    } catch (err) {
      console.error(
        "Failed to load assigned job reviews:",
        err
      );
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchMyJobComments();

    getTeamLeads()
      .then((leads) => {
        setTeamLeads(leads);

        if (leads.length > 0) {
          setNewJob((prev) => ({
            ...prev,
            tl:
              prev.tl ||
              leads[0].name,
          }));
        }
      })
      .catch((err) =>
        console.error(
          "Failed to load team leads:",
          err
        )
      );
  }, []);

  const filteredJobs = jobs.filter(
    (j) =>
      filter === "All" ||
      j.status === filter
  );

  const handleCreateJob = async () => {
    if (
      !newJob.name.trim() ||
      !newJob.tl.trim() ||
      !newJob.location ||
      !newJob.employmentType ||
      !newJob.closingDate
    ) {
      alert(
        "Please fill in Job Name, select a Team Lead, Location, Employment Type, and Closing Date."
      );
      return;
    }

    setActionLoading(true);

    try {
      const respList =
        newJob.responsibilities
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);

      const reqList =
        newJob.requirements
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);

      await createJob({
        title: newJob.name,
        department: newJob.tl,
        description: newJob.summary,
        num_positions:
          newJob.numPositions,
        location: newJob.location,
        responsibilities: respList,
        requirements: reqList,
        employment_type:
          newJob.employmentType,
        closing_date:
          newJob.closingDate,
      });

      alert(
        "Job created successfully! It is now pending HR approval."
      );

      setNewJob({
        name: "",
        tl:
          teamLeads[0]?.name ??
          "General",
        summary: "",
        responsibilities: "",
        requirements: "",
        numPositions: 1,
        location: "",
        employmentType: "",
        closingDate: "",
      });

      setShowCreateForm(false);

      fetchJobs();
    } catch (err) {
      console.error(err);

      alert(
        err instanceof Error
          ? err.message
          : "Failed to create job."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateJob = async (updated: {
    id: string;
    name: string;
    tl: string;
    description: string;
    responsibilities: string[];
    requirements: string[];
    numPositions: number;
    location: string[];
    employmentType: string;
    closingDate: string | null;
  }) => {
    await updateJob(updated.id, {
      title: updated.name,
      department: updated.tl,
      description: updated.description,
      num_positions:
        updated.numPositions,
      responsibilities:
        updated.responsibilities,
      requirements:
        updated.requirements,
      location:
        updated.location.join(", "),
      employment_type:
        updated.employmentType,
      closing_date:
        updated.closingDate,
    });

    alert(
      "Job updated successfully!"
    );

    fetchJobs();
  };

  const handleDeleteJob = async () => {
    if (!selectedId) return;

    if (
      !confirm(
        "Are you sure you want to delete this job?"
      )
    ) {
      return;
    }

    setActionLoading(true);

    try {
      await deleteJob(selectedId);

      setSelectedId(null);

      fetchJobs();
    } catch (err) {
      console.error(err);

      alert(
        err instanceof Error
          ? err.message
          : "Failed to delete job."
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
          Recruiter Portal
        </h1>

        <p className="text-slate-400 dark:text-slate-500 mt-1">
          Post jobs, track approval status,
          and manage team lead openings.
        </p>
      </div>
      {/* JOB REVIEWS / SENT BACK COMMENTS */}
      <Card
        title="Job Reviews"
        subtitle="Reviews and feedback sent to you by the Department Head."
      >
        {commentsLoading ? (
          <div className="py-6 text-center text-slate-400 dark:text-slate-500">
            Loading reviews...
          </div>
        ) : myJobComments.length === 0 ? (
          <div className="py-6 text-center text-slate-400 dark:text-slate-500">
            No job reviews have been assigned to you.
          </div>
        ) : (
          <div className="space-y-4">
            {myJobComments.map((review) => (
              <div
                key={review.id}
                className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-900"
              >
                {/* Review Header */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                      {review.job_title || review.job_id}
                    </h3>

                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Reviewed by:{" "}
                      {review.reviewer_role
                        .replace("_", " ")
                        .replace(/\b\w/g, (char) =>
                          char.toUpperCase()
                        )}
                    </p>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      review.action === "sent_back"
                        ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    }`}
                  >
                    {review.action === "sent_back"
                      ? "Sent Back"
                      : review.action}
                  </span>
                </div>

                {/* Comment */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Feedback
                  </p>

                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {review.comment || "No comment provided."}
                  </p>
                </div>

                {/* Date */}
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
                  {new Date(
                    review.created_at
                  ).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
      
      <Card
        title="Job Postings"
        subtitle="Create, filter, and review job openings."
      >

        {/* Top Buttons */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div className="flex items-center gap-3">

            <button
              onClick={() =>
                setShowCreateForm(
                  (v) => !v
                )
              }
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700"
            >
              {showCreateForm
                ? "Cancel"
                : "Create Job"}
            </button>

            <button
              onClick={() => {
                const j = jobs.find(
                  (item) =>
                    item.id ===
                    selectedId
                );

                if (j) setEditJob(j);
              }}
              disabled={
                !selectedId ||
                actionLoading
              }
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Edit Job
            </button>

            <button
              onClick={
                handleDeleteJob
              }
              disabled={
                !selectedId ||
                actionLoading
              }
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Delete Job
            </button>
          </div>

          {/* Status Filter */}
          <select
            value={filter}
            onChange={(e) =>
              setFilter(
                e.target.value as
                  | "All"
                  | JobStatus
              )
            }
            className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            <option value="All">
              All statuses
            </option>

            <option value="Approved">
              Approved
            </option>

            <option value="Not Approved">
              Not approved
            </option>
          </select>
        </div>

        {/* CREATE JOB FORM */}
        {showCreateForm && (
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-5 space-y-3 bg-slate-50 dark:bg-slate-900">

            <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
              Add New Job Opening
            </h3>

            {/* Job Name + Team Lead */}
            <div className="grid grid-cols-2 gap-3">

              <input
                placeholder="Job name"
                value={newJob.name}
                onChange={(e) =>
                  setNewJob({
                    ...newJob,
                    name: e.target.value,
                  })
                }
                className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:text-slate-100"
              />

              <select
                value={newJob.tl}
                onChange={(e) =>
                  setNewJob({
                    ...newJob,
                    tl: e.target.value,
                  })
                }
                className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:text-slate-100 font-medium"
              >
                {teamLeads.length ===
                0 ? (
                  <option value="">
                    Loading Team Leads...
                  </option>
                ) : (
                  teamLeads.map(
                    (lead) => (
                      <option
                        key={lead.id}
                        value={
                          lead.name
                        }
                      >
                        Team Lead:{" "}
                        {lead.name}
                      </option>
                    )
                  )
                )}
              </select>
            </div>

            {/* Number of Positions */}
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Number of Positions
              </label>

              <input
                type="number"
                min={1}
                value={
                  newJob.numPositions ===
                  0
                    ? ""
                    : newJob.numPositions
                }
                onChange={(e) => {
                  const val =
                    e.target.value;

                  if (val === "") {
                    setNewJob({
                      ...newJob,
                      numPositions: 0,
                    });
                  } else {
                    setNewJob({
                      ...newJob,
                      numPositions:
                        Math.max(
                          1,
                          Number(val)
                        ),
                    });
                  }
                }}
                onBlur={() => {
                  if (
                    newJob.numPositions ===
                    0
                  ) {
                    setNewJob({
                      ...newJob,
                      numPositions: 1,
                    });
                  }
                }}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Location
              </label>

              <select
                value={
                  newJob.location
                }
                onChange={(e) =>
                  setNewJob({
                    ...newJob,
                    location:
                      e.target.value,
                  })
                }
                className={`w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 ${
                  newJob.location
                    ? "text-slate-900 dark:text-slate-100"
                    : "text-slate-400 dark:text-slate-500"
                }`}
                required
              >
                <option
                  value=""
                  disabled
                >
                  Select Office Location
                </option>

                {LOCATIONS.map(
                  (loc) => (
                    <option
                      key={loc}
                      value={loc}
                      className="text-slate-900 dark:text-slate-100"
                    >
                      {loc}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Employment Type + Closing Date */}
            <div className="grid grid-cols-2 gap-3">

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Employment Type
                </label>

                <select
                  value={
                    newJob.employmentType
                  }
                  onChange={(e) =>
                    setNewJob({
                      ...newJob,
                      employmentType:
                        e.target.value,
                    })
                  }
                  className={`w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 ${
                    newJob.employmentType
                      ? "text-slate-900 dark:text-slate-100"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                  required
                >
                  <option
                    value=""
                    disabled
                  >
                    Select Employment Type
                  </option>

                  {EMPLOYMENT_TYPES.map(
                    (type) => (
                      <option
                        key={type}
                        value={type}
                        className="text-slate-900 dark:text-slate-100"
                      >
                        {type}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Closing Date
                </label>

                <input
                  type="date"
                  value={
                    newJob.closingDate
                  }
                  onChange={(e) =>
                    setNewJob({
                      ...newJob,
                      closingDate:
                        e.target.value,
                    })
                  }
                  min={
                    new Date()
                      .toISOString()
                      .split("T")[0]
                  }
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>
            </div>

            {/* Job Summary */}
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Box 1: Job Summary
              </label>

              <textarea
                placeholder="Role summary / overview..."
                rows={2}
                value={newJob.summary}
                onChange={(e) =>
                  setNewJob({
                    ...newJob,
                    summary:
                      e.target.value,
                  })
                }
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Responsibilities */}
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Box 2: Responsibilities
                (one item per line)
              </label>

              <textarea
                placeholder={
                  "Key responsibility 1\nKey responsibility 2"
                }
                rows={3}
                value={
                  newJob.responsibilities
                }
                onChange={(e) =>
                  setNewJob({
                    ...newJob,
                    responsibilities:
                      e.target.value,
                  })
                }
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Requirements */}
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Box 3: Requirements
                (one item per line)
              </label>

              <textarea
                placeholder={
                  "Required skill 1\nRequired skill 2"
                }
                rows={3}
                value={
                  newJob.requirements
                }
                onChange={(e) =>
                  setNewJob({
                    ...newJob,
                    requirements:
                      e.target.value,
                  })
                }
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Add Job Button */}
            <button
              onClick={
                handleCreateJob
              }
              disabled={actionLoading}
              className="w-full bg-blue-600 text-white text-sm font-semibold rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
            >
              {actionLoading
                ? "Adding..."
                : "Add Job"}
            </button>
          </div>
        )}

        {/* JOB TABLE */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">

            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-left">

                <th className="px-4 py-3 font-semibold w-8"></th>

                <th className="px-4 py-3 font-semibold">
                  Job Name
                </th>

                <th className="px-4 py-3 font-semibold">
                  Team Lead
                </th>

                <th className="px-4 py-3 font-semibold">
                  Positions
                </th>

                <th className="px-4 py-3 font-semibold">
                  Location
                </th>

                <th className="px-4 py-3 font-semibold">
                  Employment Type
                </th>

                <th className="px-4 py-3 font-semibold">
                  Closing Date
                </th>

                <th className="px-4 py-3 font-semibold">
                  Description
                </th>

                <th className="px-4 py-3 font-semibold">
                  Status
                </th>

                <th className="px-4 py-3 font-semibold">
                  Details
                </th>

                <th className="px-4 py-3 font-semibold">
                  Approved By
                </th>

              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td
                    colSpan={11}
                    className="px-4 py-8 text-center text-slate-400 dark:text-slate-500"
                  >
                    Loading job postings...
                  </td>
                </tr>
              ) : filteredJobs.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="px-4 py-8 text-center text-slate-400 dark:text-slate-500"
                  >
                    No jobs match this
                    filter.
                  </td>
                </tr>
              ) : (
                filteredJobs.map(
                  (job) => (
                    <tr
                      key={job.id}
                      className={`border-t border-slate-100 dark:border-slate-700 ${
                        selectedId ===
                        job.id
                          ? "bg-blue-50 dark:bg-blue-950"
                          : ""
                      }`}
                    >

                      {/* Select */}
                      <td className="px-4 py-3">
                        <input
                          type="radio"
                          name="selectedJob"
                          checked={
                            selectedId ===
                            job.id
                          }
                          onChange={() =>
                            setSelectedId(
                              job.id
                            )
                          }
                        />
                      </td>

                      {/* Job Name */}
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">
                        {job.name}
                      </td>

                      {/* Team Lead */}
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {job.tl}
                      </td>

                      {/* Positions */}
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {job.numPositions}
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {job.location &&
                        job.location.length >
                          0
                          ? job.location.join(
                              ", "
                            )
                          : "-"}
                      </td>

                      {/* Employment Type */}
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {job.employmentType ||
                          "-"}
                      </td>

                      {/* Closing Date */}
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {job.closingDate ||
                          "-"}
                      </td>

                      {/* Description */}
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-[200px] truncate">
                        {job.description ||
                          "-"}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusBadge
                          status={
                            job.status
                          }
                        />
                      </td>

                      {/* Details */}
                      <td className="px-4 py-3 space-x-2 whitespace-nowrap">

                        <button
                          onClick={() =>
                            setDetailsJob(
                              job
                            )
                          }
                          className="text-blue-600 dark:text-blue-400 text-xs font-semibold hover:underline"
                        >
                          View Details
                        </button>

                        <button
                          onClick={() =>
                            setEditJob(
                              job
                            )
                          }
                          className="text-slate-600 dark:text-slate-400 text-xs font-semibold hover:underline"
                        >
                          Edit
                        </button>

                      </td>

                      {/* Approved By */}
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {job.approvedBy}
                      </td>

                    </tr>
                  )
                )
              )}

            </tbody>
          </table>
        </div>
      </Card>

      {/* Details Modal */}
      {detailsJob && (
        <DetailsModal
          job={detailsJob}
          onClose={() =>
            setDetailsJob(null)
          }
        />
      )}

      {/* Edit Modal */}
      {editJob && (
        <EditModal
          job={editJob}
          teamLeads={teamLeads}
          onClose={() =>
            setEditJob(null)
          }
          onSave={handleUpdateJob}
        />
      )}
    </div>
  );
}