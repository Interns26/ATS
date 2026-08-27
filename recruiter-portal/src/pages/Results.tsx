/**
 * Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.
 */

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import Card from "../components/Card/Card";
import Button from "../components/Button/Button";

import { sendBatchEmails, type AnalyzeResponse, type CandidateResult } from "../services/api";
import {
  ANALYSIS_STORAGE_KEY,
  THRESHOLDS_STORAGE_KEY,
  DEFAULT_THRESHOLDS,
} from "../lib/analysisStorage";
import type { Thresholds } from "../lib/analysisStorage";

function statusFor(score: number, thresholds: Thresholds) {
  if (score >= thresholds.interview) return "Interview";
  if (score >= thresholds.consider) return "Consider";
  return "Reject";
}

function candidateName(candidate: CandidateResult) {
  return candidate.resume.name || candidate.filename;
}



function loadAnalysis(state: unknown): AnalyzeResponse | null {
  if (state && typeof state === "object" && "analysis" in state) {
    return (state as { analysis: AnalyzeResponse }).analysis;
  }

  const cached = sessionStorage.getItem(ANALYSIS_STORAGE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached) as AnalyzeResponse;
    } catch {
      return null;
    }
  }

  return null;
}

function loadThresholds(state: unknown): Thresholds {
  if (state && typeof state === "object" && "thresholds" in state) {
    return (state as { thresholds: Thresholds }).thresholds;
  }

  const cached = sessionStorage.getItem(THRESHOLDS_STORAGE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached) as Thresholds;
    } catch {
      return DEFAULT_THRESHOLDS;
    }
  }

  return DEFAULT_THRESHOLDS;
}

function EmailModal({
  selectedCount,
  onClose,
  onSend,
}: {
  selectedCount: number;
  onClose: () => void;
  onSend: (subject: string, body: string) => Promise<void>;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      setError("Please fill in both subject and body.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      await onSend(subject, body);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send emails.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Compose Email
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Sending to {selectedCount} selected candidate{selectedCount !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl leading-none text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-500 dark:text-slate-400">
              Subject
            </label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Interview Invitation"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-500 dark:text-slate-400">
              Message Body
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your message here..."
              rows={6}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send Email"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Results() {
  const location = useLocation();
  const navigate = useNavigate();

  const analysis = loadAnalysis(location.state);
  const thresholds = loadThresholds(location.state);

  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [showEmailModal, setShowEmailModal] = useState(false);

  if (!analysis || analysis.results.length === 0) {
    return (
      <div className="space-y-6 text-center">
        <h1 className="text-3xl font-bold">No Analysis Yet</h1>

        <p className="muted">
          Connect a resume bucket and run an analysis from the home page
          first.
        </p>

        <Link to="/">
          <Button>Go to Home</Button>
        </Link>
      </div>
    );
  }

  const candidates = analysis.results;
  const bucket = analysis.bucket;

  const counts = candidates.reduce(
    (acc, candidate) => {
      const status = statusFor(candidate.ats.ats_score, thresholds);
      acc[status] += 1;
      return acc;
    },
    { Interview: 0, Consider: 0, Reject: 0 } as Record<string, number>
  );

  function viewCandidate(candidate: CandidateResult) {
    navigate(`/candidate/${encodeURIComponent(candidate.filename)}`, {
      state: { candidate, bucket, thresholds },
    });
  }

  function handleSelectAllInterview() {
    const interviewEmails = candidates
      .filter((c) => statusFor(c.ats.ats_score, thresholds) === "Interview" && c.email)
      .map((c) => c.email as string);
    setSelectedEmails(interviewEmails);
  }

  function toggleEmailSelection(email?: string) {
    if (!email) return;
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  }

  async function handleSendBatchEmails(subject: string, body: string) {
    try {
      const res = await sendBatchEmails(selectedEmails, subject, body);
      alert(res.message);
      setSelectedEmails([]);
    } catch (error) {
      throw error;
    }
  }

  return (
    <>
      {showEmailModal && (
        <EmailModal
          selectedCount={selectedEmails.length}
          onClose={() => setShowEmailModal(false)}
          onSend={handleSendBatchEmails}
        />
      )}
      <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          ATS Analysis Results
        </h1>

        <p className="muted">
          Ranked candidates for bucket "{analysis.bucket}" based on ATS
          score. Interview ≥ {thresholds.interview}, Consider ≥{" "}
          {thresholds.consider}.
        </p>

        {analysis.failed.length > 0 && (
          <p className="mt-2 text-sm text-amber-600">
            {analysis.failed.length} resume(s) could not be analyzed and
            were skipped.
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            onClick={handleSelectAllInterview}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Select "Interview" Candidates
          </button>
          <button
            onClick={() => setShowEmailModal(true)}
            disabled={selectedEmails.length === 0}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Email Selected ({selectedEmails.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card title="Candidates">
          <h2 className="text-3xl font-bold">{candidates.length}</h2>
        </Card>

        <Card title="Interview">
          <h2 className="text-3xl font-bold text-green-600">
            {counts.Interview}
          </h2>
        </Card>

        <Card title="Consider">
          <h2 className="text-3xl font-bold text-yellow-300">
            {counts.Consider}
          </h2>
        </Card>

        <Card title="Reject">
          <h2 className="text-3xl font-bold text-red-500">
            {counts.Reject}
          </h2>
        </Card>
      </div>

      <Card title="Candidate Rankings">
          <div className="overflow-x-auto table-wrap">
            <table className="min-w-full">
            <thead>
              <tr className="border-b table-header">
                <th className="p-3 text-left w-12">
                  <span className="sr-only">Select</span>
                </th>
                <th className="p-3 text-left">Rank</th>
                <th className="p-3 text-left">Candidate</th>
                <th className="p-3 text-left">ATS Score</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {candidates.map((candidate, index) => {
                const status = statusFor(candidate.ats.ats_score, thresholds);

                return (
                  <tr
                    key={candidate.filename}
                    className={`border-b table-row ${
                      candidate.email && selectedEmails.includes(candidate.email)
                        ? "bg-blue-50/50 dark:bg-blue-900/20"
                        : ""
                    }`}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={!!(candidate.email && selectedEmails.includes(candidate.email))}
                        onChange={() => toggleEmailSelection(candidate.email)}
                        disabled={!candidate.email}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="p-3">{index + 1}</td>

                    <td className="p-3">
                      {candidateName(candidate)}
                      {candidate.email && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {candidate.email}
                        </div>
                      )}
                    </td>

                    <td className="p-3 font-semibold">
                      {candidate.ats.ats_score}
                    </td>

                    <td className="p-3">
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-medium ${
                          status === "Interview"
                            ? "bg-green-100 text-green-700"
                            : status === "Consider"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {status}
                      </span>
                    </td>

                    <td className="p-3 text-center">
                      <Button onClick={() => viewCandidate(candidate)}>
                        View Details
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
    </>
  );
}

export default Results;