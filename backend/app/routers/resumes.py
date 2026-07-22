from io import BytesIO

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.services.storage import list_files, download_file

router = APIRouter(
    prefix="/resumes",
    tags=["Resumes"],
)


@router.get("/{bucket_name}")
def get_resumes(bucket_name: str):
    return list_files(bucket_name)


@router.get("/{bucket_name}/download/{object_key:path}")
def download_resume(bucket_name: str, object_key: str):
    """Download a specific resume from the bucket it actually lives in
    (as opposed to /storage/download, which only serves DEFAULT_BUCKET)."""
    try:
        content = download_file(bucket_name, object_key)
    except Exception:
        raise HTTPException(
            404, f"File not found: {object_key} in bucket {bucket_name}"
        )

    filename = object_key.split("/")[-1]
    return StreamingResponse(
        BytesIO(content),
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )