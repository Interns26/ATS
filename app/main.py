from fastapi import FastAPI
from app.services.storage import ensure_bucket_exists
from app.routers import storage

app = FastAPI(title="ATS - MinIO Storage Service")

# Make sure the bucket exists as soon as the app starts up.
ensure_bucket_exists()

app.include_router(storage.router)


@app.get("/health")
async def health():
    return {"status": "ok"}

# Run with: uvicorn app.main:app --reload --port 8000
# Then visit http://localhost:8000/docs to try the endpoints interactively.