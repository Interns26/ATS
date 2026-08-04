# Copyright (c) 2026 Uworx UK. All rights reserved.

from fastapi import APIRouter
from app.services.storage import list_buckets

router = APIRouter(prefix="/buckets", tags=["Buckets"])

@router.get("/")
def list_buckets_route():
    return list_buckets()