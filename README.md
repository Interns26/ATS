# ATS Resume Analyzer & Talent Acquisition System

AI-assisted applicant tracking and talent acquisition platform for Uworx UK. The system provides separate experiences for candidates, recruiters, and HR administrators, backed by a FastAPI service, PostgreSQL, MinIO, and AI evaluation workflows.

> **Proprietary software**
>
> Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained in this repository is proprietary and confidential.

## Contents

- [What the system does](#what-the-system-does)
- [Architecture](#architecture)
- [Features by role](#features-by-role)
- [Main workflows](#main-workflows)
- [Technology stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Local setup](#local-setup)
- [Configuration](#configuration)
- [Development accounts and sample data](#development-accounts-and-sample-data)
- [API overview](#api-overview)
- [AI analysis](#ai-analysis)
- [MCP and AI assistant](#mcp-and-ai-assistant)
- [Validation](#validation)
- [Troubleshooting](#troubleshooting)
- [Security notes](#security-notes)
- [Project structure](#project-structure)
- [License](#license)

## What the System Does

The platform supports the recruiting lifecycle from job creation through candidate evaluation:

1. A team lead creates a job posting.
2. HR reviews and approves the posting.
3. Approval provisions job-specific MinIO storage.
4. Candidates browse approved openings and submit applications with resumes.
5. Recruiters review, filter, and analyze submitted resumes.
6. The AI workflow produces scores, evidence, and recommendations.
7. Recruiters manage candidate records, contact candidates, and export data.

The repository contains three application surfaces:

| Application | Purpose | Location |
| --- | --- | --- |
| Candidate Portal | Job discovery, authentication, applications, resumes, and profile management | [`candidate-portal/`](candidate-portal/) |
| Recruiter Portal | Job management, HR approval, candidate review, analysis, and exports | [`recruiter-portal/`](recruiter-portal/) |
| FastAPI Backend | Authentication, persistence, storage, analysis, email, and assistant APIs | [`backend/`](backend/) |

## Architecture

```text
                         +-----------------------+
                         |   Candidate Portal    |
                         | React + TypeScript    |
                         +-----------+-----------+
                                     |
                                     | HTTP / JSON / multipart
                                     v
+-------------------+       +--------+---------+       +------------------+
| Recruiter Portal  +------>|   FastAPI API    +------>|   PostgreSQL     |
| React + TypeScript|       |  backend/app/    |       | users, jobs,     |
+-------------------+       +--------+---------+       | candidates, ATS  |
                                     |                 +------------------+
                                     |
                      +--------------+--------------+
                      |                             |
                      v                             v
                +-------------+             +---------------+
                |    MinIO    |             | AI Workflows  |
                | resume files|             | LangGraph     |
                +-------------+             | Gemini/Groq*  |
                                            +---------------+

* Provider usage is configured in the backend workflow and assistant modules.
```

## Features by Role

### Candidates

- Browse approved job openings and search listings.
- View job details before applying.
- Submit a multi-step application containing contact information, qualifications, work experience, and a PDF or DOCX resume.
- Register and log in with email/password.
- Sign in with Google Identity Services when configured.
- Reuse an existing candidate record when applying with an existing email address.
- Edit profile information after signing in.
- Keep the authentication token in browser storage for the active session.

### Team Leads and Recruiters

- Create job postings with title, location, employment type, department, dates, responsibilities, requirements, and position count.
- View job-specific resumes and download stored files.
- Filter candidates by university and CGPA.
- Upload a job description document and extract its text.
- Run batch resume analysis with cached results.
- Force a fresh analysis when job or candidate information changes.
- Review ATS scores, recommendations, and candidate details.
- Search, edit, and delete candidate records.
- Send batch candidate emails when SMTP is configured.
- Export candidate data as an `.xlsx` workbook.
- Use the recruiter AI assistant for supported candidate, job, application, and resume-analysis queries.

### HR Administrators

- Review pending job postings.
- Approve postings and provision their MinIO storage buckets.
- Review all jobs and manage the candidate database.
- Use job comments and review-related workflow endpoints exposed by the backend.

## Main Workflows

### Job approval and storage

New jobs start in a pending state. When HR approves a job, the backend creates a dedicated MinIO bucket for that job. Candidate resumes are then stored in the job-specific bucket. Deleting a job also removes its associated stored resume objects through the storage lifecycle.

Bucket names are generated from job information and an identifier. Do not depend on a specific bucket name format in integrations; use the bucket name returned by the API.

### Candidate applications

Applications are submitted as multipart form data to the backend. The application includes candidate details, qualifications, work experience, and a resume file. The backend associates repeated submissions from the same email with the existing candidate record instead of creating an unnecessary duplicate.

### Resume analysis

The analysis endpoint processes resumes for a job, extracts structured information, evaluates fit against the job, and stores results in PostgreSQL. Results are cached by candidate and job. Use the force option or clear the job cache when a new evaluation is required.

## Technology Stack

| Area | Technologies |
| --- | --- |
| Frontends | React 19, TypeScript, Vite, Tailwind CSS, React Router |
| Backend | Python 3.11+, FastAPI, Uvicorn, Pydantic |
| Database | PostgreSQL 16, psycopg2 |
| Object storage | MinIO, MinIO Python SDK |
| AI evaluation | LangGraph, LangChain integrations, Google/Groq model integrations |
| Document processing | PyMuPDF, pdfplumber, python-docx |
| Authentication | JWT, password hashing, Google Identity Services |
| Export and email | openpyxl, SMTP |
| Local infrastructure | Docker Compose |

## Prerequisites

Install the following before starting:

- Python 3.11 or newer
- Node.js 18 or newer and npm
- Docker Desktop with Docker Compose
- A Google API key for the configured AI workflow
- A Gemini API key if using the AI assistant or Gemini-backed modules
- A Google OAuth client ID if Google candidate sign-in is enabled

## Local Setup

### 1. Start PostgreSQL and MinIO

From the repository root:

```powershell
docker compose up -d
```

The compose file starts:

| Service | URL or address | Development credentials |
| --- | --- | --- |
| PostgreSQL | `localhost:5432` | `ats` / `ats_password` |
| MinIO API | `http://localhost:9000` | `admin` / `admin12345` |
| MinIO Console | `http://localhost:9001` | `admin` / `admin12345` |

Check the container status with:

```powershell
docker compose ps
```

### 2. Configure and start the backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
Copy-Item .env.example .env
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

Backend URLs:

- API: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

The backend initializes database tables, ensures the default MinIO bucket exists, and seeds development data during startup.

### 3. Start the recruiter portal

Open another terminal from the repository root:

```powershell
cd recruiter-portal
npm install
npm run dev -- --port 5173
```

Open `http://localhost:5173`.

### 4. Start the candidate portal

Open another terminal from the repository root:

```powershell
cd candidate-portal
npm install
npm run dev -- --port 5174
```

Open `http://localhost:5174`.

The explicit port arguments allow both Vite applications to run at the same time. Without them, Vite chooses an available port automatically.

## Configuration

### Backend environment

Copy [`backend/.env.example`](backend/.env.example) to `backend/.env` and configure the following groups:

```env
# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=ats
POSTGRES_PASSWORD=ats_password
POSTGRES_DB=ats_db

# MinIO
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=admin12345
MINIO_BUCKET=resumes
MINIO_SECURE=false

# Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=your_bcrypt_hash
JWT_SECRET_KEY=replace_with_a_long_random_value
JWT_EXPIRE_MINUTES=120

# Google and AI providers
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_API_KEY=your_google_api_key
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key

# Optional SMTP
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@example.com
SMTP_PASSWORD=your_app_password
SMTP_FROM_EMAIL=your_email@example.com
```

`GEMINI_API_KEY` is required by the AI assistant module even though older environment templates may not list it. Add it when using [`backend/app/routers/ai_assistant.py`](backend/app/routers/ai_assistant.py).

### Candidate portal environment

Copy [`candidate-portal/.env.example`](candidate-portal/.env.example) to `candidate-portal/.env`:

```env
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

The frontends currently target `http://localhost:8000` directly for API calls. Change the frontend service configuration if the backend is hosted elsewhere.

## Development Accounts and Sample Data

The following credentials are for local development only:

| Role | Username | Password |
| --- | --- | --- |
| HR administrator | `admin` | `admin` |
| Team lead | `sarah` | `password123` |
| Team lead | `alex` | `password123` |
| Team lead | `david` | `password123` |
| Team lead | `emily` | `password123` |

The backend seeds team leads and sample approved jobs when the relevant tables are empty. Replace the development credentials and secrets before using the system outside a local environment.

## API Overview

Interactive documentation is available at `http://localhost:8000/docs` while the backend is running.

| Route group | Purpose |
| --- | --- |
| `/health` | Service health check |
| `/auth` | Admin, team lead, candidate, Google login, profile, and team-lead endpoints |
| `/jobs` | Public job listings, creation, updates, approvals, comments, and deletion |
| `/applications` | Candidate application and resume submission |
| `/resumes` | Job resume listing and downloads |
| `/analyze` | Resume analysis, cache management, and forced re-analysis |
| `/candidates` | Candidate listing, editing, deletion, email batches, and Excel export |
| `/documents` | Job-description text extraction |
| `/buckets` | MinIO bucket listing |
| `/storage` | Default-bucket file listing, download, and deletion |
| `/ai-assistant` | Recruiter assistant chat endpoint |

Notable examples:

```text
GET    /health
POST   /auth/login
POST   /auth/candidate/register
POST   /auth/candidate/login
POST   /auth/google
GET    /jobs/
POST   /jobs/
PATCH  /jobs/{job_id}/approve
POST   /applications/{job_id}
GET    /resumes/{bucket_name}
POST   /analyze/{bucket_name}?force=false
DELETE /analyze/cache/{bucket_name}
GET    /candidates/export
POST   /documents/extract-text
POST   /ai-assistant/chat
```

Protected routes require the JWT returned by authentication. The frontend applies role-specific route restrictions for HR administrators, team leads, and candidates. Backend routers currently focus primarily on token authentication; do not treat frontend route hiding as a substitute for server-side authorization in a production deployment.

## AI Analysis

The analysis workflow combines structured resume extraction, job comparison, and model-based evaluation. The score is designed around three parts:

```text
ATS Score =
  Skills Match Ratio × 40
  + Requirements Match Ratio × 40
  + Holistic Fit Score × 20
```

Default recommendations shown by the recruiter portal are:

| Score | Recommendation |
| --- | --- |
| `70%` or higher | Interview |
| `50%` to `69%` | Consider |
| Below `50%` | Reject |

Analysis results are cached per candidate and job. Re-running an analysis without `force=true` can return the cached result. Use the cache deletion endpoint or the force option for a fresh run.

Model selection and provider behavior are controlled by the backend workflow and environment configuration. Review [`backend/workflow/nodes.py`](backend/workflow/nodes.py) and [`backend/workflow/prompts.py`](backend/workflow/prompts.py) before describing a particular model or provider in an external deployment document.

## MCP and AI Assistant

The backend includes an AI assistant route and a FastMCP server under [`backend/app/mcp/`](backend/app/mcp/). The available tools support recruiting-oriented queries across candidates, jobs, applications, and analysis results.

The assistant requires the provider credentials used by its module, including `GEMINI_API_KEY` where configured. Start the API first so the recruiter portal can communicate with the assistant endpoint.

For direct MCP development or testing, review:

- [`backend/app/mcp/server.py`](backend/app/mcp/server.py)
- [`backend/app/mcp/client.py`](backend/app/mcp/client.py)
- [`backend/test_mcp_client.py`](backend/test_mcp_client.py)

## File and Storage Rules

- Candidate resumes are submitted as PDF or DOCX files.
- Job-description extraction supports the document types accepted by the backend extractor; the current endpoint also enforces a small upload limit.
- Resumes are stored in MinIO, generally in a bucket associated with the job.
- Resume downloads are streamed through protected backend endpoints.
- Job deletion may remove the job's associated storage and should be treated as a destructive operation.

## Validation

Run frontend checks from each portal directory:

```powershell
npm run build
npm run lint
```

Run the backend MCP client test from `backend` when its required services and environment variables are available:

```powershell
python test_mcp_client.py
```

Verify the backend is responding before testing either portal:

```powershell
Invoke-RestMethod http://localhost:8000/health
```

## Troubleshooting

### Database or MinIO connection errors

Confirm Docker services are running:

```powershell
docker compose ps
```

Check that the values in `backend/.env` match the credentials in `docker-compose.yml`.

### Port already in use

Start the portals with explicit ports:

```powershell
npm run dev -- --port 5173
npm run dev -- --port 5174
```

### Google login does not work

Confirm that:

- `GOOGLE_CLIENT_ID` is configured in `backend/.env`.
- `VITE_GOOGLE_CLIENT_ID` is configured in `candidate-portal/.env`.
- The current portal URL is listed as an allowed origin in the Google OAuth configuration.

### AI assistant or analysis errors

Check the required provider key in `backend/.env`, especially `GOOGLE_API_KEY` and `GEMINI_API_KEY`, then inspect the backend terminal for the provider error. Confirm that the configured model is available to the selected provider.

### Stale ATS results

Use the recruiter portal's force re-analysis option or call:

```text
POST /analyze/{bucket_name}?force=true
```

## Security Notes

- Never commit `.env` files, API keys, passwords, or JWT secrets.
- Replace all development credentials before deployment.
- Use a long, random `JWT_SECRET_KEY` in every non-local environment.
- Store MinIO with secure transport and restricted credentials outside local development.
- Configure backend authorization independently of frontend route restrictions.
- Rotate any credential that may have been exposed in a local file, terminal, log, or repository history.
- Review upload size, file-type, and malware-scanning requirements before production use.

## Project Structure

```text
ATS/
├── backend/
│   ├── app/
│   │   ├── mcp/                 # MCP server and client integration
│   │   ├── routers/             # FastAPI route modules
│   │   └── services/            # Database, storage, and authentication services
│   ├── workflow/                # LangGraph state, nodes, prompts, and models
│   ├── requirements.txt
│   └── .env.example
├── candidate-portal/
│   ├── src/components/          # Candidate UI and form steps
│   ├── src/pages/               # Listings, details, application, login, profile
│   ├── src/services/            # Candidate API client
│   └── package.json
├── recruiter-portal/
│   ├── src/components/          # Shared recruiter UI and assistant
│   ├── src/pages/               # Dashboard, jobs, approvals, candidates, results
│   ├── src/services/            # Recruiter API client
│   └── package.json
├── docker-compose.yml
└── README.md
```

## License

This is proprietary software owned by Uworx UK. Unauthorized copying, modification, or public display of this software is prohibited. Use and distribution are permitted only under an applicable written license agreement.
