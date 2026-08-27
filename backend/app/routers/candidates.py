# Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.

"""
Candidates router.

Protected endpoints (JWT required — for recruiter portal):
  GET  /candidates/           — list all candidates with enriched application data
  PUT  /candidates/{id}       — update a candidate's personal information
  GET  /candidates/export     — download all candidate data as an .xlsx file
"""
import io
import os
import smtplib
from email.message import EmailMessage
import json
from typing import Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.services.database import get_connection

router = APIRouter(prefix="/candidates", tags=["Candidates"])


# ── Pydantic models ──────────────────────────────────────────────────────────

class CandidateUpdate(BaseModel):
    email:          Optional[str] = None
    first_name:     Optional[str] = None
    last_name:      Optional[str] = None
    city:           Optional[str] = None
    state_province: Optional[str] = None
    mobile_number:  Optional[str] = None
    how_heard:      Optional[str] = None


class EmailBatchRequest(BaseModel):
    emails: list[str]
    subject: str
    body: str

# ── Helpers ──────────────────────────────────────────────────────────────────


def _build_candidate_rows() -> list[dict]:
    """
    Return all candidates enriched with their latest application's job title,
    the candidate's first qualification (university + CGPA), and the cached
    ATS score (if any).
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    c.id,
                    c.email,
                    c.first_name,
                    c.last_name,
                    c.city,
                    c.state_province,
                    c.mobile_number,
                    c.how_heard,
                    c.created_at,

                    -- most recent application
                    a.id           AS application_id,
                    a.submitted_at,
                    a.resume_minio_key,

                    -- job they applied for
                    j.title        AS job_title,
                    j.minio_bucket AS job_bucket,

                    -- first qualification
                    q.institute    AS university,
                    q.grade        AS cgpa,
                    q.qualification,
                    q.subject,
                    q.graduation_year

                FROM candidates c
                LEFT JOIN LATERAL (
                    SELECT id, submitted_at, resume_minio_key, job_id
                    FROM applications
                    WHERE candidate_id = c.id
                    ORDER BY submitted_at DESC
                    LIMIT 1
                ) a ON TRUE
                LEFT JOIN jobs j ON j.id = a.job_id
                LEFT JOIN LATERAL (
                    SELECT institute, grade, qualification, subject, graduation_year
                    FROM qualifications
                    WHERE application_id = a.id
                    ORDER BY graduation_year DESC NULLS LAST
                    LIMIT 1
                ) q ON TRUE
                ORDER BY c.created_at DESC
                """
            )
            rows = cur.fetchall()

    # Fetch ATS scores from resume_analysis
    ats_map: dict[str, int] = {}
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT email, job_id, ats_result FROM resume_analysis")
                for r in cur.fetchall():
                    ats_res = r.get("ats_result")
                    if isinstance(ats_res, str):
                        try:
                            ats_res = json.loads(ats_res)
                        except Exception:
                            ats_res = {}
                    score = ats_res.get("ats_score") if isinstance(ats_res, dict) else None
                    if score is not None:
                        key = f"{r['email']}::{r['job_id']}"
                        ats_map[key] = score
    except Exception as exc:
        print(f"[CandidatesRouter] ATS score lookup warning: {exc}")

    result = []
    for row in rows:
        d = dict(row)
        # Resolve ATS score
        email = d.get("email", "") or ""
        bucket = d.get("job_bucket", "") or ""
        ats_score = ats_map.get(f"{email}::{bucket}")

        # Stringify timestamps
        for k in ("created_at", "submitted_at"):
            if d.get(k) and hasattr(d[k], "isoformat"):
                d[k] = d[k].isoformat()
        # Stringify UUIDs
        for k in ("id", "application_id"):
            if d.get(k):
                d[k] = str(d[k])

        d["ats_score"] = ats_score
        result.append(d)

    return result


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/")
def list_candidates():
    """Return all candidates with enriched application, qualification, and ATS data."""
    return _build_candidate_rows()


