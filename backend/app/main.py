# Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.services.storage import ensure_bucket_exists
from app.services.database import init_db
from app.dependencies import get_current_user
from app.routers import auth
from app.routers import storage
from app.routers import buckets
from app.routers import resumes
from app.routers import analyze
from app.routers import documents
from app.routers import jobs
from app.routers import applications
from app.routers import candidates
from app.routers import ai_assistant

app = FastAPI(
    title="ATS - MinIO Storage Service"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# Create the default MinIO bucket (if it doesn't already exist)
ensure_bucket_exists()

# Initialise Postgres — creates all tables if they don't exist yet
init_db()

# Seed sample approved jobs if the jobs table is empty
try:
    from seed_jobs import seed_jobs
    seed_jobs()
except Exception as e:
    print(f"Seed jobs warning: {e}")


# ── Public routers (no JWT) ──────────────────────────────────────────────────
# auth: login endpoint must stay open
app.include_router(auth.router)
# jobs GET routes: candidate portal reads approved jobs without logging in
# jobs POST/PATCH/DELETE: protected inside the router itself via Depends()
app.include_router(jobs.router)
# applications: candidates submit without an account (for now)
app.include_router(applications.router)

# ── Protected routers (JWT required) ────────────────────────────────────────
app.include_router(storage.router,    dependencies=[Depends(get_current_user)])
app.include_router(buckets.router,    dependencies=[Depends(get_current_user)])
app.include_router(resumes.router,    dependencies=[Depends(get_current_user)])
app.include_router(analyze.router,    dependencies=[Depends(get_current_user)])
app.include_router(documents.router,  dependencies=[Depends(get_current_user)])
app.include_router(candidates.router, dependencies=[Depends(get_current_user)])
app.include_router(ai_assistant.router, dependencies=[Depends(get_current_user)])


@app.get("/health")
async def health():
    return {"status": "ok"}

# Run with:
# uvicorn app.main:app --reload --port 8000