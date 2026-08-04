# Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.

from io import BytesIO

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.services.database import get_connection
from app.services.storage import list_files, download_file

router = APIRouter(
    prefix="/resumes",
    tags=["Resumes"],
)


@router.get("/{bucket_name}")
def get_resumes(bucket_name: str):
    files = list_files(bucket_name)

    # Try querying candidate and qualification details from Postgres
    app_map = {}
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT a.resume_minio_key, c.first_name, c.last_name, c.email,
                           q.institute as university, q.grade as cgpa
                    FROM applications a
                    JOIN candidates c ON a.candidate_id = c.id
                    LEFT JOIN qualifications q ON q.application_id = a.id
                    """
                )
                rows = cur.fetchall()
                for r in rows:
                    key = r.get("resume_minio_key")
                    if key and key not in app_map:
                        app_map[key] = r
    except Exception as exc:
        print(f"[ResumesRouter] Could not fetch Postgres application details: {exc}")

    result = []
    for f in files:
        key = f["filename"]
        app_data = app_map.get(key, {})

        first = app_data.get("first_name", "") or ""
        last = app_data.get("last_name", "") or ""
        raw_name = f"{first} {last}".strip()

        if not raw_name:
            # Generate clean candidate name fallback from filename
            clean = key.replace("resume-", "").split(".")[0].replace("_", " ").replace("-", " ").title()
            raw_name = clean if clean else "Candidate"

        raw_cgpa = app_data.get("cgpa")
        parsed_cgpa = None
        if raw_cgpa is not None:
            try:
                parsed_cgpa = float(str(raw_cgpa).replace("/4.0", "").replace("/4", "").strip())
            except ValueError:
                pass

        result.append({
            "filename": key,
            "size": f.get("size", 0),
            "last_modified": f.get("last_modified", ""),
            "candidate_name": raw_name,
            "email": app_data.get("email") or "-",
            "university": app_data.get("university") or "N/A",
            "cgpa": parsed_cgpa,
            "download_url": f"http://localhost:8000/resumes/{bucket_name}/download/{key}"
        })

    return result


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