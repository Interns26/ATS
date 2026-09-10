/**
 * Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.
 */

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Send,
  CheckCircle2,
} from "lucide-react";

import { Header } from "../components/Header";
import {
  StepIndicator,
  type Step,
} from "../components/form/StepIndicator";

import { BasicInfoStep } from "../components/form-steps/BasicInfoStep";
import { QualificationsStep } from "../components/form-steps/QualificationsStep";
import { WorkExperienceStep } from "../components/form-steps/WorkExperienceStep";
import { ResumeStep } from "../components/form-steps/ResumeStep";

import {
  fetchJob,
  submitApplication,
  fetchCurrentUser,
} from "../services/api";

import { getToken } from "../lib/auth";

import type { Job } from "../types/job";

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


// ─────────────────────────────────────────────────────────
// Basic Information Validation
// ─────────────────────────────────────────────────────────

function isBasicInfoValid(data: ApplicationFormData) {
  const b = data.basicInfo;

  return (
    // Candidate Information
    Boolean(b.email?.trim()) &&
    Boolean(b.firstName?.trim()) &&
    Boolean(b.lastName?.trim()) &&

    // Address
    Boolean(b.city?.trim()) &&

    // Contact Information
    Boolean(b.mobileNumber?.trim()) &&
    b.mobileNumber.replace(/\D/g, "").length === 10 &&

    // Professional Information
    Boolean(b.cnic?.trim()) &&
    b.cnic.replace(/\D/g, "").length === 13 &&
    Boolean(b.yearsOfExperience?.trim()) &&
    Boolean(b.currentJobTitle?.trim()) &&
    Boolean(b.currentEmployer?.trim())
  );
}


// ─────────────────────────────────────────────────────────
// Qualifications Validation
// ─────────────────────────────────────────────────────────

function isQualificationsValid(data: ApplicationFormData) {
  return data.qualifications.every(
    (q) =>
      q.qualification &&
      q.subject &&
      q.institute &&
      q.grade &&
      q.graduationYear
  );
}


// ─────────────────────────────────────────────────────────
// Work Experience Validation
// ─────────────────────────────────────────────────────────

function isWorkExperienceValid(data: ApplicationFormData) {
  return data.workExperience.every(
    (w) =>
      w.jobField &&
      w.organization &&
      w.jobTitle &&
      (w.currentlyWorking || w.endDate)
  );
}


