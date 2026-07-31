import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Send, CheckCircle2 } from "lucide-react";
import { Header } from "../components/Header";
import { StepIndicator, type Step } from "../components/form/StepIndicator";
import { BasicInfoStep } from "../components/form-steps/BasicInfoStep";
import { QualificationsStep } from "../components/form-steps/QualificationsStep";
import { WorkExperienceStep } from "../components/form-steps/WorkExperienceStep";
import { ResumeStep } from "../components/form-steps/ResumeStep";
import { mockJobs } from "../data/mockJobs";
import {
  emptyBasicInfo,
  emptyQualification,
  emptyWorkExperience,
  type ApplicationFormData,
} from "../types/application";

const steps: Step[] = [
  { key: "basic", label: "Basic Info" },
  { key: "qualifications", label: "Qualifications" },
  { key: "experience", label: "Work Experience" },
  { key: "resume", label: "Resume" },
];

function isBasicInfoValid(data: ApplicationFormData) {
  const b = data.basicInfo;
  return !!(b.email && b.firstName && b.lastName && b.city && b.mobileNumber);
}

function isQualificationsValid(data: ApplicationFormData) {
  return data.qualifications.every(
    (q) => q.qualification && q.subject && q.institute && q.grade && q.graduationYear
  );
}

function isWorkExperienceValid(data: ApplicationFormData) {
  return data.workExperience.every(
    (w) => w.jobField && w.organization && w.jobTitle && (w.currentlyWorking || w.endDate)
  );
}

export function ApplicationForm() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const job = mockJobs.find((j) => j.id === jobId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<ApplicationFormData>({
    basicInfo: emptyBasicInfo,
    qualifications: [emptyQualification()],
    workExperience: [emptyWorkExperience()],
    resumeFile: null,
  });

  if (!job) {
    return (
      <div className="min-h-screen bg-ink-50">
        <Header />
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <p className="text-ink-500">This job posting couldn't be found.</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 text-sm font-semibold text-primary-800 hover:underline"
          >
            Back to all openings
          </button>
        </div>
      </div>
    );
  }

  const canGoNext = () => {
    switch (steps[currentIndex].key) {
      case "basic":
        return isBasicInfoValid(formData);
      case "qualifications":
        return isQualificationsValid(formData);
      case "experience":
        return isWorkExperienceValid(formData);
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentIndex < steps.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleSubmit = () => {
    // NOTE: no backend call yet — this is local-state only (Chunk 5).
    // Chunk 8 will wire this to POST /applications.
    console.log("Application submitted (local only):", formData);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-ink-50">
        <Header />
        <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center">
          <CheckCircle2 size={48} className="mb-4 text-status-open" />
          <h1
            className="text-2xl font-bold text-ink-900"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Application submitted
          </h1>
          <p className="mt-2 text-ink-500">
            Thanks for applying to <strong>{job.title}</strong>. We'll be in
            touch if your profile is a good fit.
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-6 rounded-lg bg-primary-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-900"
          >
            Back to all openings
          </button>
        </div>
      </div>
    );
  }

  const currentStep = steps[currentIndex];

  return (
    <div className="min-h-screen bg-ink-50">
      <Header />

      <div className="mx-auto max-w-5xl px-6 py-10">
        <button
          onClick={() => navigate(`/jobs/${job.id}`)}
          className="mb-6 flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-primary-800"
        >
          <ArrowLeft size={16} />
          {job.title}
        </button>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-[220px_1fr]">
          <div className="hidden md:block">
            <StepIndicator steps={steps} currentIndex={currentIndex} />
          </div>

          {/* mobile step indicator: simple text */}
          <div className="mb-2 text-sm font-medium text-ink-500 md:hidden">
            Step {currentIndex + 1} of {steps.length} — {currentStep.label}
          </div>

          <div className="rounded-xl border border-ink-100 bg-white p-6 shadow-sm sm:p-8">
            {currentStep.key === "basic" && (
              <BasicInfoStep
                value={formData.basicInfo}
                onChange={(basicInfo) => setFormData({ ...formData, basicInfo })}
              />
            )}
            {currentStep.key === "qualifications" && (
              <QualificationsStep
                value={formData.qualifications}
                onChange={(qualifications) =>
                  setFormData({ ...formData, qualifications })
                }
              />
            )}
            {currentStep.key === "experience" && (
              <WorkExperienceStep
                value={formData.workExperience}
                onChange={(workExperience) =>
                  setFormData({ ...formData, workExperience })
                }
              />
            )}
            {currentStep.key === "resume" && (
              <ResumeStep
                value={formData.resumeFile}
                onChange={(resumeFile) => setFormData({ ...formData, resumeFile })}
              />
            )}

            <div className="mt-8 flex items-center justify-between border-t border-ink-100 pt-6">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="flex items-center gap-1.5 rounded-lg border border-ink-200 px-4 py-2.5 text-sm font-medium text-ink-700 transition hover:border-primary-600 hover:text-primary-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft size={16} />
                Previous
              </button>

              {currentIndex < steps.length - 1 ? (
                <button
                  onClick={handleNext}
                  disabled={!canGoNext()}
                  className="flex items-center gap-1.5 rounded-lg bg-primary-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!formData.resumeFile}
                  className="flex items-center gap-1.5 rounded-lg bg-accent-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send size={16} />
                  Apply Now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
