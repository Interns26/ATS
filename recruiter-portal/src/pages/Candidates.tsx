/**
 * Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.
 */

import { useEffect, useState, useMemo } from "react";
import {
  getAllCandidates,
  updateCandidate,
  exportCandidatesXlsx,
  deleteCandidate,
  type CandidateRecord,
} from "../services/api";

// ── Small reusable primitives ─────────────────────────────────────────────────

function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "green" | "yellow" | "red" | "blue" | "default";
}) {
  const cls: Record<string, string> = {
    green: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    red: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    default: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls[variant]}`}>
      {children}
    </span>
  );
}

function atsBadgeVariant(score: number | null): "green" | "yellow" | "red" | "default" {
  if (score === null || score === undefined) return "default";
  if (score >= 70) return "green";
  if (score >= 50) return "yellow";
  return "red";
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex flex-col gap-1">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{value}</p>
      {sub && <p className="text-xs text-slate-400 dark:text-slate-500">{sub}</p>}
    </div>
  );
}

// ── Edit Modal ─────────────────────────────────────────────────────────────────

type EditState = {
  email: string;
  first_name: string;
  last_name: string;
  city: string;
  state_province: string;
  mobile_number: string;
  how_heard: string;
};

function EditModal({
  candidate,
  onClose,
  onSaved,
}: {
  candidate: CandidateRecord;
  onClose: () => void;
  onSaved: (updated: CandidateRecord) => void;
}) {
  const [form, setForm] = useState<EditState>({
    email: candidate.email || "",
    first_name: candidate.first_name || "",
    last_name: candidate.last_name || "",
    city: candidate.city || "",
    state_province: candidate.state_province || "",
    mobile_number: candidate.mobile_number || "",
    how_heard: candidate.how_heard || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function field(label: string, key: keyof EditState, type = "text") {
    return (
      <div>
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
          {label}
        </label>
        <input
          type={type}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email.trim() || !form.first_name.trim() || !form.last_name.trim()) {
      setError("Email, First Name, and Last Name are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateCandidate(candidate.id, form);
      onSaved({ ...candidate, ...form });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Edit Candidate</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              ID: {candidate.id.slice(0, 8)}…
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {field("First Name", "first_name")}
            {field("Last Name", "last_name")}
          </div>
          {field("Email Address", "email", "email")}
          {field("Phone / Mobile Number", "mobile_number", "tel")}
          <div className="grid grid-cols-2 gap-4">
            {field("City", "city")}
            {field("State / Province", "state_province")}
          </div>
          {field("How Did They Hear", "how_heard")}

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Candidates() {
  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editTarget, setEditTarget] = useState<CandidateRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCandidates();
  }, []);

  async function loadCandidates() {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllCandidates();
      setCandidates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load candidates.");
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await exportCandidatesXlsx();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "candidates_export.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  }

  function handleSaved(updated: CandidateRecord) {
    setCandidates((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }

  async function handleDelete(candidate: CandidateRecord) {
    const fullName = `${candidate.first_name} ${candidate.last_name}`;
    if (
      !window.confirm(
        `Are you sure you want to permanently delete "${fullName}" and all their data?\n\nThis will remove their application, qualifications, work experience, and ATS analysis from the database.`
      )
    ) {
      return;
    }
    setDeletingId(candidate.id);
    try {
      await deleteCandidate(candidate.id);
      setCandidates((prev) => prev.filter((c) => c.id !== candidate.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete candidate.");
    } finally {
      setDeletingId(null);
    }
  }

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalAnalyzed = useMemo(
    () => candidates.filter((c) => c.ats_score !== null).length,
    [candidates]
  );
  const topScorer = useMemo(() => {
    const analyzed = candidates.filter((c) => c.ats_score !== null);
    if (!analyzed.length) return null;
    return analyzed.reduce((a, b) => ((a.ats_score ?? 0) > (b.ats_score ?? 0) ? a : b));
  }, [candidates]);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter((c) =>
      `${c.first_name} ${c.last_name} ${c.email} ${c.job_title || ""}`.toLowerCase().includes(q)
    );
  }, [candidates, search]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {editTarget && (
        <EditModal
          candidate={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleSaved}
        />
      )}

      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              Candidate Database
            </h1>
            <p className="text-slate-400 dark:text-slate-500 mt-1 text-sm">
              View, edit, and export all candidate information stored in the ATS.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={loadCandidates}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              {loading ? "Loading…" : "↺ Refresh"}
            </button>
            <button
              onClick={handleExport}
              disabled={exporting || candidates.length === 0}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              {exporting ? (
                "Exporting…"
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                  Export to Excel (.xlsx)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total Candidates" value={candidates.length} />
          <StatCard label="Applications" value={candidates.filter((c) => c.application_id).length} />
          <StatCard label="Analyzed" value={totalAnalyzed} sub="with ATS score" />
          <StatCard
            label="Top ATS Score"
            value={topScorer ? `${topScorer.ats_score}%` : "—"}
            sub={topScorer ? `${topScorer.first_name} ${topScorer.last_name}` : "No scores yet"}
          />
        </div>

        {/* Search + Table card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="relative flex-1 max-w-sm">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name, email, or job…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
              {filtered.length} of {candidates.length}
            </span>
          </div>

          {/* Error state */}
          {error && (
            <div className="p-6 text-center text-red-600 dark:text-red-400 text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Loading skeleton */}
          {loading && !error && (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
              Loading candidates…
            </div>
          )}

          {/* Table */}
          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-left text-xs uppercase tracking-wide">
                    <th className="px-4 py-3 font-semibold">#</th>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Phone</th>
                    <th className="px-4 py-3 font-semibold">City</th>
                    <th className="px-4 py-3 font-semibold">Applied For</th>
                    <th className="px-4 py-3 font-semibold">University</th>
                    <th className="px-4 py-3 font-semibold">CGPA</th>
                    <th className="px-4 py-3 font-semibold">ATS Score</th>
                    <th className="px-4 py-3 font-semibold">Applied On</th>
                    <th className="px-4 py-3 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={11}
                        className="px-4 py-10 text-center text-slate-400 dark:text-slate-500"
                      >
                        {search ? "No candidates match your search." : "No candidates found."}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c, idx) => (
                      <tr
                        key={c.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
                      >
                        <td className="px-4 py-3 text-slate-400 dark:text-slate-500 font-mono text-xs">
                          {idx + 1}
                        </td>

                        {/* Name */}
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-800 dark:text-slate-100">
                            {c.first_name} {c.last_name}
                          </span>
                        </td>

                        {/* Email */}
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-[180px] truncate">
                          {c.email}
                        </td>

                        {/* Phone */}
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {c.mobile_number || <span className="text-slate-300 dark:text-slate-600">—</span>}
                        </td>

                        {/* City */}
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {c.city
                            ? `${c.city}${c.state_province ? `, ${c.state_province}` : ""}`
                            : <span className="text-slate-300 dark:text-slate-600">—</span>}
                        </td>

                        {/* Applied For */}
                        <td className="px-4 py-3">
                          {c.job_title ? (
                            <Badge variant="blue">{c.job_title}</Badge>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">—</span>
                          )}
                        </td>

                        {/* University */}
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-[160px] truncate">
                          {c.university || <span className="text-slate-300 dark:text-slate-600">—</span>}
                        </td>

                        {/* CGPA */}
                        <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                          {c.cgpa || <span className="text-slate-300 dark:text-slate-600">—</span>}
                        </td>

                        {/* ATS Score */}
                        <td className="px-4 py-3">
                          {c.ats_score !== null && c.ats_score !== undefined ? (
                            <Badge variant={atsBadgeVariant(c.ats_score)}>
                              {c.ats_score}%
                            </Badge>
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                              Not analyzed
                            </span>
                          )}
                        </td>

                        {/* Applied On */}
                        <td className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500">
                          {c.submitted_at
                            ? new Date(c.submitted_at).toLocaleDateString()
                            : <span className="text-slate-300 dark:text-slate-600">—</span>}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setEditTarget(c)}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDelete(c)}
                              disabled={deletingId === c.id}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 disabled:opacity-50 transition"
                            >
                              {deletingId === c.id ? "…" : "🗑️ Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Export hint */}
        {!loading && candidates.length > 0 && (
          <p className="text-xs text-slate-400 dark:text-slate-500 text-right">
            The exported .xlsx file is formatted like a Google Forms response sheet and can be
            opened directly in Google Sheets.
          </p>
        )}
      </div>
    </>
  );
}
