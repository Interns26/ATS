import { Link, useParams } from "react-router-dom";

import Button from "../components/Button/Button";
import Card from "../components/Card/Card";
import CircularProgress from "../components/CircularProgress/CircularProgress";

function CandidateDetails() {
  const { id } = useParams();

  const candidates = [
    {
      id: 1,
      name: "Ahmed Khan",
      atsScore: 94,
      email: "ahmed@example.com",
      phone: "+92 300 1234567",
      experience: "5 Years",
      education: "BS Computer Science",
      matchedSkills: [
        "Python",
        "FastAPI",
        "Docker",
        "PostgreSQL",
        "Git",
        "REST APIs",
      ],
      missingSkills: ["AWS", "Kubernetes"],
      strengths: [
        "Strong backend development experience",
        "Relevant education",
        "Excellent keyword match",
      ],
      improvements: [
        "Add cloud experience",
        "Mention Kubernetes projects",
        "Include measurable achievements",
      ],
    },
    {
      id: 2,
      name: "Sarah Ali",
      atsScore: 91,
      email: "sarah@example.com",
      phone: "+92 301 5551212",
      experience: "4 Years",
      education: "BS Software Engineering",
      matchedSkills: [
        "Java",
        "Spring Boot",
        "Docker",
        "SQL",
        "Git",
      ],
      missingSkills: ["AWS"],
      strengths: [
        "Excellent backend skills",
        "Strong project portfolio",
      ],
      improvements: [
        "Highlight leadership experience",
        "Add cloud certifications",
      ],
    },
    {
      id: 3,
      name: "John Smith",
      atsScore: 84,
      email: "john@example.com",
      phone: "+1 555 123456",
      experience: "3 Years",
      education: "BS Information Technology",
      matchedSkills: [
        "React",
        "TypeScript",
        "Node.js",
      ],
      missingSkills: [
        "Docker",
        "PostgreSQL",
      ],
      strengths: [
        "Strong frontend developer",
      ],
      improvements: [
        "Gain backend experience",
        "Improve database knowledge",
      ],
    },
    {
      id: 4,
      name: "Emily Davis",
      atsScore: 61,
      email: "emily@example.com",
      phone: "+1 555 987654",
      experience: "1 Year",
      education: "BS Computer Science",
      matchedSkills: [
        "HTML",
        "CSS",
      ],
      missingSkills: [
        "Python",
        "Docker",
        "Git",
        "FastAPI",
      ],
      strengths: [
        "Good communication",
      ],
      improvements: [
        "Build more technical projects",
        "Learn backend development",
      ],
    },
  ];

  const candidate = candidates.find(
    (c) => c.id === Number(id)
  );

  if (!candidate) {
    return (
      <div className="space-y-6 text-center">
        <h1 className="text-3xl font-bold">
          Candidate Not Found
        </h1>

        <Link to="/results">
          <Button>Back to Results</Button>
        </Link>
      </div>
    );
  }

  const recommendation =
    candidate.atsScore >= 85
      ? "Interview Recommended"
      : candidate.atsScore >= 70
      ? "Consider"
      : "Reject";

  const recommendationColor =
    candidate.atsScore >= 85
      ? "bg-green-100 text-green-700"
      : candidate.atsScore >= 70
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-700";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            {candidate.name}
          </h1>

          <p className="mt-1 text-slate-600 dark:text-slate-300">
            Detailed ATS analysis for this candidate.
          </p>
        </div>

        <Link to="/results">
          <Button>← Back to Results</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="ATS Score">
          <div className="flex flex-col items-center gap-5">
            <CircularProgress score={candidate.atsScore} />

            <span
              className={`rounded-full px-4 py-2 font-semibold ${recommendationColor}`}
            >
              {recommendation}
            </span>
          </div>
        </Card>

        <Card title="Candidate Information">
          <div className="space-y-3">
            <div>
              <strong>Email:</strong>
              <p className="text-slate-600 dark:text-slate-300">
                {candidate.email}
              </p>
            </div>

            <div>
              <strong>Phone:</strong>
              <p className="text-slate-600 dark:text-slate-300">
                {candidate.phone}
              </p>
            </div>

            <div>
              <strong>Experience:</strong>
              <p className="text-slate-600 dark:text-slate-300">
                {candidate.experience}
              </p>
            </div>

            <div>
              <strong>Education:</strong>
              <p className="text-slate-600 dark:text-slate-300">
                {candidate.education}
              </p>
            </div>
          </div>
        </Card>

        <Card title="Resume">
          <div className="flex h-full flex-col justify-between gap-4">
            <p className="text-slate-600 dark:text-slate-300">
              Original resume stored in MinIO.
            </p>

            <Button>
              Download Resume
            </Button>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Matched Skills">
          <div className="flex flex-wrap gap-3">
            {candidate.matchedSkills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700"
              >
                {skill}
              </span>
            ))}
          </div>
        </Card>

        <Card title="Missing Skills">
          <div className="flex flex-wrap gap-3">
            {candidate.missingSkills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-red-100 px-4 py-2 text-sm font-medium text-red-700"
              >
                {skill}
              </span>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Strengths">
          <ul className="list-disc space-y-2 pl-6">
            {candidate.strengths.map((strength) => (
              <li key={strength}>
                {strength}
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Recommendations">
          <ul className="list-disc space-y-2 pl-6">
            {candidate.improvements.map((item) => (
              <li key={item}>
                {item}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

export default CandidateDetails;