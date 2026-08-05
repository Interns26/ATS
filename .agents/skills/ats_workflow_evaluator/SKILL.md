---
name: ats_workflow_evaluator
description: Operational instructions and guidelines for managing the ATS job posting lifecycle, candidate resume ingestion, MinIO storage buckets, and LangGraph AI evaluations.
---

# ATS Workflow & Candidate Evaluator Skill

This skill provides step-by-step instructions for operating, debugging, and extending the Automated Applicant Tracking System (ATS).

---

## 1. Job Description Structure & Formatting

Whenever creating or editing a job posting, split details into three distinct input fields:

1. **Job Summary**: High-level overview of the role and team.
2. **Responsibilities**: Key duties and responsibilities (one bullet point per line).
3. **Requirements**: Technical skills, qualifications, and experience level (one bullet point per line).

When submitted to the LangGraph AI pipeline, combine them into this unified text format:

```text
JOB TITLE: [Job Title]

ROLE SUMMARY:
[Summary text]

KEY RESPONSIBILITIES:
- [Responsibility 1]
- [Responsibility 2]

REQUIRED QUALIFICATIONS & SKILLS:
- [Requirement 1]
- [Requirement 2]
```

---

## 2. Role-Based Navigation & Access Control

Ensure strict RBAC behavior across portals:

- **HR Admin (`role: hr_admin`)**:
  - Accessible pages: `/approval` and `/recruiter`.
  - Duties: Reviewing unapproved jobs, approving postings (which creates MinIO bucket `job-<id>`), deleting rejected postings.
- **Team Lead (`role: team_lead`)**:
  - Accessible pages: `/` (Home), `/recruiter`, and `/results`.
  - Duties: Creating job postings (selecting Team Lead from DB), loading candidate resumes, and executing AI ATS analysis.

---

## 3. LangGraph AI Evaluation & Scoring Formula

The backend evaluation in `backend/workflow/` executes a 3-node LangGraph pipeline (`extract_text_node` -> `parse_resume_node` -> `ats_node`):

1. **Primary LLM**: `Llama 3.3 70B` via ChatGroq with zero temperature.
2. **Fallback LLM**: `Gemini 2.5 Flash` via ChatGoogleGenerativeAI if primary LLM rate limits occur.
3. **ATS Compatibility Formula**:
   $$\text{ATS Score} = (\text{Skills Match Ratio} \times 40) + (\text{Requirements Match Ratio} \times 40) + (\text{LLM Score} \times 20)$$
4. **Technology Synonym Matching**: Matches equivalent skills (e.g. `React` = `React.js`, `Postgres` = `PostgreSQL`, `Python` = `FastAPI/PyTorch`).

---

## 4. Cache Management & Re-Analysis

- **Result Caching**: Calculated ATS scores and parsed resumes are cached in PostgreSQL `resume_analysis` table keyed by `email + job_id`.
- **Clearing Cache**: Call `DELETE /analyze/cache/{bucket_name}` or use the **Clear Analysis Results from DB** button on the home page.
- **Force Re-analysis**: Pass `force=true` query parameter on `POST /analyze/{bucket_name}` to automatically wipe cache and execute a fresh pipeline.

---

## 5. Verification Commands

Run the following commands to verify system integrity after edits:

```bash
# Backend python compilation check
python -m py_compile app/routers/*.py workflow/*.py

# Recruiter portal production build check
cmd /c npx vite build (inside recruiter-portal/)

# Candidate portal production build check
cmd /c npx vite build (inside candidate-portal/)
```
