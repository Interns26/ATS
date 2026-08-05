/**
 * Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.
 */

import { Link, useLocation, useNavigate } from "react-router-dom";

import Card from "../components/Card/Card";
import Button from "../components/Button/Button";

import type { AnalyzeResponse, CandidateResult } from "../services/api";
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

function Results() {
  const location = useLocation();
  const navigate = useNavigate();

  const analysis = loadAnalysis(location.state);
  const thresholds = loadThresholds(location.state);

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



  return (
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
                    className="border-b table-row"
                  >
                    <td className="p-3">{index + 1}</td>

                    <td className="p-3">{candidateName(candidate)}</td>

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
  );
}

export default Results;