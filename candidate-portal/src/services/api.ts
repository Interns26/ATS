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
