/**
 * Copyright (c) 2026 Coworx UK. All rights reserved.
 */

import { useEffect, useState } from "react";
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
} from "../services/api";
import type { AnalyzeResponse, Job, LoadedResume } from "../services/api";
import {
  ANALYSIS_STORAGE_KEY,
  THRESHOLDS_STORAGE_KEY,
  DEFAULT_THRESHOLDS,
} from "../lib/analysisStorage";
import type { Thresholds } from "../lib/analysisStorage";

const UNIVERSITY_OPTIONS = ["All", "UET Lahore", "FAST NUCES", "COMSATS", "Other"];
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
    cgpaOperator: ">=",
    cgpaValue: MAX_CGPA,
    university: "All",
    otherUniversity: "",
  });

  const [filtering, setFiltering] = useState(false);

  // Resume Analyzer State
  const [analyzing, setAnalyzing] = useState(false);
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
      alert("Unable to connect to MinIO.");
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

  // When user selects an approved job from the dropdown
  function handleApprovedJobSelect(jobId: string) {
    setSelectedJobId(jobId);
    const job = approvedJobs.find((j) => j.id === jobId);
    if (job) {
      if (job.description) {
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

  async function handleAnalyze() {
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
        jobDescription
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
          message="Analyzing candidates..."
          subMessage="Our AI is reading each resume and scoring it against the job description. This can take a little while for larger batches."
        />
      )}

      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">ATS Resume Analyzer</h1>
          <p className="mt-2 muted">
            Select an approved job opening or resume bucket, review candidates, apply custom constraints, and analyze top applications.
          </p>
        </div>

        {approvedJobs.length > 0 && (
          <Card title="Quick Select Approved Job Position">
            <div className="space-y-3">
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card title="Resume Source">
            <div className="space-y-5">
              <div>
                <label className="mb-2 block font-medium">Resume Bucket</label>
                <Select
                  value={selectedBucket}
                  onChange={setSelectedBucket}
                  options={buckets.length > 0 ? buckets : (selectedBucket ? [selectedBucket] : [])}
                />
              </div>

              <div className="flex gap-3">
                <Button onClick={connectToMinio}>Connect</Button>
                <Button onClick={loadResumes}>Load Resumes</Button>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`h-3 w-3 rounded-full ${connected ? "bg-green-500" : "bg-red-500"
                    }`}
                ></span>
                <span className="muted">
                  {connected
                    ? `Connected (${selectedBucket || "All buckets"})`
                    : "Not Connected"}
                </span>
              </div>
            </div>
          </Card>

          <Card title="Resume Summary">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Total Resumes</span>
                <span className="font-semibold">{resumeSummary.total}</span>
              </div>
              <div className="flex justify-between">
                <span>Complete</span>
                <span className="font-semibold text-green-600">
                  {resumeSummary.complete}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Incomplete</span>
                <span className="font-semibold text-red-600">
                  {resumeSummary.incomplete}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Unified Loaded Candidate Resumes Table */}
        <Card title={`Loaded Candidate Resumes (${filteredResumes.length} of ${resumes.length})`}>
          {resumes.length === 0 ? (
            <p className="muted">No resumes loaded yet. Please select an approved job or connect to a bucket above.</p>
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
                      <td colSpan={8} className="p-4 text-center muted">
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
                options={UNIVERSITY_OPTIONS}
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

        <div className="flex justify-end">
          <Button onClick={handleAnalyze} disabled={analyzing}>
            {analyzing ? "Analyzing…" : "Analyze Candidates"}
          </Button>
        </div>
      </div>
    </>
  );
}

export default Home;