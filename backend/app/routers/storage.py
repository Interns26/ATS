"""
Storage routes: list, download, and delete files from MinIO.

NOTE: POST /storage/upload has been removed.
Resumes are now ingested exclusively through POST /applications/{job_id}
(candidate portal submission). These remaining routes are kept for
internal tooling (inspecting buckets, downloading files for debugging).
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from io import BytesIO

from app.services.storage import (
    DEFAULT_BUCKET,
    download_file,
    list_files,
    delete_file,
)

router = APIRouter(prefix="/storage", tags=["storage"])


@router.get("/list")
async def list_all(prefix: str = ""):
    """List everything currently in the default bucket, optionally filtered by prefix."""
    return {"files": list_files(DEFAULT_BUCKET, prefix)}


@router.get("/download/{object_key:path}")
async def download(object_key: str):
    """Download a file by its object key, e.g. resume-<uuid>.pdf"""
    try:
        content = download_file(DEFAULT_BUCKET, object_key)
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
    delete_file(DEFAULT_BUCKET, object_key)
    return {"deleted": object_key}