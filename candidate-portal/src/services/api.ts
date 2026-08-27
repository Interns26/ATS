/**
 * Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.
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

function parseArrayField(val: any): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return val.split("\n").map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

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
    numPositions: raw.num_positions ?? 1,
    description: raw.description ?? "",
    responsibilities: parseArrayField(raw.responsibilities),
    requirements: parseArrayField(raw.requirements),
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
  address?: string;
  city?: string;
  state_province?: string;
  mobile_number?: string;
  how_heard?: string;
  cnic?: string;
  years_of_experience?: number;
  current_job_title?: string;
  current_employer?: string;
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

export type CandidateProfileUpdate = {
  name: string;
  address?: string;
  city?: string;
  state_province?: string;
  mobile_number?: string;
  how_heard?: string;
  cnic?: string;
  years_of_experience?: number;
  current_job_title?: string;
  current_employer?: string;
};

export async function updateCandidateProfile(
  token: string,
  profile: CandidateProfileUpdate
): Promise<CandidateProfile> {
  const nameParts = profile.name.trim().split(/\s+/);

  const first_name = nameParts[0] ?? "";
  const last_name = nameParts.slice(1).join(" ");

  const res = await fetch(`${API_URL}/auth/candidate/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      first_name,
      last_name,
      address: profile.address,
      city: profile.city,
      state_province: profile.state_province,
      mobile_number: profile.mobile_number,
      how_heard: profile.how_heard,
      cnic: profile.cnic,
      years_of_experience: profile.years_of_experience,
      current_job_title: profile.current_job_title,
      current_employer: profile.current_employer,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(
      errorData?.detail ?? "Failed to update profile."
    );
  }

  return res.json();
}

