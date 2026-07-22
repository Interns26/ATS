import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../components/Button/Button";
import Card from "../components/Card/Card";
import Select from "../components/Select/Select";
import Input from "../components/Input/Input";
import TextArea from "../components/TextArea/TextArea";

import {
  getBuckets,
  getResumes,
  analyzeCandidates,
  extractTextFromFile,
} from "../services/api";
import type { AnalyzeResponse } from "../services/api";

export const ANALYSIS_STORAGE_KEY = "ats:last-analysis";

type Resume = {
  filename: string;
  size: number;
  last_modified: string;
};

function Home() {
  const navigate = useNavigate();

  const [buckets, setBuckets] = useState<string[]>([]);
  const [selectedBucket, setSelectedBucket] = useState("");
  const [connected, setConnected] = useState(false);

  const [analyzing, setAnalyzing] = useState(false);
  const [extractingJD, setExtractingJD] = useState(false);
  const [jdFileName, setJdFileName] = useState<string | null>(null);

  const [resumes, setResumes] = useState<Resume[]>([]);

  const [jobDescription, setJobDescription] = useState("");

  const [resumeSummary, setResumeSummary] = useState({
    total: 0,
    complete: 0,
    incomplete: 0,
  });

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

  async function loadResumes() {
    if (!selectedBucket) {
      alert("Please select a bucket.");
      return;
    }

    try {
      const files = await getResumes(selectedBucket);

      setResumes(files);

      setResumeSummary({
        total: files.length,
        complete: files.length,
        incomplete: 0,
      });
    } catch (error) {
      console.error(error);

      alert("Unable to load resumes.");
    }
  }

  useEffect(() => {}, []);

  async function handleJobDescriptionFile(
    e: ChangeEvent<HTMLInputElement>
  ) {
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
      // allow re-selecting the same file again later
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

    setAnalyzing(true);

    try {
      const data: AnalyzeResponse = await analyzeCandidates(
        selectedBucket,
        jobDescription
      );

      sessionStorage.setItem(
        ANALYSIS_STORAGE_KEY,
        JSON.stringify(data)
      );

      navigate("/results", { state: { analysis: data } });
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Unable to analyze candidates."
      );
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          ATS Resume Analyzer
        </h1>

        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Select a resume bucket, load resumes, then upload a job description
          for analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Resume Source">
          <div className="space-y-5">
            <div>
              <label className="mb-2 block font-medium">
                Resume Bucket
              </label>

              <Select
                value={selectedBucket}
                onChange={setSelectedBucket}
                options={buckets}
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={connectToMinio}>
                Connect
              </Button>

              <Button onClick={loadResumes}>
                Load Resumes
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`h-3 w-3 rounded-full ${
                  connected
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              ></span>

              <span className="text-slate-600 dark:text-slate-300">
                {connected
                  ? "Connected"
                  : "Not Connected"}
              </span>
            </div>
          </div>
        </Card>

        <Card title="Resume Summary">
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Total Resumes</span>

              <span className="font-semibold">
                {resumeSummary.total}
              </span>
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

      <Card title="Available Resumes">
        {resumes.length === 0 ? (
          <p className="text-slate-500">
            No resumes loaded.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b bg-slate-100 dark:bg-slate-700">
                  <th className="p-3 text-left">
                    Filename
                  </th>

                  <th className="p-3 text-left">
                    Size
                  </th>

                  <th className="p-3 text-left">
                    Last Modified
                  </th>
                </tr>
              </thead>

              <tbody>
                {resumes.map((resume) => (
                  <tr
                    key={resume.filename}
                    className="border-b hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <td className="p-3">
                      {resume.filename}
                    </td>

                    <td className="p-3">
                      {(resume.size / 1024).toFixed(2)} KB
                    </td>

                    <td className="p-3">
                      {new Date(
                        resume.last_modified
                      ).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Job Description">
        <div className="space-y-5">
          <div>
            <label className="mb-2 block font-medium">
              Upload Job Description
            </label>

            <Input
              type="file"
              accept=".pdf,.txt"
              onChange={handleJobDescriptionFile}
              disabled={extractingJD}
            />

            {extractingJD && (
              <p className="mt-2 text-sm text-slate-500">
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
            onChange={(e) =>
              setJobDescription(e.target.value)
            }
          />
        </div>
      </Card>

      <Card title="Recommendation Thresholds">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block font-medium">
              Interview Threshold
            </label>

            <Input
              type="number"
              defaultValue={85}
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Consider Threshold
            </label>

            <Input
              type="number"
              defaultValue={70}
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
  );
}

export default Home;