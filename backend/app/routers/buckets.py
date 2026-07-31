from fastapi import APIRouter
from app.services.storage import list_buckets

router = APIRouter(prefix="/buckets", tags=["Buckets"])

@router.get("/")
def list_buckets_route():
    return list_buckets()