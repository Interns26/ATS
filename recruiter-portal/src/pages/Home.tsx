/**
 * Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.
 */

import { useEffect, useState, useMemo } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../components/Button/Button";
import Card from "../components/Card/Card";
import Select from "../components/Select/Select";
import Input from "../components/Input/Input";
import TextArea from "../components/TextArea/TextArea";
import LoadingOverlay from "../components/LoadingOverlay/LoadingOverlay";

import {
  getBuckets,
  getResumes,
  analyzeCandidates,
  extractTextFromFile,
  getApprovedJobs,
  clearAnalysisCache,
} from "../services/api";
import type { AnalyzeResponse, Job, LoadedResume } from "../services/api";
import {
  ANALYSIS_STORAGE_KEY,
  THRESHOLDS_STORAGE_KEY,
  DEFAULT_THRESHOLDS,
} from "../lib/analysisStorage";
import type { Thresholds } from "../lib/analysisStorage";

const CGPA_OPERATORS = ["<=", ">=", "="];
const MAX_CGPA = 4;

function Home() {
  const navigate = useNavigate();

  // Approved Jobs State
  const [approvedJobs, setApprovedJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");

  // MinIO / Resume Storage State
  const [buckets, setBuckets] = useState<string[]>([]);
  const [selectedBucket, setSelectedBucket] = useState("");
  const [connected, setConnected] = useState(false);
  const [resumes, setResumes] = useState<LoadedResume[]>([]);

  const [resumeSummary, setResumeSummary] = useState({
    total: 0,
    complete: 0,
    incomplete: 0,
  });

  // Real Candidate Constraints & Filtering State
  const [cgpaOperator, setCgpaOperator] = useState("<=");
  const [cgpaValue, setCgpaValue] = useState<number>(MAX_CGPA);
  const [university, setUniversity] = useState("All");
  const [otherUniversity, setOtherUniversity] = useState("");

  const [appliedFilters, setAppliedFilters] = useState({
    cgpaOperator: "<=",
    cgpaValue: MAX_CGPA,
    university: "All",
    otherUniversity: "",
  });

  const [filtering, setFiltering] = useState(false);

  // Dynamic University Options extracted from candidate resumes
  const universityOptions = useMemo(() => {
    const extractedSet = new Set<string>();
    resumes.forEach((r) => {
      if (r.university && r.university.trim() && r.university.trim() !== "N/A") {
        extractedSet.add(r.university.trim());
      }
    });
    const sortedList = Array.from(extractedSet).sort();
    return ["All", ...sortedList, "Other"];
  }, [resumes]);

  // Resume Analyzer State
  const [analyzing, setAnalyzing] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [extractingJD, setExtractingJD] = useState(false);
  const [jdFileName, setJdFileName] = useState<string | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [interviewThreshold, setInterviewThreshold] = useState(
    DEFAULT_THRESHOLDS.interview
  );
  const [considerThreshold, setConsiderThreshold] = useState(
    DEFAULT_THRESHOLDS.consider
  );

  // Fetch approved jobs on mount
  useEffect(() => {
    async function loadApprovedJobs() {
      try {
        const jobs = await getApprovedJobs();
        setApprovedJobs(jobs);
      } catch (err) {
        console.error("Failed to load approved jobs:", err);
      }
    }
    loadApprovedJobs();
  }, []);

  async function connectToMinio() {
    try {
      const data = await getBuckets();
      setBuckets(data.map((bucket: any) => bucket.name));
      setConnected(true);
    } catch (error) {
      console.error(error);
      alert("Failed to fetch buckets from MinIO storage.");
    }
  }

  async function loadResumesForBucket(bucketName: string) {
    if (!bucketName) return;
    try {
      const files: LoadedResume[] = await getResumes(bucketName);
      setResumes(files);
      setResumeSummary({
        total: files.length,
        complete: files.length,
        incomplete: 0,
      });
    } catch (error) {
      console.error(error);
      alert("Unable to load resumes for bucket: " + bucketName);
    }
  }

  async function loadResumes() {
    if (!selectedBucket) {
      alert("Please select a bucket.");
      return;
    }
    loadResumesForBucket(selectedBucket);
  }

  function parseArrayField(val: unknown): string[] {
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (!trimmed) return [];
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) return parsed.filter(Boolean);
        } catch {
          // Fallback to line split below
        }
      }
      return trimmed.split("\n").map((s) => s.trim()).filter(Boolean);
    }
    return [];
  }

  // When user selects an approved job from the dropdown
  function handleApprovedJobSelect(jobId: string) {
    setSelectedJobId(jobId);
    const job = approvedJobs.find((j) => j.id === jobId);
    if (job) {
      const parts: string[] = [];
      if (job.title) parts.push(`JOB TITLE: ${job.title}`);
      if (job.description) parts.push(`ROLE SUMMARY:\n${job.description}`);

      const resps = parseArrayField(job.responsibilities);
      if (resps.length > 0) parts.push("KEY RESPONSIBILITIES:\n" + resps.map((r) => `- ${r}`).join("\n"));

      const reqs = parseArrayField(job.requirements);
      if (reqs.length > 0) parts.push("REQUIRED QUALIFICATIONS & SKILLS:\n" + reqs.map((r) => `- ${r}`).join("\n"));

      if (parts.length > 0) {
        setJobDescription(parts.join("\n\n"));
      } else if (job.description) {
        setJobDescription(job.description);
      }

      if (job.minio_bucket) {
        setSelectedBucket(job.minio_bucket);
        setConnected(true);
        loadResumesForBucket(job.minio_bucket);
      }
    }
  }

  function handleCgpaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = Number(e.target.value);
    if (Number.isNaN(raw)) return;
    setCgpaValue(Math.min(raw, MAX_CGPA));
  }

  function cgpaMatches(cgpa?: number | null) {
    if (cgpa === undefined || cgpa === null) return true;
    const { cgpaOperator: op, cgpaValue: val } = appliedFilters;
    if (op === "<=") return cgpa <= val;
    if (op === ">=") return cgpa >= val;
    return cgpa === val;
  }

  function universityMatches(uni?: string) {
    const { university: selected, otherUniversity: other } = appliedFilters;
    if (selected === "All") return true;
    if (!uni || uni === "N/A") return true;
    if (selected === "Other") {
      return other.trim() !== "" && uni.toLowerCase().includes(other.trim().toLowerCase());
    }
    return uni.toLowerCase().includes(selected.toLowerCase());
  }

  // Filter real loaded candidate resumes
  const filteredResumes = resumes.filter((r) => {
    return cgpaMatches(r.cgpa) && universityMatches(r.university);
  });

  function handleFilter() {
    setFiltering(true);
    setAppliedFilters({ cgpaOperator, cgpaValue, university, otherUniversity });
    setFiltering(false);
  }

  async function handleJobDescriptionFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtractingJD(true);
    setJdFileName(file.name);

    try {
      const text = await extractTextFromFile(file);
      setJobDescription(text);
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "Unable to extract text from that file."
      );
      setJdFileName(null);
    } finally {
      setExtractingJD(false);
      e.target.value = "";
    }
  }

  async function handleClearCache() {
    if (!selectedBucket) {
      alert("Please select an approved job or bucket first.");
      return;
    }
    if (!confirm(`Are you sure you want to remove stored analysis results for bucket "${selectedBucket}" from the database? This allows a fresh re-analysis.`)) {
      return;
    }
    setClearingCache(true);
    try {
      await clearAnalysisCache(selectedBucket);
      sessionStorage.removeItem(ANALYSIS_STORAGE_KEY);
      alert("Analysis results removed from database successfully! You can now rerun candidate analysis.");
      loadResumesForBucket(selectedBucket);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to clear analysis results.");
    } finally {
      setClearingCache(false);
    }
  }

  async function handleAnalyze(force: boolean = false) {
    if (!selectedBucket) {
      alert("Please select and connect to a resume bucket first.");
      return;
    }

    if (!jobDescription.trim()) {
      alert("Please enter or upload a job description first.");
      return;
    }

    if (
      Number.isNaN(interviewThreshold) ||
      Number.isNaN(considerThreshold) ||
      considerThreshold >= interviewThreshold
    ) {
      alert(
        "Consider Threshold must be a lower number than Interview Threshold."
      );
      return;
    }

    const thresholds: Thresholds = {
      interview: interviewThreshold,
      consider: considerThreshold,
    };

    setAnalyzing(true);

    try {
      const data: AnalyzeResponse = await analyzeCandidates(
        selectedBucket,
        jobDescription,
        force
      );

      sessionStorage.setItem(ANALYSIS_STORAGE_KEY, JSON.stringify(data));
      sessionStorage.setItem(THRESHOLDS_STORAGE_KEY, JSON.stringify(thresholds));

      navigate("/results", { state: { analysis: data, thresholds } });
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error ? error.message : "Unable to analyze candidates."
      );
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <>
      {filtering && (
        <LoadingOverlay
          message="Applying filters..."
          subMessage="Filtering loaded candidate resumes by your constraints."
        />
      )}

      {analyzing && (
        <LoadingOverlay
          message="Analyzing candidate resumes..."
          subMessage="Evaluating resume experience, skills, and qualifications using LangGraph."
        />
      )}

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Automated ATS Resume Analyzer
          </h1>
          <p className="muted">
            Batch-evaluate candidate resumes against approved job postings using AI & LangGraph workflows.
          </p>
        </div>

        {/* Approved Job Openings Dropdown */}
        {approvedJobs.length > 0 && (
          <Card title="Approved Job Openings">
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Choose an Approved Job Opening:
              </label>
              <select
                value={selectedJobId}
                onChange={(e) => handleApprovedJobSelect(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-3 text-sm"
              >
                <option value="">-- Select an Approved Job --</option>
                {approvedJobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title} ({job.department || "General"}) • Bucket: {job.minio_bucket}
                  </option>
                ))}
              </select>
              <p className="text-xs muted">
                Selecting an approved job automatically sets its MinIO bucket, loads candidate resumes, and pre-fills its job description.
              </p>
            </div>
          </Card>
        )}

        {/* Unified Loaded Candidate Resumes Table */}
        <Card title={`Loaded Candidate Resumes (${filteredResumes.length} of ${resumes.length})`}>
          {resumes.length === 0 ? (
            <p className="muted">No resumes loaded yet. Please select an approved job above to load candidate resumes.</p>
          ) : (
            <div className="overflow-x-auto table-wrap">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b table-header text-left">
                    <th className="p-3">#</th>
                    <th className="p-3">Candidate Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">University</th>
                    <th className="p-3">CGPA</th>
                    <th className="p-3">ATS Score (DB)</th>
                    <th className="p-3">Filename & Size</th>
                    <th className="p-3">Last Modified</th>
                    <th className="p-3">Resume Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResumes.map((r, i) => (
                    <tr key={r.filename} className="border-b table-row">
                      <td className="p-3 font-semibold">{i + 1}</td>
                      <td className="p-3 font-medium">{r.candidate_name || "Candidate"}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{r.email || "-"}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{r.university || "N/A"}</td>
                      <td className="p-3 font-medium">{r.cgpa !== null && r.cgpa !== undefined ? r.cgpa : "-"}</td>
                      <td className="p-3">
                        {r.ats_score !== undefined && r.ats_score !== null ? (
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              r.ats_score >= 70
                                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                : r.ats_score >= 50
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                                : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                            }`}
                          >
                            {r.ats_score}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500 italic">Not Analyzed</span>
                        )}
                      </td>
                      <td className="p-3 text-xs">
                        <span className="font-semibold">{r.filename}</span>
                        <br />
                        <span className="muted">{(r.size / 1024).toFixed(2)} KB</span>
                      </td>
                      <td className="p-3 text-xs muted">
                        {r.last_modified ? new Date(r.last_modified).toLocaleString() : "-"}
                      </td>
                      <td className="p-3">
                        <a
                          href={r.download_url || `http://localhost:8000/resumes/${selectedBucket}/download/${r.filename}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline font-semibold text-xs"
                        >
                          View / Download
                        </a>
                      </td>
                    </tr>
                  ))}
                  {filteredResumes.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-4 text-center muted">
                        No candidates match the applied CGPA and University constraints.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Candidate Constraints Card */}
        <Card title="Candidate Constraints & Filters">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block font-medium">CGPA Constraint</label>
              <div className="flex gap-3">
                <Select
                  value={cgpaOperator}
                  onChange={setCgpaOperator}
                  options={CGPA_OPERATORS}
                />
                <Input
                  type="number"
                  step="0.1"
                  min={0}
                  max={MAX_CGPA}
                  value={cgpaValue}
                  onChange={handleCgpaChange}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block font-medium">University Filter</label>
              <Select
                value={university}
                onChange={setUniversity}
                options={universityOptions}
              />

              {university === "Other" && (
                <Input
                  type="text"
                  placeholder="Enter university name"
                  value={otherUniversity}
                  onChange={(e) => setOtherUniversity(e.target.value)}
                  className="mt-3"
                />
              )}
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={handleFilter} disabled={filtering}>
              {filtering ? "Filtering…" : "Apply Filters"}
            </Button>
          </div>
        </Card>

        <Card title="Job Description">
          <div className="space-y-5">
            <div>
              <label className="mb-2 block font-medium">Upload Job Description</label>

              <Input
                type="file"
                accept=".pdf,.txt"
                onChange={handleJobDescriptionFile}
                disabled={extractingJD}
              />

              {extractingJD && (
                <p className="mt-2 text-sm muted">
                  Extracting text from {jdFileName}…
                </p>
              )}

              {!extractingJD && jdFileName && (
                <p className="mt-2 text-sm text-green-600">
                  Loaded text from {jdFileName} — feel free to edit it below.
                </p>
              )}
            </div>

            <TextArea
              rows={12}
              value={jobDescription}
              placeholder="Upload a PDF or paste the job description..."
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>
        </Card>

        <Card title="Recommendation Thresholds">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block font-medium">Interview Threshold</label>
              <Input
                type="number"
                value={interviewThreshold}
                onChange={(e) => setInterviewThreshold(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">Consider Threshold</label>
              <Input
                type="number"
                value={considerThreshold}
                onChange={(e) => setConsiderThreshold(Number(e.target.value))}
              />
            </div>
          </div>
        </Card>

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={handleClearCache}
            disabled={clearingCache || !selectedBucket}
            className="px-4 py-2 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900 rounded-lg text-sm font-semibold transition disabled:opacity-50"
          >
            {clearingCache ? "Clearing..." : "🧪 Clear Analysis Results from DB"}
          </button>
          <button
            type="button"
            onClick={() => handleAnalyze(true)}
            disabled={analyzing || !selectedBucket}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
          >
            ⚡ Force Re-analyze
          </button>
          <Button onClick={() => handleAnalyze(false)} disabled={analyzing}>
            {analyzing ? "Analyzing…" : "Analyze Candidates"}
          </Button>
        </div>
      </div>
    </>
  );
}

export default Home;