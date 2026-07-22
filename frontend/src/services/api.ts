const API_URL = "http://localhost:8000";

export type MatchedSection = {
  job_requirement: string;
  resume_evidence: string;
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

export async function getBuckets() {
  const response = await fetch(`${API_URL}/buckets/`);

  if (!response.ok) {
    throw new Error("Failed to load buckets");
  }

  return response.json();
}

export async function getResumes(bucketName: string) {
  const response = await fetch(
    `${API_URL}/resumes/${bucketName}`
  );

  if (!response.ok) {
    throw new Error("Failed to load resumes");
  }

  return response.json();
}

export async function extractTextFromFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/documents/extract-text`, {
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
  const response = await fetch(
    `${API_URL}/analyze/${encodeURIComponent(bucketName)}`,
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