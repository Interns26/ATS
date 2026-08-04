# Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.

from fastapi import APIRouter
from app.services.storage import list_buckets

router = APIRouter(prefix="/buckets", tags=["Buckets"])

@router.get("/")
def list_buckets_route():
    return list_buckets()