/**
 * Copyright (c) 2026 Uworx UK. All rights reserved.
 */

/**
 * Candidate Portal API service.
 *
 * All responses from the backend use snake_case.
 * We transform them to camelCase here so existing components
 * that were built against the local Job type keep working unchanged.
 */
import type { Job } from "../types/job";

const API_URL = "http://localhost:8000";

// ── Types ─────────────────────────────────────────────────────────────────

export type SubmitApplicationPayload = {
  basicInfo: {
    email: string;
    firstName: string;
    lastName: string;
    city: string;
    stateProvince: string;
    mobileNumber: string;
    howHeard: string;
  };
  qualifications: {
    qualification: string;
    subject: string;
    institute: string;
    grade: string;
    graduationYear: string;
  }[];
  workExperience: {
    jobField: string;
    organization: string;
    jobTitle: string;
    startDate: string;
    currentlyWorking: boolean;
    endDate: string;
    startingSalary: string;
    endingSalary: string;
    jobDescription: string;
  }[];
  resumeFile: File;
};

export type SubmitApplicationResponse = {
  application_id: string;
  candidate_id: string;
  resume_key: string;
  bucket: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────

/** Transform a raw snake_case API job object to the camelCase Job type. */
function toJob(raw: Record<string, any>): Job {
  return {
    id: raw.id,
    title: raw.title,
    location: raw.location ?? "",
    employmentType: raw.employment_type ?? "Permanent",
    openingDate: raw.opening_date ?? "",
    closingDate: raw.closing_date ?? "",
    department: raw.department ?? "",
    description: raw.description ?? "",
    responsibilities: raw.responsibilities ?? [],
    requirements: raw.requirements ?? [],
  };
}

// ── API calls ─────────────────────────────────────────────────────────────

export async function fetchApprovedJobs(): Promise<Job[]> {
  const res = await fetch(`${API_URL}/jobs/`);
  if (!res.ok) throw new Error("Failed to load job listings.");
  const data = await res.json();
  return (data as Record<string, any>[]).map(toJob);
}

export async function fetchJob(jobId: string): Promise<Job> {
  const res = await fetch(`${API_URL}/jobs/${jobId}`);
  if (!res.ok) throw new Error("Job not found.");
  return toJob(await res.json());
}

export async function submitApplication(
  jobId: string,
  payload: SubmitApplicationPayload
): Promise<SubmitApplicationResponse> {
  const formData = new FormData();
  formData.append("resume", payload.resumeFile);
  formData.append("basic_info", JSON.stringify(payload.basicInfo));
  formData.append("qualifications", JSON.stringify(payload.qualifications));
  formData.append("work_experience", JSON.stringify(payload.workExperience));

  const res = await fetch(`${API_URL}/applications/${jobId}`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.detail ?? "Failed to submit application.");
  }

  return res.json();
}

export type LoginResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  role: "admin" | "candidate";
  user?: Record<string, any>;
};

export type CandidateProfile = {
  username: string;
  role: "candidate" | "admin";
  email?: string;
  first_name?: string;
  last_name?: string;
  city?: string;
  state_province?: string;
  mobile_number?: string;
  candidate_id?: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  city?: string;
  stateProvince?: string;
  mobileNumber?: string;
  howHeard?: string;
};

export async function login(username: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail ?? "Invalid username or password.");
  }
  return res.json();
}

export async function registerCandidate(payload: RegisterPayload): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/auth/candidate/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: payload.email,
      password: payload.password,
      first_name: payload.firstName,
      last_name: payload.lastName,
      city: payload.city,
      state_province: payload.stateProvince,
      mobile_number: payload.mobileNumber,
      how_heard: payload.howHeard,
    }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail ?? "Registration failed.");
  }
  return res.json();
}

export async function candidateLogin(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/auth/candidate/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail ?? "Invalid email or password.");
  }
  return res.json();
}

export async function googleLogin(credential: string): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail ?? "Google authentication failed.");
  }
  return res.json();
}

export async function fetchCurrentUser(token: string): Promise<CandidateProfile> {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Session expired.");
  return res.json();
}



