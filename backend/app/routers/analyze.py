# Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.

"""
Ties together the two previously-disconnected halves of the project:

  1. app/services/storage.py   -> pulls resume files out of MinIO
  2. workflow/graph.py         -> LangGraph pipeline (extract -> parse -> ATS score)

Now includes real-time result caching:
Before analyzing a candidate resume for a specific job, it checks if an ATS score
already exists in PostgreSQL for that candidate email + job. If cached, it immediately
returns the cached result instead of re-running the LLM pipeline.
"""
import json
import tempfile
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.database import get_connection
from app.services.storage import list_files, download_file
from workflow.graph import graph

router = APIRouter(prefix="/analyze", tags=["Analyze"])

SUPPORTED_EXTENSIONS = {".pdf", ".docx"}
MAX_PARALLEL_RESUMES = 5


class AnalyzeRequest(BaseModel):
    job_description: str


class CandidateResult(BaseModel):
    filename: str
    resume: dict
    ats: dict


class AnalyzeError(BaseModel):
    filename: str
    error: str


class AnalyzeResponse(BaseModel):
    bucket: str
    results: List[CandidateResult]
    failed: List[AnalyzeError]


def _get_candidate_email(object_key: str) -> str:
    """Find candidate email for a resume filename from PostgreSQL application records."""
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT c.email
                    FROM applications a
                    JOIN candidates c ON a.candidate_id = c.id
                    WHERE a.resume_minio_key = %s
                    LIMIT 1
                    """,
                    (object_key,),
                )
                row = cur.fetchone()
                if row and row.get("email"):
                    return row["email"]
    except Exception as exc:
        print(f"[AnalyzeRouter] Error fetching email for {object_key}: {exc}")

    # Fallback email derived from filename if not in database
    clean_name = object_key.replace("resume-", "").split(".")[0]
    return f"{clean_name}@candidate.ats"


def _run_workflow_for_resume(bucket_name: str, object_key: str, job_description: str) -> CandidateResult:
    """
    Checks cache first for existing ATS score for candidate email + job.
    If cached, returns cached result instantly without calling LLM.
    Otherwise runs LangGraph pipeline and caches the result.
    """
    candidate_email = _get_candidate_email(object_key)

    # ── 1. Check Cache in PostgreSQL ──────────────────────────────────────────
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT parsed_resume, ats_result
                    FROM resume_analysis
                    WHERE (email = %s OR filename = %s) AND job_id = %s
                    """,
                    (candidate_email, object_key, bucket_name),
                )
                cached = cur.fetchone()
                if cached:
                    print(f"[AnalyzeCache] Cache HIT for {candidate_email} / {bucket_name}!")
                    parsed = cached["parsed_resume"]
                    ats = cached["ats_result"]

                    if isinstance(parsed, str):
                        parsed = json.loads(parsed)
                    if isinstance(ats, str):
                        ats = json.loads(ats)

                    return CandidateResult(
                        filename=object_key,
                        resume=parsed,
                        ats=ats,
                    )
    except Exception as exc:
        print(f"[AnalyzeCache] Cache check warning: {exc}")

    # ── 2. Run LangGraph Workflow ────────────────────────────────────────────
    print(f"[AnalyzeCache] Cache MISS for {candidate_email} / {bucket_name} — executing LLM pipeline...")
    content = download_file(bucket_name, object_key)
    suffix = Path(object_key).suffix.lower()

    tmp = tempfile.NamedTemporaryFile(suffix=suffix, delete=False)
    try:
        tmp.write(content)
        tmp.close()

        state = {
            "resume_path": tmp.name,
            "job_description": job_description,
        }

        result = graph.invoke(state)
    finally:
        try:
            os.unlink(tmp.name)
        except OSError:
            pass

    resume_dict = result["parsed_resume"].model_dump()
    ats_dict = result["ats_result"].model_dump()

    # ── 3. Save Score in Cache ───────────────────────────────────────────────
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO resume_analysis (email, job_id, filename, parsed_resume, ats_result)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (email, job_id) DO UPDATE
                    SET parsed_resume = EXCLUDED.parsed_resume,
                        ats_result = EXCLUDED.ats_result,
                        filename = EXCLUDED.filename,
                        created_at = now()
                    """,
                    (
                        candidate_email,
                        bucket_name,
                        object_key,
                        json.dumps(resume_dict),
                        json.dumps(ats_dict),
                    ),
                )
                print(f"[AnalyzeCache] Cached result saved for {candidate_email} / {bucket_name}.")
    except Exception as exc:
        print(f"[AnalyzeCache] Cache save warning: {exc}")

    return CandidateResult(
        filename=object_key,
        resume=resume_dict,
        ats=ats_dict,
    )


@router.post("/{bucket_name}", response_model=AnalyzeResponse)
def analyze_bucket(bucket_name: str, payload: AnalyzeRequest):
    """
    Run every resume in `bucket_name` through the resume-parsing + ATS-scoring
    workflow against the supplied job description, returning cached or newly computed results.
    """
    if not payload.job_description.strip():
        raise HTTPException(400, "job_description is required")

    all_files = list_files(bucket_name)
    resume_files = [
        f for f in all_files
        if Path(f["filename"]).suffix.lower() in SUPPORTED_EXTENSIONS
    ]

    if not resume_files:
        raise HTTPException(
            404,
            f"No PDF/DOCX resumes found in bucket '{bucket_name}'.",
        )

    results: List[CandidateResult] = []
    failed: List[AnalyzeError] = []

    with ThreadPoolExecutor(max_workers=MAX_PARALLEL_RESUMES) as executor:
        future_to_key = {
            executor.submit(
                _run_workflow_for_resume,
                bucket_name,
                f["filename"],
                payload.job_description,
            ): f["filename"]
            for f in resume_files
        }

        for future in as_completed(future_to_key):
            object_key = future_to_key[future]
            try:
                results.append(future.result())
            except Exception as exc:
                failed.append(AnalyzeError(filename=object_key, error=str(exc)))

    if not results:
        raise HTTPException(
            500,
            f"All {len(resume_files)} resume(s) failed to analyze: {failed}",
        )

    # Highest ATS score first
    results.sort(key=lambda r: r.ats.get("ats_score", 0), reverse=True)

    return AnalyzeResponse(bucket=bucket_name, results=results, failed=failed)