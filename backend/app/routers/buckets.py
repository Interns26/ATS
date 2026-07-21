from fastapi import APIRouter
from app.services.storage import minio_client

router = APIRouter(prefix="/buckets", tags=["Buckets"])

@router.get("/")
def list_buckets():
    buckets = minio_client.list_buckets()

    return [
        {
            "name": bucket.name
        }
        for bucket in buckets
    ]