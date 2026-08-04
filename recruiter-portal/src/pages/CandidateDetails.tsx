/**
 * Copyright (c) 2026 Uworx UK. All rights reserved.
 */

import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import Button from "../components/Button/Button";
import Card from "../components/Card/Card";
import CircularProgress from "../components/CircularProgress/CircularProgress";

import type { AnalyzeResponse, CandidateResult } from "../services/api";
import { downloadResume } from "../services/api";
import {
  ANALYSIS_STORAGE_KEY,
  THRESHOLDS_STORAGE_KEY,
  DEFAULT_THRESHOLDS,
} from "../lib/analysisStorage";
import type { Thresholds } from "../lib/analysisStorage";

function loadThresholds(state: unknown): Thresholds {
  if (state && typeof state === "object" && "thresholds" in state) {
    const stateThresholds = (state as { thresholds?: Thresholds }).thresholds;
    if (stateThresholds) return stateThresholds;
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

function loadAnalysisBucket(): string | null {
  const cached = sessionStorage.getItem(ANALYSIS_STORAGE_KEY);
  if (!cached) return null;

  try {
    return (JSON.parse(cached) as AnalyzeResponse).bucket ?? null;
  } catch {
    return null;
  }
}

function loadCandidate(
  state: unknown,
  filename: string | undefined
): { candidate: CandidateResult; bucket: string | null } | null {
  if (state && typeof state === "object" && "candidate" in state) {
    const stateBucket =
      "bucket" in state ? (state as { bucket?: string }).bucket ?? null : null;
    return {
      candidate: (state as { candidate: CandidateResult }).candidate,
      bucket: stateBucket ?? loadAnalysisBucket(),
    };
  }

  if (!filename) return null;

  const cached = sessionStorage.getItem(ANALYSIS_STORAGE_KEY);
  if (!cached) return null;

  try {
    const analysis = JSON.parse(cached) as AnalyzeResponse;
    const found = analysis.results.find((c) => c.filename === filename);
    return found ? { candidate: found, bucket: analysis.bucket } : null;
  } catch {
    return null;
  }
}

function CandidateDetails() {
  const { id } = useParams();
  const location = useLocation();

  const [downloading, setDownloading] = useState(false);

  const loaded = loadCandidate(location.state, id);
  const candidate = loaded?.candidate ?? null;
  const bucket = loaded?.bucket ?? null;
  const thresholds = loadThresholds(location.state);

  async function handleDownload(bucketName: string, filename: string) {
    setDownloading(true);
    try {
      const blob = await downloadResume(bucketName, filename);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename.split("/").pop() ?? filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Unable to download resume.");
    } finally {
      setDownloading(false);
    }
  }

  if (!candidate) {
    return (
      <div className="space-y-6 text-center">
        <h1 className="text-3xl font-bold">
          Candidate Not Found
        </h1>

        <Link to="/results">
          <Button>Back to Results</Button>
        </Link>
      </div>
    );
  }

  const { resume, ats } = candidate;

  const recommendation =
    ats.ats_score >= thresholds.interview
      ? "Interview Recommended"
      : ats.ats_score >= thresholds.consider
      ? "Consider"
      : "Reject";

  const recommendationColor =
    ats.ats_score >= thresholds.interview
      ? "bg-green-100 text-green-700"
      : ats.ats_score >= thresholds.consider
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-700";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            {resume.name || candidate.filename}
          </h1>

          <p className="mt-1 muted">
            Detailed ATS analysis for this candidate.
          </p>
        </div>

        <Link to="/results">
          <Button>← Back to Results</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="ATS Score">
          <div className="flex flex-col items-center gap-5">
            <CircularProgress score={ats.ats_score} />

            <span
              className={`rounded-full px-4 py-2 font-semibold ${recommendationColor}`}
            >
              {recommendation}
            </span>

          </div>
        </Card>

        <Card title="Candidate Information">
          <div className="space-y-3">
            <div>
              <strong>CGPA:</strong>
              <p className="text-lg">
                {resume.cgpa || "Not found"}
              </p>
            </div>

            <div>
              <strong>University:</strong>
              <p className="text-lg">
                {resume.university || "Not found"}
              </p>
            </div>

            <div>
              <strong>Experience:</strong>
              {resume.experience.length === 0 ? (
                <p className="text-lg">
                  Not found
                </p>
              ) : (
                <ul className="list-disc pl-5">
                  {resume.experience.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <strong>Certifications:</strong>
              {resume.certifications.length === 0 ? (
                <p>
                  Not found
                </p>
              ) : (
                <ul className="list-disc pl-5">
                  {resume.certifications.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Card>

        <Card title="Resume">
          <div className="flex flex-col gap-4 resume-content">
            <p className="resume-filename">
              Original file: {candidate.filename}
            </p>

            <Button
              className="w-full"
              disabled={!bucket || downloading}
              onClick={() => bucket && handleDownload(bucket, candidate.filename)}
            >
              {downloading ? "Downloading…" : "Download Resume"}
            </Button>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Matched Skills">
          {ats.matched_skills.length === 0 ? (
            <p className="muted">None detected.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {ats.matched_skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-green-100 px-4 py-2 text-lg font-medium text-green-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </Card>

        <Card title="Missing Skills">
          {ats.missing_skills.length === 0 ? (
            <p className="muted">None — great match.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {ats.missing_skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-red-100 px-4 py-2 text-lg font-medium text-red-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Strengths">
          {ats.strengths.length === 0 ? (
            <p className="muted">No strengths identified.</p>
          ) : (
            <ul className="list-disc space-y-2 pl-6 text-lg">
              {ats.strengths.map((strength) => (
                <li key={strength}>{strength}</li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Recommendations">
          {ats.recommendations.length === 0 ? (
            <p className="muted">No suggestions.</p>
          ) : (
            <ul className="list-disc space-y-2 pl-6 text-lg">
              {ats.recommendations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

export default CandidateDetails;