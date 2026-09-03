# Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.

"""
Jobs router.

Public endpoints (no JWT):
  GET  /jobs          — list all approved jobs
  GET  /jobs/pending  — list all unapproved jobs
  GET  /jobs/all      — list all jobs
  GET  /jobs/{job_id} — single approved job

Protected endpoints (JWT required):
  POST   /jobs
  PATCH  /jobs/{job_id}/approve
  DELETE /jobs/{job_id}
  PUT    /jobs/{job_id}
  POST   /jobs/{job_id}/comments
  GET    /jobs/{job_id}/comments
  GET    /jobs/comments/assigned-to-me
"""

import json
import uuid
import re

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.dependencies import get_current_user
from app.services.database import get_connection
from app.services.storage import ensure_bucket_exists, delete_bucket


router = APIRouter(prefix="/jobs", tags=["Jobs"])


# ─────────────────────────────────────────────────────────────
# Request / Response models
# ─────────────────────────────────────────────────────────────


class JobCreate(BaseModel):
    title: str
    location: Optional[str] = None
    employment_type: Optional[str] = None
    department: Optional[str] = None
    description: Optional[str] = None
    responsibilities: List[str] = []
    requirements: List[str] = []
    opening_date: Optional[str] = None
    closing_date: Optional[str] = None
    num_positions: int = Field(default=1, ge=1)


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
    num_positions: Optional[int] = Field(default=None, ge=1)


class JobCommentCreate(BaseModel):
    comment: Optional[str] = None
    reviewer_role: str
    action: str
    recipient_username: Optional[str] = None


# ─────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────


def _row_to_dict(row) -> dict:
    """
    Convert a RealDictRow to a plain dict with JSON fields decoded
    and ISO formatted dates/timestamps.
    """

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


def _bucket_name_for_job(job_id: str, title: str) -> str:
    """
    Generate a valid MinIO bucket name from the job title.
    """

    slug = (
        re.sub(r"[^a-z0-9]+", "-", title.lower())
        .strip("-")
    )

    slug = slug[:40]

    short = job_id.replace("-", "")[:6]

    return f"{slug}-{short}"


# ─────────────────────────────────────────────────────────────
# Public & Listing routes
# ─────────────────────────────────────────────────────────────


@router.get("/")
def list_approved_jobs():
    """
    Return all approved jobs.
    Used by candidate portal.
    """

    with get_connection() as conn:
        with conn.cursor() as cur:

            cur.execute(
                """
                SELECT
                    id,
                    title,
                    location,
                    employment_type,
                    department,
                    description,
                    responsibilities,
                    requirements,
                    opening_date,
                    closing_date,
                    num_positions,
                    minio_bucket,
                    created_at,
                    created_by
                FROM jobs
                WHERE is_approved = TRUE
                ORDER BY created_at DESC
                """
            )

            rows = cur.fetchall()

    return [_row_to_dict(row) for row in rows]


@router.get("/pending")
def list_pending_jobs():
    """
    Return all unapproved jobs.
    Used by recruiter approval page.
    """

    with get_connection() as conn:
        with conn.cursor() as cur:

            cur.execute(
                """
                SELECT
                    id,
                    title,
                    location,
                    employment_type,
                    department,
                    description,
                    responsibilities,
                    requirements,
                    opening_date,
                    closing_date,
                    num_positions,
                    created_at,
                    created_by
                FROM jobs
                WHERE is_approved = FALSE
                ORDER BY created_at DESC
                """
            )

            rows = cur.fetchall()

    return [_row_to_dict(row) for row in rows]


@router.get("/all")
def list_all_jobs():
    """
    Return all jobs regardless of approval status.
    Used by recruiter portal.
    """

    with get_connection() as conn:
        with conn.cursor() as cur:

            cur.execute(
                """
                SELECT
                    id,
                    title,
                    location,
                    employment_type,
                    department,
                    description,
                    responsibilities,
                    requirements,
                    opening_date,
                    closing_date,
                    num_positions,
                    is_approved,
                    minio_bucket,
                    created_at,
                    created_by
                FROM jobs
                ORDER BY created_at DESC
                """
            )

            rows = cur.fetchall()

    return [_row_to_dict(row) for row in rows]


