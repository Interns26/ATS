"""
Storage service for MinIO.
"""

import os
from io import BytesIO

from dotenv import load_dotenv
from minio import Minio

load_dotenv()

minio_client = Minio(
    os.getenv("MINIO_ENDPOINT"),
    access_key=os.getenv("MINIO_ACCESS_KEY"),
    secret_key=os.getenv("MINIO_SECRET_KEY"),
    secure=os.getenv("MINIO_SECURE", "false").lower() == "true",
)

DEFAULT_BUCKET = os.getenv("MINIO_BUCKET", "resumes")


def ensure_bucket_exists(bucket_name: str = DEFAULT_BUCKET):
    """Create a bucket if it doesn't exist."""
    if not minio_client.bucket_exists(bucket_name):
        minio_client.make_bucket(bucket_name)
        print(f"Created bucket: {bucket_name}")
    else:
        print(f"Bucket already exists: {bucket_name}")


def list_buckets():
    """Return all buckets."""
    return minio_client.list_buckets()


def upload_file(
    bucket_name: str,
    object_key: str,
    file_bytes: bytes,
    content_type: str = "application/octet-stream",
):
    minio_client.put_object(
        bucket_name,
        object_key,
        data=BytesIO(file_bytes),
        length=len(file_bytes),
        content_type=content_type,
    )

    return object_key


def download_file(bucket_name: str, object_key: str) -> bytes:
    response = minio_client.get_object(
        bucket_name,
        object_key,
    )

    try:
        return response.read()

    finally:
        response.close()
        response.release_conn()


def list_files(
    bucket_name: str,
    prefix: str = "",
):
    objects = minio_client.list_objects(
        bucket_name,
        prefix=prefix,
        recursive=True,
    )

    files = []

    for obj in objects:
        files.append(
            {
                "filename": obj.object_name,
                "size": obj.size,
                "last_modified": obj.last_modified.isoformat(),
            }
        )

    return files


def delete_file(
    bucket_name: str,
    object_key: str,
):
    minio_client.remove_object(
        bucket_name,
        object_key,
    )