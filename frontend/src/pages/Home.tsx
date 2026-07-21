import { useState } from "react";

import Button from "../components/Button/Button";
import Card from "../components/Card/Card";
import Input from "../components/Input/Input";
import TextArea from "../components/TextArea/TextArea";

function Home() {
  const [resumeSummary] = useState({
    total: 0,
    complete: 0,
    incomplete: 0,
  });

  const [jobDescription, setJobDescription] = useState("");

  const [missingCandidates] = useState([
    {
      id: 1,
      name: "Ahmed Khan",
      missing: "Phone Number",
    },
    {
      id: 2,
      name: "Sarah Ali",
      missing: "Graduation Year",
    },
    {
      id: 3,
      name: "John Smith",
      missing: "Skills",
    },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">
          ATS Resume Analyzer
        </h1>

        <p className="mt-2 text-slate-600">
          Upload resumes, analyze ATS scores, and rank candidates.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Resume Source">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                MinIO Bucket Name
              </label>

              <Input placeholder="e.g. resumes-2026" />
            </div>

            <Button>Connect</Button>

            <div className="flex items-center gap-2 text-sm">
              <span className="h-3 w-3 rounded-full bg-red-500"></span>

              <span className="text-slate-600">
                Not Connected
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

      <Card title="Missing Candidate Information">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b bg-slate-100">
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Candidate
                </th>

                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Missing Information
                </th>

                <th className="px-4 py-3 text-center text-sm font-semibold">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {missingCandidates.map((candidate) => (
                <tr
                  key={candidate.id}
                  className="border-b hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    {candidate.name}
                  </td>

                  <td className="px-4 py-3 text-red-600">
                    {candidate.missing}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <Button>Edit</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Job Description">
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Upload Job Description
            </label>

            <Input
              type="file"
              accept=".pdf,.txt"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Extracted Job Description
            </label>

            <TextArea
              rows={12}
              placeholder="Upload a PDF or paste the job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
            Uploading a PDF will automatically populate this text box. Review
            and edit the extracted text before analysis.
          </div>
        </div>
      </Card>

      <Card title="Recommendation Thresholds">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Interview Threshold
            </label>

            <Input
              type="number"
              defaultValue={85}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
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
        <Button disabled>
          Analyze Candidates
        </Button>
      </div>
    </div>
  );
}

export default Home;