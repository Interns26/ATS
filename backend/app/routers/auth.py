from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.dependencies import get_current_user
from app.services.auth import authenticate_admin, create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest):
    if not authenticate_admin(payload.username, payload.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token, expires_in = create_access_token(payload.username)
    return LoginResponse(access_token=token, expires_in=expires_in)


@router.get("/me")
def me(username: str = Depends(get_current_user)):
    """Lets the frontend verify a stored token is still valid on page load."""
    return {"username": username}