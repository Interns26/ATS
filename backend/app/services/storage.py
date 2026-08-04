# Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.

"""
Storage service for MinIO.
"""

import os
from io import BytesIO

from dotenv import load_dotenv
from minio import Minio

load_dotenv()

_mc = Minio(
    os.getenv("MINIO_ENDPOINT"),
    access_key=os.getenv("MINIO_ACCESS_KEY"),
    secret_key=os.getenv("MINIO_SECRET_KEY"),
    secure=os.getenv("MINIO_SECURE", "false").lower() == "true",
)

DEFAULT_BUCKET = os.getenv("MINIO_BUCKET", "resumes")


def ensure_bucket_exists(bucket_name: str = DEFAULT_BUCKET):
    if not _mc.bucket_exists(bucket_name):
        _mc.make_bucket(bucket_name)


def list_buckets():
    buckets = _mc.list_buckets()
    return [{"name": b.name} for b in buckets]


def upload_file(
    bucket_name: str,
    object_key: str,
    file_bytes: bytes,
    content_type: str = "application/octet-stream",
):
    _mc.put_object(
        bucket_name,
        object_key,
        data=BytesIO(file_bytes),
        length=len(file_bytes),
        content_type=content_type,
    )
    return object_key


def download_file(bucket_name: str, object_key: str) -> bytes:
    response = _mc.get_object(bucket_name, object_key)
    try:
        return response.read()
    finally:
        response.close()
        response.release_conn()


def list_files(bucket_name: str, prefix: str = ""):
    objects = _mc.list_objects(bucket_name, prefix=prefix, recursive=True)
    return [
        {
            "filename": obj.object_name,
            "size": obj.size,
            "last_modified": obj.last_modified.isoformat(),
        }
        for obj in objects
    ]


def delete_file(bucket_name: str, object_key: str):
    _mc.remove_object(bucket_name, object_key)


def delete_bucket(bucket_name: str):
    """Delete a MinIO bucket and all files inside it."""
    if _mc.bucket_exists(bucket_name):
        objects = _mc.list_objects(bucket_name, recursive=True)
        for obj in objects:
            _mc.remove_object(bucket_name, obj.object_name)
        _mc.remove_bucket(bucket_name)

