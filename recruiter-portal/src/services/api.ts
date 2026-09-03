/**
 * Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.
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
  ats_score?: number | null;
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
  email?: string;
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

export type LoginUser = {
  username: string;
  name: string;
  role: string;
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  role: string;
  user?: LoginUser;
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
  jobDescription: string,
  force: boolean = false
): Promise<AnalyzeResponse> {
  const response = await apiFetch(
    `/analyze/${encodeURIComponent(bucketName)}${force ? "?force=true" : ""}`,
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

export async function clearAnalysisCache(bucketName: string): Promise<void> {
  const response = await apiFetch(`/analyze/cache/${encodeURIComponent(bucketName)}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new Error(detail?.detail ?? "Failed to clear analysis cache.");
  }
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
  num_positions?: number;
  is_approved?: boolean;
  minio_bucket?: string;
  created_at?: string;
};

export async function createJob(jobData: {
  title: string;
  location?: string;
  employment_type?: string;
  closing_date?: string | null;
  department?: string;
  description?: string;
  responsibilities?: string[];
  requirements?: string[];
  num_positions?: number;
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

export type JobComment = {
  id: string;
  job_id: string;
  job_title?: string;
  comment: string | null;
  reviewer_role: string;
  action: string;
  recipient_username: string | null;
  created_at: string;
};

export async function addJobComment(
  jobId: string,
 data: {
  comment?: string | null;
  reviewer_role: string;
  action: string;
  recipient_username?: string | null;
}
): Promise<JobComment> {
  const response = await apiFetch(`/jobs/${jobId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new Error(detail?.detail ?? "Failed to add job comment.");
  }

  return response.json();
}

export async function getJobComments(
  jobId: string
): Promise<JobComment[]> {
  const response = await apiFetch(`/jobs/${jobId}/comments`);

  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new Error(detail?.detail ?? "Failed to load job comments.");
  }

  return response.json();
}
export async function getMyJobComments(): Promise<JobComment[]> {
  const response = await apiFetch("/jobs/comments/assigned-to-me");

  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new Error(
      detail?.detail ?? "Failed to load assigned job reviews."
    );
  }

  return response.json();
}

export async function deleteJob(jobId: string): Promise<void> {
  const response = await apiFetch(`/jobs/${jobId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete job.");
}

export async function updateJob(
  jobId: string,
  jobData: {
    title?: string;
    department?: string;
    description?: string;
    responsibilities?: string[];
    requirements?: string[];
    location?: string;
    employment_type?: string;
    closing_date?: string | null;
    num_positions?: number;
  }
): Promise<void> {
  const response = await apiFetch(`/jobs/${jobId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(jobData),
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new Error(detail?.detail ?? "Failed to update job.");
  }
}

export type TeamLead = {
  id: string;
  name: string;
  username: string;
  role: string;
};

export async function getTeamLeads(): Promise<TeamLead[]> {
  const response = await apiFetch("/auth/team-leads");
  if (!response.ok) throw new Error("Failed to load team leads.");
  return response.json();
}

// ── Candidates API Functions ─────────────────────────────────────────────────

export type CandidateRecord = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  city: string | null;
  state_province: string | null;
  mobile_number: string | null;
  how_heard: string | null;
  created_at: string | null;
  application_id: string | null;
  submitted_at: string | null;
  resume_minio_key: string | null;
  job_title: string | null;
  job_bucket: string | null;
  university: string | null;
  cgpa: string | null;
  qualification: string | null;
  subject: string | null;
  graduation_year: string | null;
  ats_score: number | null;
};

export async function getAllCandidates(): Promise<CandidateRecord[]> {
  const response = await apiFetch("/candidates/");
  if (!response.ok) throw new Error("Failed to load candidates.");
  return response.json();
}

export async function updateCandidate(
  candidateId: string,
  data: Partial<{
    email: string;
    first_name: string;
    last_name: string;
    city: string;
    state_province: string;
    mobile_number: string;
    how_heard: string;
  }>
): Promise<void> {
  const response = await apiFetch(`/candidates/${candidateId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new Error(detail?.detail ?? "Failed to update candidate.");
  }
}

export async function exportCandidatesXlsx(): Promise<Blob> {
  const response = await apiFetch("/candidates/export");
  if (!response.ok) throw new Error("Failed to export candidates.");
  return response.blob();
}

export async function deleteCandidate(candidateId: string): Promise<void> {
  const response = await apiFetch(`/candidates/${candidateId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new Error(detail?.detail ?? "Failed to delete candidate.");
  }
}

export async function sendBatchEmails(
  emails: string[],
  subject: string,
  body: string
): Promise<{ message: string; recipients: number }> {
  const response = await apiFetch("/candidates/email-batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emails, subject, body }),
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new Error(detail?.detail ?? "Failed to send batch emails.");
  }
  return response.json();
}