@router.post("/email-batch", status_code=200)
def send_batch_emails(payload: EmailBatchRequest):
    """
    Sends an email to a batch of candidates.
    Uses real SMTP if configured in .env, otherwise falls back to simulating in logs.
    """
    if not payload.emails:
        raise HTTPException(400, "No emails provided.")

    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = os.getenv("SMTP_PORT", "587")
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM_EMAIL", smtp_username)

    if smtp_server and smtp_username and smtp_password:
        print(f"\n[Email Service] 📧 Attempting real SMTP delivery to {len(payload.emails)} candidates...")
        try:
            with smtplib.SMTP(smtp_server, int(smtp_port)) as server:
                server.starttls()
                server.login(smtp_username, smtp_password)

                for email_address in payload.emails:
                    msg = EmailMessage()
                    msg.set_content(payload.body)
                    msg["Subject"] = payload.subject
                    msg["From"] = smtp_from
                    msg["To"] = email_address

                    server.send_message(msg)
                    print(f"  -> Sent to {email_address}")

            print("[Email Service] ✅ Real SMTP delivery successful.\n")
        except Exception as e:
            print(f"[Email Service] ❌ SMTP Error: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")
            
        return {
            "message": f"Successfully sent real email to {len(payload.emails)} candidates via SMTP.",
            "recipients": len(payload.emails)
        }
    else:
        # Fallback to simulation mode if no SMTP credentials
        print(f"\n[Email Service] ⚠️ No SMTP credentials found. Simulating email to {len(payload.emails)} candidates...")
        print(f"Subject: {payload.subject}")
        print(f"Body:\n{payload.body}")
        print(f"Recipients: {', '.join(payload.emails)}\n")

        return {
            "message": f"Simulated sending email to {len(payload.emails)} candidates (no SMTP credentials configured).",
            "recipients": len(payload.emails)
        }


@router.delete("/{candidate_id}", status_code=204)
def delete_candidate(candidate_id: str):
    """
    Delete a candidate and all their associated data:
    qualifications, work_experience, resume_analysis cache, applications, and the candidate row.
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id, email FROM candidates WHERE id = %s", (candidate_id,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(404, f"Candidate '{candidate_id}' not found.")

            candidate_email = row["email"]

            # Fetch application IDs to cascade child deletions
            cur.execute(
                "SELECT id FROM applications WHERE candidate_id = %s",
                (candidate_id,),
            )
            app_ids = [str(r["id"]) for r in cur.fetchall()]

            if app_ids:
                placeholders = ", ".join(["%s"] * len(app_ids))
                cur.execute(f"DELETE FROM qualifications  WHERE application_id IN ({placeholders})", app_ids)
                cur.execute(f"DELETE FROM work_experience WHERE application_id IN ({placeholders})", app_ids)

            # Remove cached ATS analysis rows for this candidate
            cur.execute("DELETE FROM resume_analysis WHERE email = %s", (candidate_email,))

            # Remove applications
            cur.execute("DELETE FROM applications WHERE candidate_id = %s", (candidate_id,))

            # Finally remove the candidate
            cur.execute("DELETE FROM candidates WHERE id = %s", (candidate_id,))


@router.put("/{candidate_id}")
def update_candidate(candidate_id: str, payload: CandidateUpdate):
    """Update a candidate's personal information fields."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM candidates WHERE id = %s", (candidate_id,))
            if not cur.fetchone():
                raise HTTPException(404, f"Candidate '{candidate_id}' not found.")

            update_fields = []
            values = []

            if payload.email is not None:
                update_fields.append("email = %s")
                values.append(payload.email.strip())
            if payload.first_name is not None:
                update_fields.append("first_name = %s")
                values.append(payload.first_name.strip())
            if payload.last_name is not None:
                update_fields.append("last_name = %s")
                values.append(payload.last_name.strip())
            if payload.city is not None:
                update_fields.append("city = %s")
                values.append(payload.city.strip())
            if payload.state_province is not None:
                update_fields.append("state_province = %s")
                values.append(payload.state_province.strip())
            if payload.mobile_number is not None:
                update_fields.append("mobile_number = %s")
                values.append(payload.mobile_number.strip())
            if payload.how_heard is not None:
                update_fields.append("how_heard = %s")
                values.append(payload.how_heard.strip())

            if not update_fields:
                raise HTTPException(400, "No fields provided to update.")

            values.append(candidate_id)
            cur.execute(
                f"UPDATE candidates SET {', '.join(update_fields)} WHERE id = %s",
                tuple(values),
            )

    return {"candidate_id": candidate_id, "message": "Candidate updated successfully."}


