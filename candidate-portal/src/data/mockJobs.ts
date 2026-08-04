/**
 * Copyright (c) 2026 Uworx UK. All rights reserved.
 */

/**
 * MOCK DATA — used until the real `GET /jobs` API is wired up
 * (pending decision on shared DB vs. admin-portal API).
 * Swap `mockJobs` for a real fetch call in src/lib/api.ts once ready —
 * nothing in the components below needs to change, they just consume `Job[]`.
 */
import type { Job } from "../types/job";

export const mockJobs: Job[] = [
  {
    id: "job_001",
    title: "AI/ML Engineer",
    location: "Faisalabad, Pakistan",
    employmentType: "Permanent",
    openingDate: "2026-06-01",
    closingDate: "2026-07-31",
    department: "Engineering",
    description:
      "Build and deploy machine learning models that power core product features, from data pipelines to production inference.",
    responsibilities: [
      "Design and train ML models for production use cases",
      "Build data pipelines for model training and evaluation",
      "Collaborate with backend engineers to deploy models at scale",
    ],
    requirements: [
      "3+ years experience in ML/AI engineering",
      "Strong Python skills, experience with PyTorch or TensorFlow",
      "Familiarity with MLOps practices",
    ],
  },
  {
    id: "job_002",
    title: "HR Associate / Intern",
    location: "Faisalabad, Pakistan",
    employmentType: "Internship",
    openingDate: "2026-06-01",
    closingDate: "2026-07-31",
    department: "People Operations",
    description:
      "Support the HR team with recruitment coordination, onboarding, and day-to-day people operations.",
    responsibilities: [
      "Coordinate interview scheduling with candidates and hiring managers",
      "Assist with onboarding new hires",
      "Maintain accurate candidate and employee records",
    ],
    requirements: [
      "Currently pursuing or recently completed a degree in HR, Business, or related field",
      "Strong communication skills",
      "Comfortable working with spreadsheets and HR software",
    ],
  },
  {
    id: "job_003",
    title: "Scrum Master",
    location: "Faisalabad, Pakistan",
    employmentType: "Permanent",
    openingDate: "2026-03-02",
    closingDate: "2026-07-31",
    department: "Product & Engineering",
    description:
      "Facilitate agile ceremonies and help engineering teams ship reliably, removing blockers along the way.",
    responsibilities: [
      "Facilitate sprint planning, standups, and retrospectives",
      "Identify and remove blockers for the engineering team",
      "Track and report on sprint velocity and delivery health",
    ],
    requirements: [
      "2+ years as a Scrum Master or Agile Coach",
      "Certified Scrum Master (CSM) preferred",
      "Excellent facilitation and conflict-resolution skills",
    ],
  },
  {
    id: "job_004",
    title: "Trainee / Junior Scrum Master",
    location: "Faisalabad, Pakistan",
    employmentType: "Permanent",
    openingDate: "2026-03-02",
    closingDate: "2026-07-31",
    department: "Product & Engineering",
    description:
      "An entry-level opportunity to grow into an agile delivery role, working alongside senior Scrum Masters.",
    responsibilities: [
      "Support senior Scrum Masters in running ceremonies",
      "Help maintain sprint boards and backlogs",
      "Learn agile delivery practices hands-on",
    ],
    requirements: [
      "Fresh graduate or up to 1 year of experience",
      "Interest in agile/scrum methodologies",
      "Strong organizational skills",
    ],
  },
];
