# Copyright (c) 2026 Uworx UK. All rights reserved.

"""
General document-text-extraction endpoint.

Currently used for the "Upload Job Description" file input on the Home
page: the user picks a PDF/TXT, we extract the text server-side (reusing
the same pypdf/python-docx logic as resume parsing), and hand plain text
back so it can populate an editable textarea in the UI.
"""
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException

from workflow.parser import extract_text_from_bytes

router = APIRouter(prefix="/documents", tags=["Documents"])

SUPPORTED_EXTENSIONS = {".pdf", ".txt"}
router = APIRouter(prefix="/documents", tags=["Documents"])

SUPPORTED_EXTENSIONS = {".pdf", ".txt"}
MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024  # 2MB


@router.post("/extract-text")
async def extract_text(file: UploadFile = File(...)):
    ext = Path(file.filename).suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            400, f"Unsupported file type: {ext}. Allowed: {SUPPORTED_EXTENSIONS}"
        )

    contents = await file.read()
    if not contents:
        raise HTTPException(400, "Uploaded file is empty")

    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            400,
            f"File is too large ({len(contents) / (1024 * 1024):.1f}MB). "
            f"Maximum allowed size is {MAX_FILE_SIZE_BYTES / (1024 * 1024):.0f}MB.",
        )

    try:
        text = extract_text_from_bytes(contents, ext)
    except Exception as exc:
        raise HTTPException(422, f"Could not extract text from file: {exc}")

    if not text.strip():
        raise HTTPException(
            422,
            "No extractable text found in this file. "
            "It may be a scanned/image-only PDF — try pasting the text instead.",
        )

    return {"text": text}