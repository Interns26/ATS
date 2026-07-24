from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.services.storage import ensure_bucket_exists
from app.dependencies import get_current_user
from app.routers import auth
from app.routers import storage
from app.routers import buckets
from app.routers import resumes
from app.routers import analyze
from app.routers import documents

app = FastAPI(
    title="ATS - MinIO Storage Service"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create the default bucket (if it doesn't already exist)
ensure_bucket_exists()

# Register routers.
# `auth` is the only router that must stay open (you need it to log in at all).
# Everything else requires a valid bearer token.
app.include_router(auth.router)
app.include_router(storage.router, dependencies=[Depends(get_current_user)])
app.include_router(buckets.router, dependencies=[Depends(get_current_user)])
app.include_router(resumes.router, dependencies=[Depends(get_current_user)])
app.include_router(analyze.router, dependencies=[Depends(get_current_user)])
app.include_router(documents.router, dependencies=[Depends(get_current_user)])


@app.get("/health")
async def health():
    return {"status": "ok"}

# Run with:
# uvicorn app.main:app --reload --port 8000