# ─────────────────────────────────────────────────────────────
# Job comments / approval history
# ─────────────────────────────────────────────────────────────


@router.post(
    "/{job_id}/comments",
    dependencies=[Depends(get_current_user)],
    status_code=201,
)
def add_job_comment(
    job_id: str,
    payload: JobCommentCreate,
):
    """
    Add a reviewer comment/action to a job.

    When a Department Head sends a job back, the comment is
    automatically routed to the person who originally created
    the job.

    The creator is stored in jobs.created_by.

    The job title is also stored directly in job_comments.job_title
    so that review history keeps the title that existed when the
    review action was created.
    """

    with get_connection() as conn:
        with conn.cursor() as cur:

            # -------------------------------------------------
            # 1. Check that the job exists
            #    and get creator + title
            # -------------------------------------------------

            cur.execute(
                """
                SELECT
                    id,
                    title,
                    department,
                    created_by
                FROM jobs
                WHERE id = %s
                """,
                (job_id,),
            )

            job = cur.fetchone()

            if not job:
                raise HTTPException(
                    status_code=404,
                    detail=f"Job '{job_id}' not found.",
                )

            job_title = job["title"]

            # -------------------------------------------------
            # 2. Start with recipient from request
            # -------------------------------------------------

            recipient_username = payload.recipient_username

            # -------------------------------------------------
            # 3. Route Department Head "sent_back" to creator
            # -------------------------------------------------

            if (
                payload.action == "sent_back"
                and payload.reviewer_role == "department_head"
            ):

                if not job["created_by"]:
                    raise HTTPException(
                        status_code=400,
                        detail=(
                            "This job does not have a creator assigned. "
                            "The job must have a created_by username before "
                            "it can be sent back."
                        ),
                    )

                recipient_username = job["created_by"]

            # -------------------------------------------------
            # 4. Insert comment/action
            # -------------------------------------------------

            cur.execute(
                """
                INSERT INTO job_comments
                (
                    job_id,
                    job_title,
                    comment,
                    reviewer_role,
                    action,
                    recipient_username
                )
                VALUES
                (
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s
                )
                RETURNING
                    id,
                    job_id,
                    job_title,
                    comment,
                    reviewer_role,
                    action,
                    recipient_username,
                    created_at
                """,
                (
                    job_id,
                    job_title,
                    payload.comment,
                    payload.reviewer_role,
                    payload.action,
                    recipient_username,
                ),
            )

            row = cur.fetchone()

    return _row_to_dict(row)


# ─────────────────────────────────────────────────────────────
# Get comments for a specific job
# ─────────────────────────────────────────────────────────────


@router.get(
    "/{job_id}/comments",
    dependencies=[Depends(get_current_user)],
)
def list_job_comments(
    job_id: str,
):
    """
    Return all review comments/actions for a specific job.

    The job_title is stored directly in job_comments.

    Results are filtered strictly by job_id so that comments
    belonging to other jobs are never returned.
    """

    with get_connection() as conn:
        with conn.cursor() as cur:

            # -------------------------------------------------
            # 1. Check that the job exists
            # -------------------------------------------------

            cur.execute(
                """
                SELECT
                    id
                FROM jobs
                WHERE id = %s
                """,
                (job_id,),
            )

            job = cur.fetchone()

            if not job:
                raise HTTPException(
                    status_code=404,
                    detail=f"Job '{job_id}' not found.",
                )

            # -------------------------------------------------
            # 2. Get comments ONLY for this job
            # -------------------------------------------------

            cur.execute(
                """
                SELECT
                    id,
                    job_id,
                    job_title,
                    comment,
                    reviewer_role,
                    action,
                    recipient_username,
                    created_at
                FROM job_comments
                WHERE job_id = %s
                ORDER BY created_at ASC
                """,
                (job_id,),
            )

            rows = cur.fetchall()

    return [_row_to_dict(row) for row in rows]


