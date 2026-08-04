# ATS Resume Analyzer & Talent Acquisition System

**Uworx UK** • AI-Powered Applicant Tracking & Candidate Portal System

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![MinIO](https://img.shields.io/badge/MinIO-Object_Storage-C42E35?style=flat&logo=minio&logoColor=white)](https://min.io/)

> **Copyright (c) 2026 Uworx UK. All rights reserved.**

---

## Executive Overview

The **ATS Resume Analyzer & Talent Acquisition System** is an enterprise-grade recruiting platform designed for **Uworx UK**. It features a modern Candidate Portal for candidate job applications, a comprehensive Recruiter Portal for job postings, HR approvals, and AI candidate scoring, and a high-performance FastAPI backend backed by PostgreSQL, MinIO Object Storage, and LangGraph AI pipelines.

---

## Key Features

### 🏢 Recruiter Portal (`recruiter-portal/`)
- **ATS Resume Scoring & AI Recommendation**: Scores candidate resumes against job descriptions using LangGraph AI pipelines and customizable Interview/Consider threshold bounds.
- **Real Candidate & Resume Filter**: Dynamic constraints filter by **CGPA** (`<=`, `>=`, `=`) and **University** (`UET Lahore`, `FAST NUCES`, `COMSATS`, `Other`, `All`).
- **Recruiter Job Posting**: Post new job openings (`/recruiter`) with title, department, location, employment type, and description.
- **HR Approval Queue & Storage Provisioning**: HR review queue (`/approval`) for approving job postings, which automatically provisions dedicated MinIO storage buckets (`job-xxxx`) for candidate application uploads.
- **Automatic Storage Lifecycle**: Deleting a job posting automatically purges its dedicated MinIO storage bucket and all stored files.

### 👤 Candidate Portal (`candidate-portal/`)
- **Job Openings Showcase**: Browse live approved job positions with real-time search.
- **Multi-Step Application Submission**: Interactive application form capturing basic contact info, qualifications, work experience, and resume upload.
- **Candidate Authentication**: Email/Password candidate registration and login, with session persistence (`ats:token`).
- **Google OAuth 2.0 Sign-In**: One-click registration and sign-in using Google Identity Services (GIS SDK).
- **Auto Pre-Fill**: Logged-in candidates have their contact information auto-populated into application forms.

### ⚡ FastAPI Backend (`backend/`)
- **JWT Role-Based Auth**: Secure JWT authentication supporting `admin` and `candidate` roles.
- **Google OAuth Token Verification**: Instant verification of Google ID token claims with multi-layer fallback.
- **PostgreSQL Database Schema**: Relational storage for candidates, job postings, applications, qualifications, work experience, and user accounts.
- **MinIO Object Storage Integration**: Bucket management and streaming file downloads for candidate resumes.
- **LangGraph AI Resume Parsing**: Intelligent text extraction, resume parsing, and compatibility scoring.

---

## Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Vanilla CSS, Tailwind CSS, Lucide Icons |
| **Backend** | Python 3.11+, FastAPI, Uvicorn, Pydantic v2 |
| **Authentication** | JWT (`python-jose`), Bcrypt (`passlib`), Google Identity Services (`google-auth`) |
| **Database & Storage** | PostgreSQL (`psycopg2`), MinIO Python SDK |
| **AI Workflow** | LangGraph, Groq LLM API, PyMuPDF / pdfplumber |
| **DevOps & Containers** | Docker, Docker Compose |

---

## Architecture & Project Structure

```text
ATS/
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── analyze.py        # LangGraph AI scoring endpoint
│   │   │   ├── applications.py   # Application submission endpoint
│   │   │   ├── auth.py           # JWT, Candidate & Google OAuth endpoints
│   │   │   ├── jobs.py           # Public, Recruiter & HR Approval job endpoints
│   │   │   ├── resumes.py        # MinIO resume retrieval & downloads
│   │   │   └── storage.py        # MinIO bucket management
│   │   ├── services/
│   │   │   ├── auth.py           # Password hashing & JWT token generation
│   │   │   ├── database.py       # PostgreSQL connection pool & schema init
│   │   │   └── storage.py        # MinIO SDK client operations
│   │   ├── dependencies.py       # Auth dependencies (get_current_user)
│   │   └── main.py               # FastAPI entry point & CORS configuration
│   ├── workflow/                 # LangGraph AI resume parsing nodes & graph
│   ├── .env.example
│   └── requirements.txt
│
├── candidate-portal/
│   ├── src/
│   │   ├── components/           # Header, GoogleAuthButton, LoginModal, RegisterModal
│   │   ├── pages/                # JobListings, JobDetail, ApplicationForm, LoginPage
│   │   ├── services/             # API services for auth & job applications
│   │   └── lib/                  # JWT token storage helpers
│   ├── .env.example
│   └── package.json
│
├── recruiter-portal/
│   ├── src/
│   │   ├── components/           # Navbar, Button, Card, Select, Input, LoadingOverlay
│   │   ├── pages/                # Home (ATS Analyzer), Recruiter, Approval, CandidateDetails
│   │   └── services/             # API services for jobs, buckets & resume analysis
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
POSTGRES_USER=ats_user
POSTGRES_PASSWORD=ats_password

# MinIO Object Storage
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=password123
MINIO_SECURE=false
MINIO_BUCKET=resumes

# Security & JWT
JWT_SECRET_KEY=your_random_super_secret_jwt_key_here
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW

# Google OAuth 2.0
GOOGLE_CLIENT_ID=820758112006-iv6pc1p0nlvga2385heq970rjjg9g52g.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 2. Candidate Portal Environment (`candidate-portal/.env`)

Create `candidate-portal/.env`:

```env
VITE_GOOGLE_CLIENT_ID=820758112006-iv6pc1p0nlvga2385heq970rjjg9g52g.apps.googleusercontent.com
```

---

## Google OAuth 2.0 Credentials Setup

To enable Google Sign-In on the Candidate Portal:

1. Go to **[Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)**.
2. Select your OAuth 2.0 Client ID.
3. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5173`
   - `http://localhost:5174`
   - `http://localhost`
4. Under **Authorized redirect URIs**, add:
   - `http://localhost:5173`
   - `http://localhost:5174`
5. Save changes (allow 1-3 minutes for Google CDN propagation).

---

## Installation & Quickstart

### Step 1: Start PostgreSQL and MinIO Containers

```bash
docker-compose up -d
```

Verify containers are running:
- **MinIO Console**: `http://localhost:9001` (Credentials: `admin` / `password123`)
- **PostgreSQL**: `localhost:5432`

---

### Step 2: Set Up Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI dev server
python -m uvicorn app.main:app --reload --port 8000
```

FastAPI server endpoints:
- **API Server**: `http://localhost:8000`
- **Swagger Documentation**: `http://localhost:8000/docs`

---

### Step 3: Set Up Candidate Portal

In a new terminal:

```bash
cd candidate-portal
npm install
npm run dev
```

Candidate Portal will open at `http://localhost:5173`.

---

### Step 4: Set Up Recruiter Portal

In a new terminal:

```bash
cd recruiter-portal
npm install
npm run dev
```

Recruiter Portal will open at `http://localhost:5174`.

---

## API Documentation Overview

### 🔐 Auth Endpoints (`/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/login` | Recruiter/Admin Login |
| `POST` | `/auth/candidate/register` | Candidate Email/Password Registration |
| `POST` | `/auth/candidate/login` | Candidate Email/Password Login |
| `POST` | `/auth/google` | Candidate Google OAuth 2.0 Sign-In |
| `GET` | `/auth/me` | Fetch Current Authenticated User Profile |

### 💼 Jobs Endpoints (`/jobs`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/jobs/` | List All Approved Jobs (Public) |
| `GET` | `/jobs/pending` | List Unapproved Jobs (HR Queue) |
| `GET` | `/jobs/all` | List All Jobs (Recruiter Portal) |
| `GET` | `/jobs/{job_id}` | Fetch Single Approved Job Details |
| `POST` | `/jobs/` | Create New Job & Provision MinIO Bucket |
| `PATCH` | `/jobs/{job_id}/approve` | HR Approve Job & Activate Bucket |
| `DELETE` | `/jobs/{job_id}` | Delete Job & Purge MinIO Bucket |

### 📄 Applications & Resumes (`/applications`, `/resumes`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/applications/{job_id}` | Submit Candidate Application & Upload Resume |
| `GET` | `/resumes/{bucket}` | List Resumes Enriched with Candidate Contact & Qualifications |
| `GET` | `/resumes/{bucket}/download/{key}` | Stream Resume File Download |
| `POST` | `/analyze/{bucket}` | Run LangGraph AI Compatibility Analysis |

---

## Default Credentials

- **Recruiter / Admin Login**:
  - **Username**: `admin`
  - **Password**: `admin`

---

## License & Copyright

**Copyright (c) 2026 Uworx UK. All rights reserved.**

All source code, design systems, and documentation contained in this repository are proprietary to **Uworx UK**. Unauthorized copying, modification, distribution, or public display of this software is strictly prohibited.
