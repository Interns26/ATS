# Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.

"""
Jobs router.

Public endpoints (no JWT):
  GET  /jobs          — list all approved jobs
  GET  /jobs/pending  — list all unapproved jobs (for approval page)
  GET  /jobs/all      — list all jobs (for recruiter portal)
  GET  /jobs/{job_id} — single approved job

Protected endpoints (JWT required — for recruiter portal):
  POST   /jobs                    — create a new job (unapproved)
  PATCH  /jobs/{job_id}/approve   — approve job + create its MinIO bucket
  DELETE /jobs/{job_id}           — delete a job
"""
import json
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from app.dependencies import get_current_user
from app.services.database import get_connection
from app.services.storage import ensure_bucket_exists, delete_bucket

router = APIRouter(prefix="/jobs", tags=["Jobs"])



# ── Request / Response models ────────────────────────────────────────────────

class JobCreate(BaseModel):
    title: str
    location: Optional[str] = None
    employment_type: Optional[str] = None   # Permanent | Contract | Internship | Part-time
    department: Optional[str] = None
    description: Optional[str] = None
    responsibilities: List[str] = []
    requirements: List[str] = []
    opening_date: Optional[str] = None      # ISO date string, e.g. "2026-08-01"
    closing_date: Optional[str] = None


class JobUpdate(BaseModel):
    title: Optional[str] = None
    location: Optional[str] = None
    employment_type: Optional[str] = None
    department: Optional[str] = None
    description: Optional[str] = None
    responsibilities: Optional[List[str]] = None
    requirements: Optional[List[str]] = None
    opening_date: Optional[str] = None
    closing_date: Optional[str] = None


# ── Helpers ──────────────────────────────────────────────────────────────────

def _row_to_dict(row) -> dict:
    """Convert a RealDictRow to a plain dict with JSON fields decoded and ISO formatted dates."""
    d = dict(row)
    for k, v in d.items():
        if hasattr(v, "isoformat"):
            d[k] = v.isoformat()
        elif k in ("responsibilities", "requirements") and isinstance(v, str):
            try:
                d[k] = json.loads(v)
            except Exception:
                pass
    return d


def _bucket_name_for_job(job_id: str) -> str:
    """
    MinIO bucket names must be 3-63 chars, lowercase, letters/numbers/hyphens only.
    Use `job-<first-12-chars-of-uuid-without-hyphens>`.
    """
    short = job_id.replace("-", "")[:12]
    return f"job-{short}"


# ── Public & Listing routes (must be defined BEFORE /{job_id}) ───────────────

@router.get("/")
def list_approved_jobs():
    """Return all approved jobs — used by the candidate portal."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, title, location, employment_type, department,
                       description, responsibilities, requirements,
                       opening_date, closing_date, minio_bucket, created_at
                FROM jobs
                WHERE is_approved = TRUE
                ORDER BY created_at DESC
                """
            )
            rows = cur.fetchall()
    return [_row_to_dict(r) for r in rows]


@router.get("/pending")
def list_pending_jobs():
    """Return all unapproved jobs — used by recruiter portal approval page."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, title, location, employment_type, department,
                       description, responsibilities, requirements,
                       opening_date, closing_date, created_at
                FROM jobs
                WHERE is_approved = FALSE
                ORDER BY created_at DESC
                """
            )
            rows = cur.fetchall()
    return [_row_to_dict(r) for r in rows]


@router.get("/all")
def list_all_jobs():
    """Return all jobs regardless of status — used by recruiter portal."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, title, location, employment_type, department,
                       description, responsibilities, requirements,
                       opening_date, closing_date, is_approved, minio_bucket, created_at
                FROM jobs
                ORDER BY created_at DESC
                """
            )
            rows = cur.fetchall()
    return [_row_to_dict(r) for r in rows]


@router.get("/{job_id}")
def get_job(job_id: str):
    """Return a single approved job — used by candidate portal job detail page."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, title, location, employment_type, department,
                       description, responsibilities, requirements,
                       opening_date, closing_date, minio_bucket, created_at
                FROM jobs
                WHERE id = %s AND is_approved = TRUE
                """,
                (job_id,),
            )
            row = cur.fetchone()

    if not row:
        raise HTTPException(404, f"Job '{job_id}' not found or not yet approved.")

    return _row_to_dict(row)


# ── Protected routes (recruiter portal) ─────────────────────────────────────

