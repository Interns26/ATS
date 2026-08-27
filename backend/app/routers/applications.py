# Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.

"""
Applications router.

Public endpoint — no JWT required.
Candidates submit their application (basic info + qualifications +
work experience + resume file) here.

POST /applications/{job_id}
  multipart/form-data fields:
    resume        — PDF or DOCX file
    basic_info    — JSON string  { email, firstName, lastName, city,
                                   stateProvince, mobileNumber, howHeard,
                                   cnic, phoneNumber, yearsOfExperience,
                                   currentJobTitle, currentEmployer }
    qualifications  — JSON array  [{ qualification, subject, institute,
                                     grade, graduationYear }, ...]
    work_experience — JSON array  [{ jobField, organization, jobTitle,
                                     startDate, currentlyWorking, endDate,
                                     startingSalary, endingSalary,
                                     jobDescription }, ...]
"""
import json
import re
import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.services.database import get_connection
from app.services.storage import upload_file

router = APIRouter(prefix="/applications", tags=["Applications"])

ALLOWED_EXTENSIONS = {".pdf", ".docx"}


@router.post("/{job_id}", status_code=201)
async def submit_application(
    job_id: str,
    resume: UploadFile = File(...),
    basic_info: str = Form(...),
    qualifications: str = Form("[]"),
    work_experience: str = Form("[]"),
):
    # ── 1. Parse JSON form fields ────────────────────────────────────────────
    try:
        basic = json.loads(basic_info)
        quals = json.loads(qualifications)
        work  = json.loads(work_experience)
    except json.JSONDecodeError as exc:
        raise HTTPException(400, f"Invalid JSON in form fields: {exc}")

    # ── 2. Validate resume file ──────────────────────────────────────────────
    ext = Path(resume.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            400,
            f"Unsupported file type '{ext}'. Allowed: {ALLOWED_EXTENSIONS}",
        )

    contents = await resume.read()
    if not contents:
        raise HTTPException(400, "Resume file is empty.")

    # ── 3. Look up the job and get its MinIO bucket ──────────────────────────
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, minio_bucket FROM jobs WHERE id = %s AND is_approved = TRUE",
                (job_id,),
            )
            job_row = cur.fetchone()

    if not job_row:
        raise HTTPException(
            404,
            f"Job '{job_id}' not found or is not open for applications.",
        )

    bucket = job_row["minio_bucket"]
    if not bucket:
        raise HTTPException(
            500,
            "This job has no associated storage bucket. Contact an administrator.",
        )

    # ── 4. Upload resume to the job's MinIO bucket ───────────────────────────
    first_name = basic.get("firstName", "") or ""
    last_name  = basic.get("lastName",  "") or ""
    full_name  = f"{first_name} {last_name}".strip() or "candidate"
    name_slug  = re.sub(r"[^a-z0-9]+", "-", full_name.lower()).strip("-")[:40]
    short_id   = str(uuid.uuid4()).replace("-", "")[:6]
    object_key = f"{name_slug}-{short_id}{ext}"

    upload_file(
        bucket,
        object_key,
        contents,
        content_type=resume.content_type or "application/octet-stream",
    )

    # ── 5. Insert into Postgres ──────────────────────────────────────────────
    with get_connection() as conn:
        with conn.cursor() as cur:

            # candidates — reuse existing record if the email is already in the DB
            email_val = basic.get("email", "").strip().lower()
            cur.execute(
                "SELECT id FROM candidates WHERE LOWER(email) = %s LIMIT 1",
                (email_val,),
            )
            existing_cand = cur.fetchone()

            if existing_cand:
                # Email already on file — update personal info and reuse the id
                candidate_id = str(existing_cand["id"])
                cur.execute(
                    """
                    UPDATE candidates
                    SET first_name          = %s,
                        last_name           = %s,
                        city                = %s,
                        state_province      = %s,
                        mobile_number       = %s,
                        how_heard           = %s,
                        cnic                = COALESCE(%s, cnic),
                        phone_number        = COALESCE(%s, phone_number),
                        years_of_experience = COALESCE(%s, years_of_experience),
                        current_job_title   = COALESCE(%s, current_job_title),
                        current_employer    = COALESCE(%s, current_employer)
                    WHERE id = %s
                    """,
                    (
                        basic.get("firstName", ""),
                        basic.get("lastName", ""),
                        basic.get("city"),
                        basic.get("stateProvince"),
                        basic.get("mobileNumber"),
                        basic.get("howHeard"),
                        basic.get("cnic"),
                        basic.get("phoneNumber"),
                        basic.get("yearsOfExperience"),
                        basic.get("currentJobTitle"),
                        basic.get("currentEmployer"),
                        candidate_id,
                    ),
                )
            else:
                # New email — insert a fresh candidate row
                cur.execute(
                    """
                    INSERT INTO candidates
                      (email, first_name, last_name, city, state_province,
                       mobile_number, how_heard, cnic, phone_number,
                       years_of_experience, current_job_title, current_employer)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                    """,
                    (
                        email_val,
                        basic.get("firstName", ""),
                        basic.get("lastName", ""),
                        basic.get("city"),
                        basic.get("stateProvince"),
                        basic.get("mobileNumber"),
                        basic.get("howHeard"),
                        basic.get("cnic"),
                        basic.get("phoneNumber"),
                        basic.get("yearsOfExperience"),
                        basic.get("currentJobTitle"),
                        basic.get("currentEmployer"),
                    ),
                )
                candidate_id = str(cur.fetchone()["id"])

            # applications
            cur.execute(
                """
                INSERT INTO applications
                  (candidate_id, job_id, resume_minio_key)
                VALUES (%s, %s, %s)
                RETURNING id
                """,
                (candidate_id, job_id, object_key),
            )
            application_id = str(cur.fetchone()["id"])

            # qualifications
            for q in quals:
                cur.execute(
                    """
                    INSERT INTO qualifications
                      (application_id, qualification, subject, institute,
                       grade, graduation_year)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (
                        application_id,
                        q.get("qualification"),
                        q.get("subject"),
                        q.get("institute"),
                        q.get("grade"),
                        q.get("graduationYear"),
                    ),
                )

            # work experience
            for w in work:
                cur.execute(
                    """
                    INSERT INTO work_experience
                      (application_id, job_field, organization, job_title,
                       start_date, currently_working, end_date,
                       starting_salary, ending_salary, job_description)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        application_id,
                        w.get("jobField"),
                        w.get("organization"),
                        w.get("jobTitle"),
                        w.get("startDate"),
                        bool(w.get("currentlyWorking", False)),
                        w.get("endDate"),
                        w.get("startingSalary"),
                        w.get("endingSalary"),
                        w.get("jobDescription"),
                    ),
                )

    return {
        "application_id": application_id,
        "candidate_id": candidate_id,
        "resume_key": object_key,
        "bucket": bucket,
    }