# ─────────────────────────────────────────────────────────────
# Get comments assigned to logged-in user
# ─────────────────────────────────────────────────────────────


@router.get(
    "/comments/assigned-to-me",
    dependencies=[Depends(get_current_user)],
)
def list_my_job_comments(
    current_user: str = Depends(get_current_user),
):
    """
    Return job review comments assigned to the logged-in user.

    Used by the recruiter portal to show reviews that were
    sent back to the original job creator.
    """

    with get_connection() as conn:
        with conn.cursor() as cur:

            cur.execute(
                """
                SELECT
                    id,
                    job_id,
                    job_title,
                    comment,
                    reviewer_role,
                    action,
                    recipient_username,
                    created_at
                FROM job_comments
                WHERE recipient_username = %s
                ORDER BY created_at DESC
                """,
                (current_user,),
            )

            rows = cur.fetchall()

    return [_row_to_dict(row) for row in rows]


# ─────────────────────────────────────────────────────────────
# Single job route
# ─────────────────────────────────────────────────────────────


@router.get("/{job_id}")
def get_job(job_id: str):
    """
    Return a single approved job.
    Used by candidate portal job detail page.
    """

    with get_connection() as conn:
        with conn.cursor() as cur:

            cur.execute(
                """
                SELECT
                    id,
                    title,
                    location,
                    employment_type,
                    department,
                    description,
                    responsibilities,
                    requirements,
                    opening_date,
                    closing_date,
                    num_positions,
                    minio_bucket,
                    created_at,
                    created_by
                FROM jobs
                WHERE id = %s
                  AND is_approved = TRUE
                """,
                (job_id,),
            )

            row = cur.fetchone()

    if not row:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Job '{job_id}' not found or not yet approved."
            ),
        )

    return _row_to_dict(row)


# ─────────────────────────────────────────────────────────────
# Protected recruiter routes
# ─────────────────────────────────────────────────────────────


