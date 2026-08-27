# ATS Resume Analyzer & Talent Acquisition System

**Uworx UK** • AI-Powered Applicant Tracking & Candidate Portal System

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![MinIO](https://img.shields.io/badge/MinIO-Object_Storage-C42E35?style=flat&logo=minio&logoColor=white)](https://min.io/)

> **Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.**

---

## Executive Overview

The **ATS Resume Analyzer & Talent Acquisition System** is an enterprise-grade recruiting platform designed for **Uworx UK**. It features a modern Candidate Portal for job applications, a comprehensive Recruiter Portal for job posting management, HR approvals, AI candidate scoring, and a Candidate Database Manager — all backed by a high-performance FastAPI backend, PostgreSQL, MinIO Object Storage, and LangGraph AI evaluation pipelines.

---

## Key Features

### 🏢 Recruiter Portal (`recruiter-portal/`)
- **ATS Resume Scoring & AI Recommendation**: Scores candidate resumes against job descriptions using LangGraph AI pipelines with configurable decision bounds (**Interview ≥ 70%**, **Consider ≥ 50%**, **Reject < 50%** by default).
- **Real Candidate & Resume Filtering**: Dynamic constraints filter applicants by **CGPA** (`<=`, `>=`, `=`) and **University** (dynamically extracted from loaded resumes, plus an `Other` free-text option).
- **Recruiter Job Posting**: Post new job openings (`/recruiter`) capturing job summary, key responsibilities, and required qualifications with a dedicated Team Lead selector.
- **HR Approval Queue & Storage Provisioning**: HR review queue (`/approval`) for approving job postings, which automatically provisions dedicated MinIO storage buckets named after the job title (e.g. `senior-backend-engineer-a1b2c3`) for candidate resume uploads.
- **Automatic Storage Lifecycle**: Deleting a job posting automatically purges its dedicated MinIO storage bucket and all stored resume files.
- **Candidate Database Manager** (`/candidates`): View, search, edit, and delete all candidate records stored in the system. Export the full candidate dataset as a formatted `.xlsx` workbook (Google Sheets compatible).
- **Analysis Caching**: ATS results are cached per candidate-email × job in PostgreSQL. Re-running analysis returns cached results instantly; a **Force Re-analyze** option clears the cache first.

### 👤 Candidate Portal (`candidate-portal/`)
- **Job Openings Showcase**: Browse live approved job positions with real-time search.
- **Multi-Step Application Submission**: Interactive 4-step application form capturing contact info, qualifications, work experience, and resume upload (PDF or DOCX).
- **Email Deduplication**: Submitting an application for an existing email reuses the existing candidate record and updates their personal info, rather than creating a duplicate entry.
- **Candidate Authentication & Session Persistence**: Email/Password registration and login with session persistence stored in browser `localStorage` (`ats:token`).
- **Google OAuth 2.0 Sign-In**: One-click candidate registration and sign-in using Google Identity Services (GIS SDK).
- **Auto Pre-Fill**: Logged-in candidates have their contact information auto-populated into application forms.

### ⚡ FastAPI Backend (`backend/`)
- **JWT Role-Based Access Control**: Secure JWT authentication supporting `hr_admin`, `team_lead`, and `candidate` roles.
- **PostgreSQL Database Schema**: Relational storage for candidates, job postings, applications, qualifications, work experience, ATS analysis cache, and team lead accounts.
- **MinIO Object Storage Integration**: Per-job bucket management and streaming file downloads for candidate resumes. Bucket names are derived from the job title slug for easy identification.
- **Human-Readable File Naming**: Resume files stored in MinIO are named after the candidate (e.g. `john-smith-a1b2c3.pdf`) for easy identification.
- **LangGraph AI Resume Evaluation**: Deterministic resume parsing, canonical skill matching, 1-to-1 requirement verification, and holistic fit scoring using Llama 3.3 70B via Groq.
- **Parallel Processing**: Up to 5 resumes processed simultaneously per analysis run via `ThreadPoolExecutor`.

---

## ATS AI Scoring & Evaluation Formula

The AI evaluation engine computes a balanced compatibility score ($0 - 100\%$) for each candidate:

$$\text{ATS Score} = (\text{Skills Match Ratio} \times 40) + (\text{Requirements Match Ratio} \times 40) + (\text{LLM Score} \times 20)$$

- **Skills Match (40%)**: Compares candidate technical tools with canonical technology synonym recognition (e.g. `React` = `React.js`, `Postgres` = `PostgreSQL`). Deduplicates skills case-insensitively for score stability.
- **Requirements Match (40%)**: Verifies candidate evidence against explicit job responsibilities & qualifications on a strict 1-to-1 bullet basis.
- **LLM Holistic Fit (20%)**: Evaluates overall project complexity, growth trajectory, and experience alignment.

### Recommendation Thresholds
| Score | Recommendation |
| :--- | :--- |
| ≥ 70% | **Interview** |
| 50% – 69% | **Consider** |
| < 50% | **Reject** |

Thresholds are configurable per analysis run from the Home page.

---

## Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Vanilla CSS, TailwindCSS (candidate portal), Lucide Icons |
| **Backend** | Python 3.11+, FastAPI, Uvicorn, Pydantic v2 |
| **Authentication** | JWT (`python-jose`), Bcrypt (`passlib`), Google Identity Services (`google-auth`) |
| **Database & Storage** | PostgreSQL (`psycopg2`), MinIO Python SDK |
| **AI Workflow** | LangGraph, Groq LLM API (Llama 3.3 70B), PyMuPDF / pdfplumber |
| **Export** | `openpyxl` (Excel .xlsx generation) |
| **DevOps & Containers** | Docker, Docker Compose |

---

## Architecture & Project Structure

```text
ATS/
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── analyze.py        # LangGraph AI scoring endpoint + cache management
│   │   │   ├── applications.py   # Candidate application submission (email-deduplicating)
│   │   │   ├── auth.py           # JWT, Team Lead, Candidate & Google OAuth endpoints
│   │   │   ├── buckets.py        # MinIO bucket listing
│   │   │   ├── candidates.py     # Candidate database CRUD + .xlsx export
│   │   │   ├── documents.py      # Text extraction from PDF/DOCX (for JD upload)
│   │   │   ├── jobs.py           # Public, Recruiter & HR Approval job endpoints
│   │   │   ├── resumes.py        # MinIO resume retrieval & downloads
│   │   │   └── storage.py        # MinIO file management (default bucket)
│   │   ├── services/
│   │   │   ├── auth.py           # Password hashing & JWT token generation
│   │   │   ├── database.py       # PostgreSQL connection pool & schema init
│   │   │   └── storage.py        # MinIO SDK client operations
│   │   ├── dependencies.py       # Auth dependencies (get_current_user)
│   │   └── main.py               # FastAPI entry point & CORS configuration
│   ├── workflow/                 # LangGraph AI evaluation nodes, prompts & graph
│   ├── .env.example
│   └── requirements.txt
│
├── candidate-portal/
│   ├── src/
│   │   ├── components/           # Header, GoogleAuthButton, LoginModal, RegisterModal, form steps
│   │   ├── pages/                # JobListings, JobDetail, ApplicationForm, LoginPage, EditProfile
│   │   ├── services/             # API services for auth & job applications
│   │   └── lib/                  # JWT token storage helpers (localStorage ats:token)
│   ├── .env.example
│   └── package.json
│
├── recruiter-portal/
│   ├── src/
│   │   ├── components/           # Navbar, Button, Card, Select, CircularProgress, LoadingOverlay
│   │   ├── pages/                # Home (ATS Analyzer), Recruiter, Approval, Candidates, CandidateDetails, Results
│   │   └── services/             # API services for jobs, buckets, resumes, candidates & analysis
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

## Prerequisites

Before starting, ensure you have installed:

- **Git**
- **Python 3.11+**
- **Node.js (v18+)** & `npm`
- **Docker Desktop** (for PostgreSQL and MinIO)

---

## Environment Setup

### 1. Backend Environment (`backend/.env`)

Create `backend/.env`:

```env
# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=ats_db
POSTGRES_USER=ats
POSTGRES_PASSWORD=ats_password

# MinIO Object Storage
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=admin12345
MINIO_SECURE=false
MINIO_BUCKET=resumes

# Security & JWT
JWT_SECRET_KEY=your_random_super_secret_jwt_key_here
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$12$j0t0VP6Q58AtwCj47PJGVerSuVZyKMBg.4WZaohCgV78H.2ayG0Ye

# AI Provider API Keys
GROQ_API_KEY=gsk_your_groq_api_key_here
GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
```

### 2. Candidate Portal Environment (`candidate-portal/.env`)

Create `candidate-portal/.env`:

```env
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
```

---

## Installation & Quickstart

### Step 1: Start PostgreSQL and MinIO Containers

```bash
docker-compose up -d
```

Verify containers are running:
- **MinIO Console**: `http://localhost:9001` (Credentials: `admin` / `admin12345`)
- **PostgreSQL**: `localhost:5432`

---

### Step 2: Set Up Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# Linux/macOS:
source .venv/bin/activate

# Install dependencies (includes openpyxl for .xlsx export)
pip install -r requirements.txt

# Start FastAPI dev server
python -m uvicorn app.main:app --reload --port 8000
```

FastAPI server endpoints:
- **API Server**: `http://localhost:8000`
- **Swagger Documentation**: `http://localhost:8000/docs`

---

### Step 3: Set Up Recruiter Portal

In a new terminal:

```bash
cd recruiter-portal
npm install
npm run dev
```

Recruiter Portal will open at `http://localhost:5173`.

---

### Step 4: Set Up Candidate Portal

In a new terminal:

```bash
cd candidate-portal
npm install
npm run dev
```

Candidate Portal will open at `http://localhost:5174`.

---

## API Documentation Overview

### 🔐 Auth Endpoints (`/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/login` | HR Admin or Team Lead login |
| `POST` | `/auth/candidate/register` | Candidate email/password registration |
| `POST` | `/auth/candidate/login` | Candidate email/password login |
| `POST` | `/auth/google` | Candidate Google OAuth 2.0 sign-in |
| `GET` | `/auth/me` | Fetch current authenticated user profile |
| `GET` | `/auth/team-leads` | List all team leads (for recruiter dropdown) |

### 💼 Jobs Endpoints (`/jobs`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/jobs/` | List all approved jobs (public) |
| `GET` | `/jobs/pending` | List unapproved jobs (HR queue) |
| `GET` | `/jobs/all` | List all jobs (recruiter portal) |
| `GET` | `/jobs/{job_id}` | Fetch single approved job details |
| `POST` | `/jobs/` | Create new job posting (pending approval) |
| `PATCH` | `/jobs/{job_id}/approve` | HR approve job & provision MinIO bucket |
| `PUT` | `/jobs/{job_id}` | Update job posting details |
| `DELETE` | `/jobs/{job_id}` | Delete job & purge MinIO bucket |

### 📄 Applications, Resumes & Analysis
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/applications/{job_id}` | Submit candidate application & upload resume |
| `GET` | `/resumes/{bucket}` | List resumes enriched with candidate info & ATS scores |
| `GET` | `/resumes/{bucket}/download/{key}` | Stream resume file download |
| `POST` | `/analyze/{bucket}?force=false` | Run LangGraph AI analysis (uses cache unless `force=true`) |
| `DELETE` | `/analyze/cache/{bucket}` | Clear cached ATS results for a job bucket |
| `POST` | `/documents/extract-text` | Extract plain text from a PDF or DOCX file |

### 👥 Candidates Endpoints (`/candidates`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/candidates/` | List all candidates with enriched application & ATS data |
| `PUT` | `/candidates/{id}` | Update a candidate's personal information |
| `DELETE` | `/candidates/{id}` | Delete a candidate and all their associated data |
| `GET` | `/candidates/export` | Download all candidate data as a formatted `.xlsx` workbook |

### 🗂️ Storage & Buckets
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/buckets/` | List all MinIO buckets |
| `GET` | `/storage/list` | List files in default bucket |
| `GET` | `/storage/download/{key}` | Download file from default bucket |
| `DELETE` | `/storage/{key}` | Delete file from default bucket |

---

## Role-Based Access Control

| Role | Accessible Routes | Key Responsibilities |
| :--- | :--- | :--- |
| `hr_admin` | `/approval`, `/recruiter`, `/candidates` | Review pending jobs, approve postings (creates MinIO bucket), manage candidate database |
| `team_lead` | `/`, `/recruiter`, `/results`, `/candidate/:id`, `/candidates` | Create job postings, upload/filter resumes, run AI ATS analysis, export candidate data |
| `candidate` | Candidate Portal | Browse jobs, submit multi-step applications, manage profile |

---

## Default Credentials

### HR Admin
| Field | Value |
| :--- | :--- |
| **Username** | `admin` |
| **Password** | `admin` |

### Team Leads (seeded automatically on first startup)
| Name | Username | Password |
| :--- | :--- | :--- |
| Sarah Jenkins | `sarah` | `password123` |
| Alex Morgan | `alex` | `password123` |
| David Chen | `david` | `password123` |
| Emily Taylor | `emily` | `password123` |

---

## License & Copyright

**Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.**

All source code, design systems, and documentation contained in this repository are proprietary to **Uworx UK**. Unauthorized copying, modification, distribution, or public display of this software is strictly prohibited.