@router.post("/", dependencies=[Depends(get_current_user)], status_code=201)
def create_job(payload: JobCreate):
    """Create a new job posting, provision its dedicated MinIO bucket immediately, and set it as approved so it displays on Candidate Portal and Recruiter Portal."""
    job_id = str(uuid.uuid4())
    bucket = _bucket_name_for_job(job_id)
    ensure_bucket_exists(bucket)

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO jobs
                  (id, title, location, employment_type, department, description,
                   responsibilities, requirements, opening_date, closing_date,
                   is_approved, minio_bucket)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    job_id,
                    payload.title,
                    payload.location or "Remote",
                    payload.employment_type or "Full-time",
                    payload.department or "General",
                    payload.description or "",
                    json.dumps(payload.responsibilities),
                    json.dumps(payload.requirements),
                    payload.opening_date or None,
                    payload.closing_date or None,
                    True,   # Approved immediately so candidate portal displays it
                    bucket, # MinIO storage bucket created immediately!
                ),
            )

    return {"job_id": job_id, "is_approved": True, "minio_bucket": bucket}


@router.patch("/{job_id}/approve", dependencies=[Depends(get_current_user)])
def approve_job(job_id: str):
    """
    Approve a job and create its dedicated MinIO bucket.
    The bucket name is stored on the job row so applications can find it.
    """
    bucket = _bucket_name_for_job(job_id)

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, is_approved FROM jobs WHERE id = %s",
                (job_id,),
            )
            row = cur.fetchone()

    if not row:
        raise HTTPException(404, f"Job '{job_id}' not found.")
    if row["is_approved"]:
        return {"job_id": job_id, "minio_bucket": row["minio_bucket"], "message": "Already approved."}

    # Create the MinIO bucket for this job
    ensure_bucket_exists(bucket)

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE jobs SET is_approved = TRUE, minio_bucket = %s WHERE id = %s",
                (bucket, job_id),
            )

    return {"job_id": job_id, "minio_bucket": bucket, "message": "Job approved."}


@router.delete("/{job_id}", dependencies=[Depends(get_current_user)], status_code=204)
def delete_job(job_id: str):
    """Delete a job posting and remove its MinIO storage bucket."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT minio_bucket FROM jobs WHERE id = %s", (job_id,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(404, f"Job '{job_id}' not found.")

            bucket = row.get("minio_bucket")
            if bucket:
                try:
                    delete_bucket(bucket)
                except Exception as exc:
                    print(f"[JobsRouter] Warning: Failed to delete MinIO bucket {bucket}: {exc}")

            cur.execute("DELETE FROM jobs WHERE id = %s", (job_id,))

            if cur.rowcount == 0:
                raise HTTPException(404, f"Job '{job_id}' not found.")


@router.put("/{job_id}", dependencies=[Depends(get_current_user)])
def update_job(job_id: str, payload: JobUpdate):
    """Update job details for an existing job posting."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM jobs WHERE id = %s", (job_id,))
            if not cur.fetchone():
                raise HTTPException(404, f"Job '{job_id}' not found.")

            update_fields = []
            values = []

            if payload.title is not None:
                update_fields.append("title = %s")
                values.append(payload.title)
            if payload.location is not None:
                update_fields.append("location = %s")
                values.append(payload.location)
            if payload.employment_type is not None:
                update_fields.append("employment_type = %s")
                values.append(payload.employment_type)
            if payload.department is not None:
                update_fields.append("department = %s")
                values.append(payload.department)
            if payload.description is not None:
                update_fields.append("description = %s")
                values.append(payload.description)
            if payload.responsibilities is not None:
                update_fields.append("responsibilities = %s")
                values.append(json.dumps(payload.responsibilities))
            if payload.requirements is not None:
                update_fields.append("requirements = %s")
                values.append(json.dumps(payload.requirements))
            if payload.opening_date is not None:
                update_fields.append("opening_date = %s")
                values.append(payload.opening_date or None)
            if payload.closing_date is not None:
                update_fields.append("closing_date = %s")
                values.append(payload.closing_date or None)

            if not update_fields:
                raise HTTPException(400, "No fields provided to update.")

            values.append(job_id)
            query = f"UPDATE jobs SET {', '.join(update_fields)} WHERE id = %s"
            cur.execute(query, tuple(values))

    return {"job_id": job_id, "message": "Job updated successfully."}

