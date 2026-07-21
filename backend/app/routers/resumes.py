from fastapi import APIRouter

from app.services.storage import list_files

router = APIRouter(
    prefix="/resumes",
    tags=["Resumes"],
)


@router.get("/{bucket_name}")
def get_resumes(bucket_name: str):
    return list_files(bucket_name)