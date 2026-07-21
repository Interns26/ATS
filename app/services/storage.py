"""
Storage service — wraps the MinIO SDK so the rest of the app never talks
to MinIO directly. Everyone else just calls upload_file() / download_file()
without knowing or caring that MinIO is involved underneath.
"""
import os
from io import BytesIO
from minio import Minio
from dotenv import load_dotenv

load_dotenv()  # reads the .env file into environment variables

# --- Connect to MinIO using the credentials from .env ---
client = Minio(
    os.getenv("MINIO_ENDPOINT"),          # e.g. "localhost:9000"
    access_key=os.getenv("MINIO_ACCESS_KEY"),
    secret_key=os.getenv("MINIO_SECRET_KEY"),
    secure=os.getenv("MINIO_SECURE", "false").lower() == "true",
)

BUCKET_NAME = os.getenv("MINIO_BUCKET", "resumes")


def ensure_bucket_exists():
    """Create the bucket if it doesn't already exist. Safe to call every startup."""
    if not client.bucket_exists(BUCKET_NAME):
        client.make_bucket(BUCKET_NAME)
        print(f"Created bucket: {BUCKET_NAME}")
    else:
        print(f"Bucket already exists: {BUCKET_NAME}")


def upload_file(object_key: str, file_bytes: bytes, content_type: str = "application/octet-stream"):
    """
    Upload raw bytes to MinIO under the given key.
    object_key example: "candidate-123/resume.pdf"
    """
    client.put_object(
        BUCKET_NAME,
        object_key,
        data=BytesIO(file_bytes),
        length=len(file_bytes),
        content_type=content_type,
    )
    return object_key


def download_file(object_key: str) -> bytes:
    """Fetch an object's raw bytes back out of MinIO."""
    response = client.get_object(BUCKET_NAME, object_key)
    try:
        return response.read()
    finally:
        response.close()
        response.release_conn()


def list_files(prefix: str = "") -> list[str]:
    """List all object keys in the bucket, optionally filtered by a prefix (folder)."""
    objects = client.list_objects(BUCKET_NAME, prefix=prefix, recursive=True)
    return [obj.object_name for obj in objects]


def delete_file(object_key: str):
    client.remove_object(BUCKET_NAME, object_key)