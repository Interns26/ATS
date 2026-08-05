# Workspace Agent Rules & Guidelines (ATS System)

This repository contains an end-to-end Automated Applicant Tracking System (ATS) built with FastAPI, PostgreSQL, MinIO Storage, LangGraph AI workflows, and two React Vite frontend applications.

---

## 1. Project Architecture & Structure

```text
ATS/
├── .agents/
│   └── AGENTS.md               # Workspace guidelines & rules for AI assistants
├── backend/                     # FastAPI backend & LangGraph workflow engine
│   ├── app/
│   │   ├── routers/            # FastAPI routes (auth, jobs, analyze, storage, resumes)
│   │   ├── services/           # Database (PostgreSQL) and Storage (MinIO) services
│   ├── workflow/               # LangGraph AI evaluation pipeline (graph, nodes, prompts, models)
├── recruiter-portal/           # Recruiter & HR Admin React Application (Port 5173 / 3000)
├── candidate-portal/           # Candidate Job Portal React Application (Port 5174 / 3001)
├── docker-compose.yml          # Container configuration for PostgreSQL & MinIO
└── README.md                   # Setup instructions & API documentation
```

---

## 2. Proprietary Copyright Notice

All source code files across `backend/`, `recruiter-portal/`, and `candidate-portal/` must maintain the following copyright header:

```python
# Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.
```

*(For TypeScript/React files, use standard `/* ... */` comment block at the top).*

---

## 3. Role-Based Navigation & Access Control

The Recruiter Portal implements strict role-based access control (RBAC):

1. **HR Admin (`role: hr_admin`)**:
   - **Accessible Routes**: `/approval` and `/recruiter`.
   - **Key Duties**: Reviewing pending job postings, approving jobs, creating MinIO buckets, deleting rejected postings.
   - **Redirect Rule**: Attempting to access `/` or `/results` automatically redirects HR Admin to `/approval`.

2. **Team Lead / Recruiter (`role: team_lead`)**:
   - **Accessible Routes**: `/` (Home), `/recruiter`, `/results`, `/candidate/:id`.
   - **Key Duties**: Creating job postings, selecting Team Lead from database, uploading/filtering candidate resumes, running AI ATS analysis.
   - **Redirect Rule**: Attempting to access `/approval` automatically redirects Team Leads to `/`.

---

## 4. LangGraph AI Evaluation Workflow

The backend AI pipeline in `backend/workflow/` runs on **LangGraph** using `Llama 3.3 70B` (Groq) with fallback to `Gemini 2.5 Flash`.

### Job Description Formatting
Job descriptions are split into 3 distinct sections in forms and combined into a single unified block for AI evaluation:
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

### ATS Score Calculation Formula
The overall compatibility score ($0 - 100\%$) is computed as:
$$\text{ATS Score} = (\text{Skills Match Ratio} \times 40) + (\text{Requirements Match Ratio} \times 40) + (\text{LLM Score} \times 20)$$

- **Skills Match (40%)**: Compares technical tools with technology synonym recognition (e.g. `React` = `React.js`, `Postgres` = `PostgreSQL`).
- **Requirements Match (40%)**: Verifies candidates against explicit responsibilities & qualifications.
- **LLM Holistic Fit (20%)**: Evaluates project complexity, career growth, and estimated years of experience.

---

## 5. Development & Testing Commands

- **Backend Syntax Check**: `python -m py_compile app/routers/*.py workflow/*.py`
- **Recruiter Portal Build Check**: `cmd /c npx vite build` (inside `recruiter-portal/`)
- **Candidate Portal Build Check**: `cmd /c npx vite build` (inside `candidate-portal/`)
