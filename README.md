# ATS Resume Analyzer

An AI-powered Applicant Tracking System (ATS) that allows recruiters to retrieve resumes from MinIO object storage, upload a job description, analyze candidate compatibility, and rank applicants based on an ATS score.

> **Current Status**
>
> - ✅ React frontend completed
> - ✅ FastAPI backend for MinIO integration completed
> - ✅ MinIO bucket selection implemented
> - ✅ Resume parsing
> - ✅ LangGraph workflow 
> - ✅ ATS scoring pipeline 

---

# Tech Stack

## Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS

## Backend

- FastAPI
- Python
- MinIO Python SDK

## Storage

- MinIO Object Storage

## AI (Upcoming)

- LangGraph
- Groq LLM

---

# Project Structure

```text
ATS/
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   ├── services/
│   │   └── main.py
│   │
│   ├── requirements.txt
│   ├── .env.example
│   └── ...
│
└── README.md
```

---

# Features

## Current

- Modern React dashboard
- Dark mode
- MinIO bucket selection
- Resume listing from selected bucket
- Job description upload
- Candidate dashboard
- Candidate details page

## Planned

- Resume parser
- Job description parser
- LangGraph workflow
- ATS score generation
- Resume recommendations
- Resume download
- Candidate ranking
- AI explanations

---

# Prerequisites

Install the following:

- Git
- Python 3.11+
- Node.js (LTS)
- npm
- Docker Desktop

---

# Clone Repository

```bash
git clone https://github.com/Interns26/ATS.git

cd ATS
```

---

# Backend Setup

## Create Virtual Environment

```bash
cd backend

python -m venv .venv
```

Activate it

### Windows (Git Bash)

```bash
source .venv/Scripts/activate
```

### Windows (PowerShell)

```powershell
.venv\Scripts\Activate.ps1
```

---

## Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Configure Environment Variables

Create a file named

```text
backend/.env
```

Example

```env
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=password123
MINIO_SECURE=false
```

---

# MinIO Setup

Start MinIO using Docker

```bash
docker run -d \
--name minio \
-p 9000:9000 \
-p 9001:9001 \
-e MINIO_ROOT_USER=admin \
-e MINIO_ROOT_PASSWORD=password123 \
minio/minio server /data --console-address ":9001"
```

Verify it is running

```bash
docker ps
```

---

## Open MinIO Console

```
http://localhost:9001
```

Login using

```
Username: admin

Password: password123
```

---

## Create Buckets

Create one or more buckets, for example

```
software-engineer

frontend

backend

internships
```

Upload resume PDF files into the desired bucket.

---

# Start Backend

```bash
cd backend

python -m uvicorn app.main:app --reload
```

Backend

```
http://localhost:8000
```

Swagger API

```
http://localhost:8000/docs
```

---

# Frontend Setup

Install dependencies

```bash
cd frontend

npm install
```

Run development server

```bash
npm run dev
```

Frontend

```
http://localhost:5173
```

---

# Current Workflow

```
Recruiter

      │

      ▼

Select MinIO Bucket

      │

      ▼

Retrieve Resume Files

      │

      ▼

Upload Job Description

      │

      ▼

(Upcoming)

Resume Parser

      │

      ▼

LangGraph

      │

      ▼

ATS Score

      │

      ▼

Candidate Ranking

      │

      ▼

Results Dashboard
```

---

# API Endpoints

## Health Check

```
GET /health
```

---

## List Buckets

```
GET /buckets
```

Returns all available MinIO buckets.

---

## List Resumes

```
GET /resumes/{bucket_name}
```

Returns every resume inside the selected bucket.

---

# Development Workflow

Create a feature branch

```bash
git checkout -b feature/<feature-name>
```

Commit changes

```bash
git add .

git commit -m "Describe your changes"
```

Push branch

```bash
git push origin feature/<feature-name>
```

Open a Pull Request into `develop`.

---

# Team Responsibilities

## Frontend

- Dashboard
- Candidate Pages
- Results UI
- API Integration

---

## Backend

- FastAPI
- MinIO Integration
- Resume Retrieval
- API Development

---

## AI

- Resume Parsing
- Job Description Parsing
- LangGraph Workflow
- ATS Scoring
- Candidate Recommendation

---

# Future Improvements

- Authentication
- Resume Download
- Batch Resume Processing
- PostgreSQL Database
- Candidate Search
- Interview Recommendation
- Export Reports
- Docker Compose Deployment

---

# Authors

Interns 2026

Developed as part of the AI Internship Project.
