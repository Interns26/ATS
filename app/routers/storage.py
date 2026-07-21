"""
Routes for my branch's scope: getting files into and out of MinIO over HTTP.
Other teammates (resume-parser, ats-analysis) will later call storage.py
directly inside their own code — these routes are mainly for testing this
branch standalone, and for the "seed demo data" use case since the
candidate portal is out of scope.
"""
import uuid
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from io import BytesIO

from app.services.storage import upload_file, download_file, list_files, delete_file

router = APIRouter(prefix="/storage", tags=["storage"])

ALLOWED_EXTENSIONS = {".pdf", ".docx"}


@router.post("/upload")
async def upload(file: UploadFile = File(...)):
    """
    Upload a resume into MinIO.

    Naming convention:
      candidates/candidate-<uuid>/resume<ext>
    - "candidates/" top-level prefix keeps room for other categories later
      (e.g. "job-descriptions/") inside the same bucket.
    - a UUID per upload guarantees no collisions, even if two people upload
      a file called "resume.pdf" at the same time.
    - the stored filename is always exactly "resume<ext>" — the original,
      user-provided filename is NOT used in the key (it can contain spaces,
      apostrophes, unicode, etc. that break URLs). The original filename is
      still returned in the response so nothing is lost, just not used as
      the storage key.
    """
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Unsupported file type: {ext}. Allowed: {ALLOWED_EXTENSIONS}")

    contents = await file.read()
    if not contents:
        raise HTTPException(400, "Uploaded file is empty")

    candidate_id = str(uuid.uuid4())
    object_key = f"candidates/candidate-{candidate_id}/resume{ext}"

    upload_file(object_key, contents, content_type=file.content_type or "application/octet-stream")

    return {
        "candidate_id": candidate_id,
        "object_key": object_key,
        "original_filename": file.filename,
        "size_bytes": len(contents),
    }


@router.get("/list")
async def list_all(prefix: str = ""):
    """List everything currently in the bucket, optionally filtered by prefix."""
    return {"files": list_files(prefix)}


@router.get("/download/{object_key:path}")
async def download(object_key: str):
    """Download a file back out of MinIO by its key, e.g. candidates/candidate-abc/resume.pdf"""
    try:
        content = download_file(object_key)
    except Exception:
        raise HTTPException(404, f"File not found: {object_key}")

    filename = object_key.split("/")[-1]
    return StreamingResponse(
        BytesIO(content),
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.delete("/{object_key:path}")
async def delete(object_key: str):
    delete_file(object_key)
    return {"deleted": object_key}