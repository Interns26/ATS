import { Link, useLocation, useNavigate } from "react-router-dom";

import Card from "../components/Card/Card";
import Button from "../components/Button/Button";

import type { AnalyzeResponse, CandidateResult } from "../services/api";
import { ANALYSIS_STORAGE_KEY } from "./Home";

const INTERVIEW_THRESHOLD = 85;
const CONSIDER_THRESHOLD = 70;

function statusFor(score: number) {
  if (score >= INTERVIEW_THRESHOLD) return "Interview";
  if (score >= CONSIDER_THRESHOLD) return "Consider";
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

function Results() {
  const location = useLocation();
  const navigate = useNavigate();

  const analysis = loadAnalysis(location.state);

  if (!analysis || analysis.results.length === 0) {
    return (
      <div className="space-y-6 text-center">
        <h1 className="text-3xl font-bold">No Analysis Yet</h1>

        <p className="text-slate-600 dark:text-slate-300">
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
      const status = statusFor(candidate.ats.ats_score);
      acc[status] += 1;
      return acc;
    },
    { Interview: 0, Consider: 0, Reject: 0 } as Record<string, number>
  );

  function viewCandidate(candidate: CandidateResult) {
    navigate(`/candidate/${encodeURIComponent(candidate.filename)}`, {
      state: { candidate, bucket },
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          ATS Analysis Results
        </h1>

        <p className="text-slate-600 dark:text-slate-300">
          Ranked candidates for bucket "{analysis.bucket}" based on ATS
          score.
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
          <h2 className="text-3xl font-bold text-yellow-500">
            {counts.Consider}
          </h2>
        </Card>

        <Card title="Reject">
          <h2 className="text-3xl font-bold text-red-600">
            {counts.Reject}
          </h2>
        </Card>
      </div>

      <Card title="Candidate Rankings">
        <div className="overflow-x-auto">
          <table className="min-w-full text-slate-900 dark:text-slate-100">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-700">
                <th className="p-3 text-left">Rank</th>
                <th className="p-3 text-left">Candidate</th>
                <th className="p-3 text-left">ATS Score</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {candidates.map((candidate, index) => {
                const status = statusFor(candidate.ats.ats_score);

                return (
                  <tr
                    key={candidate.filename}
                    className="border-b border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
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