@router.get("/export")
def export_candidates_xlsx():
    """
    Export all candidate data as an Excel (.xlsx) workbook.
    The sheet is structured like a Google Forms response export so it can
    be opened directly in Google Sheets.
    """
    try:
        import openpyxl
        from openpyxl.styles import Font, PatternFill, Alignment
    except ImportError:
        raise HTTPException(
            500,
            "openpyxl is not installed. Run: pip install openpyxl"
        )

    rows = _build_candidate_rows()

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Candidate Responses"

    # ── Header row (styled like Google Forms export) ─────────────────────────
    HEADERS = [
        "Timestamp",
        "First Name",
        "Last Name",
        "Email Address",
        "Phone Number",
        "City",
        "State / Province",
        "How Did You Hear",
        "Applied For (Job Title)",
        "University / Institute",
        "Qualification",
        "Subject",
        "CGPA / Grade",
        "Graduation Year",
        "ATS Score (%)",
        "Candidate ID",
        "Application Date",
        "Resume File",
    ]

    header_fill   = PatternFill("solid", fgColor="4472C4")
    header_font   = Font(color="FFFFFF", bold=True, size=10)
    header_align  = Alignment(horizontal="center", vertical="center", wrap_text=True)

    ws.append(HEADERS)
    for col_idx, _ in enumerate(HEADERS, start=1):
        cell = ws.cell(row=1, column=col_idx)
        cell.fill   = header_fill
        cell.font   = header_font
        cell.alignment = header_align

    ws.row_dimensions[1].height = 32

    # ── Data rows ─────────────────────────────────────────────────────────────
    alt_fill = PatternFill("solid", fgColor="EEF3FB")
    for row_idx, c in enumerate(rows, start=2):
        data = [
            c.get("created_at", ""),
            c.get("first_name", ""),
            c.get("last_name", ""),
            c.get("email", ""),
            c.get("mobile_number", ""),
            c.get("city", ""),
            c.get("state_province", ""),
            c.get("how_heard", ""),
            c.get("job_title", ""),
            c.get("university", ""),
            c.get("qualification", ""),
            c.get("subject", ""),
            c.get("cgpa", ""),
            c.get("graduation_year", ""),
            c.get("ats_score", ""),
            c.get("id", ""),
            c.get("submitted_at", ""),
            c.get("resume_minio_key", ""),
        ]
        ws.append(data)

        # Alternating row shading
        if row_idx % 2 == 0:
            for col_idx in range(1, len(HEADERS) + 1):
                ws.cell(row=row_idx, column=col_idx).fill = alt_fill

    # ── Column widths ─────────────────────────────────────────────────────────
    col_widths = [22, 16, 16, 28, 16, 14, 16, 18, 28, 28, 18, 18, 12, 16, 14, 36, 22, 32]
    for col_idx, width in enumerate(col_widths, start=1):
        ws.column_dimensions[ws.cell(row=1, column=col_idx).column_letter].width = width

    # ── Freeze header row ─────────────────────────────────────────────────────
    ws.freeze_panes = "A2"

    # ── Stream response ───────────────────────────────────────────────────────
    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": 'attachment; filename="candidates_export.xlsx"'
        },
    )
