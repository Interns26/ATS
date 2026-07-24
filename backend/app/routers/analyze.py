"""
Ties together the two previously-disconnected halves of the project:

  1. app/services/storage.py   -> pulls resume files out of MinIO
  2. workflow/graph.py         -> LangGraph pipeline (extract -> parse -> ATS score)

Before this router existed, `workflow/` was only runnable as a standalone
script against a local folder (workflow/app.py) and nothing in the FastAPI
app ever imported it, so the frontend had no real endpoint to call for
analysis and Results.tsx / CandidateDetails.tsx were stubbed with mock data.
"""
import tempfile
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

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


def _run_workflow_for_resume(bucket_name: str, object_key: str, job_description: str) -> CandidateResult:
    """Download one resume from MinIO, run it through the LangGraph pipeline."""
    content = download_file(bucket_name, object_key)

    suffix = Path(object_key).suffix.lower()

    # delete=False + explicit close before graph.invoke(): on Windows, a
    # NamedTemporaryFile keeps an exclusive lock on the path while its
    # handle is open, so pypdf/python-docx opening the same path again
    # inside the pipeline fails with "PermissionError: [Errno 13]". We
    # close it ourselves first, then clean up manually in `finally`.
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

    return CandidateResult(
        filename=object_key,
        resume=result["parsed_resume"].model_dump(),
        ats=result["ats_result"].model_dump(),
    )


@router.post("/{bucket_name}", response_model=AnalyzeResponse)
def analyze_bucket(bucket_name: str, payload: AnalyzeRequest):
    """
    Run every resume in `bucket_name` through the resume-parsing + ATS-scoring
    workflow against the supplied job description, and return ranked results.
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