@router.post(
    "/",
    dependencies=[Depends(get_current_user)],
    status_code=201,
)
def create_job(
    payload: JobCreate,
    current_user: str = Depends(get_current_user),
):
    """
    Create a new job posting.

    Jobs are unapproved by default.

    The username of the logged-in recruiter is stored in
    jobs.created_by so that future review actions can be
    routed back to the original creator.
    """

    job_id = str(uuid.uuid4())

    with get_connection() as conn:
        with conn.cursor() as cur:

            cur.execute(
                """
                INSERT INTO jobs
                (
                    id,
                    title,
                    location,
                    employment_type,
                    department,
                    description,
                    responsibilities,
                    requirements,
                    opening_date,
                    closing_date,
                    num_positions,
                    is_approved,
                    minio_bucket,
                    created_by
                )
                VALUES
                (
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s
                )
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
                    payload.num_positions,
                    False,
                    None,
                    current_user,
                ),
            )

    return {
        "job_id": job_id,
        "is_approved": False,
        "minio_bucket": None,
        "created_by": current_user,
    }


# ─────────────────────────────────────────────────────────────
# Approve job
# ─────────────────────────────────────────────────────────────


@router.patch(
    "/{job_id}/approve",
    dependencies=[Depends(get_current_user)],
)
def approve_job(job_id: str):
    """
    Approve a job and create its dedicated MinIO bucket.
    """

    with get_connection() as conn:
        with conn.cursor() as cur:

            cur.execute(
                """
                SELECT
                    id,
                    title,
                    is_approved,
                    minio_bucket
                FROM jobs
                WHERE id = %s
                """,
                (job_id,),
            )

            row = cur.fetchone()

    if not row:
        raise HTTPException(
            status_code=404,
            detail=f"Job '{job_id}' not found.",
        )

    if row["is_approved"]:
        return {
            "job_id": job_id,
            "minio_bucket": row["minio_bucket"],
            "message": "Already approved.",
        }

    bucket = _bucket_name_for_job(
        job_id,
        row["title"],
    )

    # Create MinIO bucket
    ensure_bucket_exists(bucket)

    with get_connection() as conn:
        with conn.cursor() as cur:

            cur.execute(
                """
                UPDATE jobs
                SET
                    is_approved = TRUE,
                    minio_bucket = %s
                WHERE id = %s
                """,
                (
                    bucket,
                    job_id,
                ),
            )

    return {
        "job_id": job_id,
        "minio_bucket": bucket,
        "message": "Job approved.",
    }


# ─────────────────────────────────────────────────────────────
# Delete job
# ─────────────────────────────────────────────────────────────


@router.delete(
    "/{job_id}",
    dependencies=[Depends(get_current_user)],
    status_code=204,
)
def delete_job(job_id: str):
    """
    Delete a job posting and its MinIO bucket.
    """

    with get_connection() as conn:
        with conn.cursor() as cur:

            cur.execute(
                """
                SELECT
                    minio_bucket
                FROM jobs
                WHERE id = %s
                """,
                (job_id,),
            )

            row = cur.fetchone()

            if not row:
                raise HTTPException(
                    status_code=404,
                    detail=f"Job '{job_id}' not found.",
                )

            bucket = row.get("minio_bucket")

            if bucket:

                try:
                    delete_bucket(bucket)

                except Exception as exc:
                    print(
                        f"[JobsRouter] Warning: "
                        f"Failed to delete MinIO bucket "
                        f"{bucket}: {exc}"
                    )

            cur.execute(
                """
                DELETE FROM jobs
                WHERE id = %s
                """,
                (job_id,),
            )

            if cur.rowcount == 0:
                raise HTTPException(
                    status_code=404,
                    detail=f"Job '{job_id}' not found.",
                )

    return None


# ─────────────────────────────────────────────────────────────
# Update job
# ─────────────────────────────────────────────────────────────


@router.put(
    "/{job_id}",
    dependencies=[Depends(get_current_user)],
)
def update_job(
    job_id: str,
    payload: JobUpdate,
):
    """
    Update job details.
    """

    with get_connection() as conn:
        with conn.cursor() as cur:

            # -------------------------------------------------
            # 1. Check job exists
            # -------------------------------------------------

            cur.execute(
                """
                SELECT
                    id
                FROM jobs
                WHERE id = %s
                """,
                (job_id,),
            )

            if not cur.fetchone():
                raise HTTPException(
                    status_code=404,
                    detail=f"Job '{job_id}' not found.",
                )

            update_fields = []
            values = []

            # -------------------------------------------------
            # 2. Build dynamic UPDATE
            # -------------------------------------------------

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
                values.append(
                    json.dumps(payload.responsibilities)
                )

            if payload.requirements is not None:
                update_fields.append("requirements = %s")
                values.append(
                    json.dumps(payload.requirements)
                )

            if payload.opening_date is not None:
                update_fields.append("opening_date = %s")
                values.append(
                    payload.opening_date
                )

            if payload.closing_date is not None:
                update_fields.append("closing_date = %s")
                values.append(
                    payload.closing_date
                )

            if payload.num_positions is not None:
                update_fields.append("num_positions = %s")
                values.append(
                    payload.num_positions
                )

            # -------------------------------------------------
            # 3. Nothing to update
            # -------------------------------------------------

            if not update_fields:
                raise HTTPException(
                    status_code=400,
                    detail="No fields provided to update.",
                )

            # -------------------------------------------------
            # 4. Add job ID
            # -------------------------------------------------

            values.append(job_id)

            query = f"""
                UPDATE jobs
                SET {', '.join(update_fields)}
                WHERE id = %s
            """

            cur.execute(
                query,
                tuple(values),
            )

    return {
        "job_id": job_id,
        "message": "Job updated successfully.",
    }