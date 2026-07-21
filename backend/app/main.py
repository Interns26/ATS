from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.services.storage import ensure_bucket_exists
from app.routers import storage
from app.routers import buckets
from app.routers import resumes

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

# Register routers
app.include_router(storage.router)
app.include_router(buckets.router)
app.include_router(resumes.router)


@app.get("/health")
async def health():
    return {"status": "ok"}

# Run with:
# uvicorn app.main:app --reload --port 8000