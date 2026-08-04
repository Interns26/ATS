/**
 * Copyright (c) 2026 Coworx UK. All rights reserved.
 */

import { getToken, clearToken } from "../lib/auth";

export const API_URL = "http://localhost:8000";

export type MatchedSection = {
  job_requirement: string;
  resume_evidence: string;
};

export type LoadedResume = {
  filename: string;
  size: number;
  last_modified: string;
  candidate_name?: string;
  email?: string;
  university?: string;
  cgpa?: number | null;
  download_url?: string;
};

export type ParsedResume = {

  id: string | null;
  name: string | null;
  cgpa: string | null;
  university: string | null;
  projects: string[];
  skills: string[];
  experience: string[];
  certifications: string[];
};

export type ATSResult = {
  ats_score: number;
  recommendation: string;
  matched_skills: string[];
  missing_skills: string[];
  strengths: string[];
  recommendations: string[];
  matched_sections: MatchedSection[];
  missing_requirements: string[];
};

export type CandidateResult = {
  filename: string;
  resume: ParsedResume;
  ats: ATSResult;
};

export type AnalyzeError = {
  filename: string;
  error: string;
};

export type AnalyzeResponse = {
  bucket: string;
  results: CandidateResult[];
  failed: AnalyzeError[];
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

/**
 * Wraps `fetch` to attach the stored bearer token to every request, and to
 * handle an expired/invalid session in one place: on a 401, we clear the
 * stored token and bounce to /login rather than making every page handle it.
 */
async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();

  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearToken();
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }

  return response;
}

export async function login(
  username: string,
  password: string
): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new Error(detail?.detail ?? "Invalid username or password.");
  }

  return response.json();
}

export async function getBuckets() {
  const response = await apiFetch("/buckets/");

  if (!response.ok) {
    throw new Error("Failed to load buckets");
  }

  return response.json();
}

export async function getResumes(bucketName: string) {
  const response = await apiFetch(`/resumes/${bucketName}`);

  if (!response.ok) {
    throw new Error("Failed to load resumes");
  }

  return response.json();
}

export async function extractTextFromFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiFetch("/documents/extract-text", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new Error(
      detail?.detail ?? "Failed to extract text from file."
    );
  }

  const data = await response.json();
  return data.text as string;
}

export async function analyzeCandidates(
  bucketName: string,
  jobDescription: string
): Promise<AnalyzeResponse> {
  const response = await apiFetch(
    `/analyze/${encodeURIComponent(bucketName)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_description: jobDescription }),
    }
  );

  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new Error(
      detail?.detail ?? "Failed to analyze candidates."
    );
  }

  return response.json();
}

/**
 * Downloads a resume as a Blob (rather than a plain <a href>), since the
 * download route now requires an Authorization header — something a plain
 * anchor tag can't send.
 */
export async function downloadResume(
  bucket: string,
  filename: string
): Promise<Blob> {
  const response = await apiFetch(
    `/resumes/${encodeURIComponent(bucket)}/download/${encodeURIComponent(
      filename
    )}`
  );

  if (!response.ok) {
    throw new Error("Failed to download resume.");
  }

  return response.blob();
}

// ── Job API Functions ───────────────────────────────────────────────────────

export type Job = {
  id: string;
  title: string;
  location?: string;
  employment_type?: string;
  department?: string;
  description?: string;
  responsibilities?: string[];
  requirements?: string[];
  opening_date?: string;
  closing_date?: string;
  is_approved?: boolean;
  minio_bucket?: string;
  created_at?: string;
};

export async function createJob(jobData: {
  title: string;
  location?: string;
  employment_type?: string;
  department?: string;
  description?: string;
  responsibilities?: string[];
  requirements?: string[];
}): Promise<{ job_id: string; is_approved: boolean }> {
  const response = await apiFetch("/jobs/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(jobData),
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new Error(detail?.detail ?? "Failed to create job.");
  }
  return response.json();
}

export async function getPendingJobs(): Promise<Job[]> {
  const response = await apiFetch("/jobs/pending");
  if (!response.ok) throw new Error("Failed to load pending jobs.");
  return response.json();
}

export async function getApprovedJobs(): Promise<Job[]> {
  const response = await apiFetch("/jobs/");
  if (!response.ok) throw new Error("Failed to load approved jobs.");
  return response.json();
}


export async function getAllJobs(): Promise<Job[]> {
  const response = await apiFetch("/jobs/all");
  if (!response.ok) throw new Error("Failed to load jobs.");
  return response.json();
}

export async function approveJob(jobId: string): Promise<{ job_id: string; minio_bucket: string }> {
  const response = await apiFetch(`/jobs/${jobId}/approve`, {
    method: "PATCH",
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new Error(detail?.detail ?? "Failed to approve job.");
  }
  return response.json();
}

export async function deleteJob(jobId: string): Promise<void> {
  const response = await apiFetch(`/jobs/${jobId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete job.");
}