export function ApplicationForm() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [formData, setFormData] =
    useState<ApplicationFormData>({
      basicInfo: emptyBasicInfo,
      qualifications: [emptyQualification()],
      workExperience: [emptyWorkExperience()],
      resumeFile: null,
    });


  // ─────────────────────────────────────────────────────────
  // Fetch job
  // ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!jobId) return;

    fetchJob(jobId)
      .then(setJob)
      .catch(() => setJob(null));
  }, [jobId]);


  // ─────────────────────────────────────────────────────────
  // Load logged-in candidate information
  // ─────────────────────────────────────────────────────────

  useEffect(() => {
    const token = getToken();

    if (token) {
      fetchCurrentUser(token)
        .then((userData) => {
          if (userData && userData.role === "candidate") {
            setFormData((prev) => ({
              ...prev,

              basicInfo: {
                ...prev.basicInfo,

                email:
                  userData.email ||
                  prev.basicInfo.email,

                firstName:
                  userData.first_name ||
                  prev.basicInfo.firstName,

                lastName:
                  userData.last_name ||
                  prev.basicInfo.lastName,

                city:
                  userData.city ||
                  prev.basicInfo.city,

                stateProvince:
                  userData.state_province ||
                  prev.basicInfo.stateProvince,

                mobileNumber:
                  userData.mobile_number ||
                  prev.basicInfo.mobileNumber,

                cnic:
                  userData.cnic ||
                  prev.basicInfo.cnic,
              },
            }));
          }
        })
        .catch(() => {});
    }
  }, []);


  // ─────────────────────────────────────────────────────────
  // Validation
  // ─────────────────────────────────────────────────────────

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


  // ─────────────────────────────────────────────────────────
  // Navigation
  // ─────────────────────────────────────────────────────────

  const handleNext = () => {
    // Extra validation check.
    // The user cannot move forward if the
    // current section is incomplete.
    if (!canGoNext()) {
      return;
    }

    if (currentIndex < steps.length - 1) {
      setCurrentIndex(currentIndex + 1);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };


  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };


  // ─────────────────────────────────────────────────────────
  // Submit application
  // ─────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!formData.resumeFile || !jobId) return;

    setSubmitError(null);
    setSubmitting(true);

    try {
      await submitApplication(jobId, {
        basicInfo: formData.basicInfo,
        qualifications: formData.qualifications,
        workExperience: formData.workExperience,
        resumeFile: formData.resumeFile,
      });

      setSubmitted(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };


  // ─────────────────────────────────────────────────────────
  // Submitted screen
  // ─────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f5f5f5]">

        <Header />

        <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-2xl items-center justify-center px-4 py-12 sm:px-6">

          <div className="w-full overflow-hidden rounded-lg bg-white shadow-sm">

            {/* Accent bar */}
            <div className="h-2 bg-primary-800" />

            <div className="px-6 py-12 text-center sm:px-10">

              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">

                <CheckCircle2
                  size={36}
                  className="text-status-open"
                />

              </div>

              <h1
                className="text-2xl font-semibold text-ink-900 sm:text-3xl"
                style={{
                  fontFamily: "var(--font-display)",
                }}
              >
                Application submitted
              </h1>

              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-ink-500 sm:text-base">

                Thanks for applying to{" "}

                <strong className="font-semibold text-ink-700">
                  {job?.title || jobId}
                </strong>

                . We'll be in touch if your profile is a good fit.

              </p>

              <button
                onClick={() => navigate("/")}
                className="mt-7 rounded-md bg-primary-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-900"
              >
                Back to all openings
              </button>

            </div>

          </div>

        </main>

      </div>
    );
  }


  const currentStep = steps[currentIndex];


  return (
    <div className="min-h-screen bg-[#f5f5f5]">

      <Header />

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">

        {/* ─────────────────────────────────────────────────
            Back to job
        ───────────────────────────────────────────────── */}

        <button
          onClick={() =>
            navigate(
              jobId
                ? `/jobs/${jobId}`
                : "/"
            )
          }
          className="mb-5 flex items-center gap-2 text-sm font-medium text-ink-500 transition hover:text-primary-800"
        >

          <ArrowLeft size={16} />

          <span>
            {job?.title || "Back to job details"}
          </span>

        </button>


        {/* ─────────────────────────────────────────────────
            Main Microsoft Forms card
        ───────────────────────────────────────────────── */}

        <div className="overflow-hidden rounded-lg bg-white shadow-sm">

          {/* Top accent bar */}
          <div className="h-2 bg-primary-800" />


          {/* ───────────────────────────────────────────────
              Form Header
          ─────────────────────────────────────────────── */}

          <div className="border-b border-ink-100 px-6 py-7 sm:px-10 sm:py-8">

            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary-800">
              Job Application
            </p>

            <h1
              className="text-2xl font-semibold leading-tight text-ink-900 sm:text-3xl"
              style={{
                fontFamily: "var(--font-display)",
              }}
            >
              {job?.title || "Application Form"}
            </h1>

            {job?.department && (
              <p className="mt-2 text-sm text-ink-500">
                {job.department}
              </p>
            )}

            <p className="mt-4 max-w-2xl text-sm leading-6 text-ink-500">
              Please complete the following information to apply
              for this position. Fields marked as required must be
              completed before continuing.
            </p>

          </div>


          {/* ───────────────────────────────────────────────
              MOBILE STEP INDICATOR
          ─────────────────────────────────────────────── */}

          <div className="border-b border-ink-100 bg-[#fafafa] px-6 py-5 md:hidden">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs font-medium text-ink-400">
                  Step {currentIndex + 1} of {steps.length}
                </p>

                <p className="mt-1 text-sm font-semibold text-ink-800">
                  {currentStep.label}
                </p>

              </div>

              <span className="text-xs font-medium text-ink-400">

                {Math.round(
                  ((currentIndex + 1) /
                    steps.length) *
                    100
                )}

                %

              </span>

            </div>


            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-100">

              <div
                className="h-full rounded-full bg-primary-800 transition-all duration-300"
                style={{
                  width: `${
                    ((currentIndex + 1) /
                      steps.length) *
                    100
                  }%`,
                }}
              />

            </div>

          </div>


          {/* ───────────────────────────────────────────────
              DESKTOP TWO-COLUMN AREA
          ─────────────────────────────────────────────── */}

          <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)]">


            {/* ─────────────────────────────────────────────
                LEFT SIDE — STEP NAVIGATION
            ───────────────────────────────────────────── */}

            <aside className="hidden border-r border-ink-100 bg-[#fafafa] md:block">

              <div className="sticky top-24 px-5 py-8">

                <p className="mb-6 px-2 text-xs font-semibold uppercase tracking-wider text-ink-400">
                  Application Steps
                </p>

                <StepIndicator
                  steps={steps}
                  currentIndex={currentIndex}
                />

              </div>

            </aside>


            {/* ─────────────────────────────────────────────
                RIGHT SIDE — FORM
            ───────────────────────────────────────────── */}

            <section className="min-w-0">

              {/* Form content */}
              <div className="px-6 py-7 sm:px-10 sm:py-9">

                {/* Current section heading */}
                <div className="mb-7">

                  <h2
                    className="text-xl font-semibold text-ink-900"
                    style={{
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    {currentStep.label}
                  </h2>

                  <div className="mt-2 h-0.5 w-12 bg-primary-800" />

                </div>


                {/* ─────────────────────────────────────────
                    Basic Information
                ───────────────────────────────────────── */}

                {currentStep.key === "basic" && (
                  <BasicInfoStep
                    value={formData.basicInfo}
                    onChange={(basicInfo) =>
                      setFormData({
                        ...formData,
                        basicInfo,
                      })
                    }
                  />
                )}


                {/* ─────────────────────────────────────────
                    Qualifications
                ───────────────────────────────────────── */}

                {currentStep.key === "qualifications" && (
                  <QualificationsStep
                    value={formData.qualifications}
                    onChange={(qualifications) =>
                      setFormData({
                        ...formData,
                        qualifications,
                      })
                    }
                  />
                )}


                {/* ─────────────────────────────────────────
                    Work Experience
                ───────────────────────────────────────── */}

                {currentStep.key === "experience" && (
                  <WorkExperienceStep
                    value={formData.workExperience}
                    onChange={(workExperience) =>
                      setFormData({
                        ...formData,
                        workExperience,
                      })
                    }
                  />
                )}


                {/* ─────────────────────────────────────────
                    Resume
                ───────────────────────────────────────── */}

                {currentStep.key === "resume" && (
                  <ResumeStep
                    value={formData.resumeFile}
                    onChange={(resumeFile) =>
                      setFormData({
                        ...formData,
                        resumeFile,
                      })
                    }
                  />
                )}


                {/* Submit error */}
                {submitError && (
                  <div
                    className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3"
                    role="alert"
                  >

                    <p className="text-sm text-red-600">
                      {submitError}
                    </p>

                  </div>
                )}

              </div>


              {/* ───────────────────────────────────────────
                  Navigation Footer
              ─────────────────────────────────────────── */}

              <div className="border-t border-ink-100 bg-[#fafafa] px-6 py-5 sm:px-10">

                <div className="flex items-center justify-between gap-4">

                  {/* Previous */}
                  <button
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    className="flex items-center gap-2 rounded-md border border-ink-200 bg-white px-4 py-2.5 text-sm font-medium text-ink-700 transition hover:border-primary-600 hover:text-primary-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >

                    <ArrowLeft size={16} />

                    <span className="hidden sm:inline">
                      Previous
                    </span>

                  </button>


                  {/* Step counter */}
                  <span className="hidden text-xs text-ink-400 sm:block">
                    {currentIndex + 1} / {steps.length}
                  </span>


                  {/* Next / Apply */}
                  {currentIndex < steps.length - 1 ? (

                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={!canGoNext()}
                      className="flex items-center gap-2 rounded-md bg-primary-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-900 disabled:cursor-not-allowed disabled:opacity-40"
                    >

                      <span>
                        Next
                      </span>

                      <ArrowRight size={16} />

                    </button>

                  ) : (

                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={
                        !formData.resumeFile ||
                        submitting
                      }
                      className="flex items-center gap-2 rounded-md bg-accent-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >

                      <Send size={16} />

                      <span>
                        {submitting
                          ? "Submitting…"
                          : "Apply Now"}
                      </span>

                    </button>

                  )}

                </div>

              </div>

            </section>

          </div>

        </div>


        {/* ─────────────────────────────────────────────────
            Footer information
        ───────────────────────────────────────────────── */}

        <p className="mt-5 text-center text-xs text-ink-400">
          Your information will be used only for recruitment
          purposes.
        </p>

      </main>

    </div>
  );
}