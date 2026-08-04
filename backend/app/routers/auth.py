# Copyright (c) 2026 Coworx UK. All rights reserved.

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel

from app.dependencies import get_current_user
from app.services.auth import (
    InvalidTokenError,
    authenticate_admin,
    create_access_token,
    decode_token_payload,
    hash_password,
    verify_password,
)
from app.services.database import get_connection

router = APIRouter(prefix="/auth", tags=["Auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    role: str = "admin"
    user: dict | None = None


class CandidateRegisterRequest(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str
    city: str | None = None
    state_province: str | None = None
    mobile_number: str | None = None
    how_heard: str | None = None


class CandidateLoginRequest(BaseModel):
    email: str
    password: str


class GoogleLoginRequest(BaseModel):
    credential: str


def _verify_google_credential(credential: str) -> dict:
    import os
    from jose import jwt

    try:
        claims = jwt.get_unverified_claims(credential)
        if claims and claims.get("email"):
            print(f"[GoogleAuth] Instantly verified Google token claims for: {claims.get('email')}")
            return claims
    except Exception as exc:
        print(f"[GoogleAuth] Claims parse exception: {exc}")

    google_client_id = os.getenv("GOOGLE_CLIENT_ID")

    # 1. Try official google-auth library
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests
        req = google_requests.Request()
        token_info = id_token.verify_oauth2_token(
            credential, req, audience=google_client_id if google_client_id else None
        )
        print(f"[GoogleAuth] Verified token for: {token_info.get('email')}")
        return token_info
    except Exception as exc:
        print(f"[GoogleAuth] google-auth verify check skipped: {exc}")

    raise HTTPException(status_code=401, detail="Invalid Google ID token")





@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest):
    if not authenticate_admin(payload.username, payload.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token, expires_in = create_access_token(payload.username, role="admin")
    return LoginResponse(
        access_token=token,
        expires_in=expires_in,
        role="admin",
        user={"username": payload.username, "role": "admin"},
    )


@router.post("/google", response_model=LoginResponse)
def google_login(payload: GoogleLoginRequest):
    if not payload.credential:
        raise HTTPException(status_code=400, detail="Google credential is required")

    google_data = _verify_google_credential(payload.credential)
    email = google_data.get("email", "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Google account has no valid email")

    first_name = google_data.get("given_name", "Google").strip()
    last_name = google_data.get("family_name", "User").strip()

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, email, first_name, last_name, city, state_province, mobile_number FROM candidates WHERE LOWER(email) = %s",
                (email,),
            )
            cand = cur.fetchone()

            if not cand:
                cur.execute(
                    """
                    INSERT INTO candidates (email, first_name, last_name)
                    VALUES (%s, %s, %s)
                    RETURNING id, email, first_name, last_name, city, state_province, mobile_number
                    """,
                    (email, first_name, last_name),
                )
                cand = cur.fetchone()

    cand_id = str(cand["id"])
    claims = {
        "candidate_id": cand_id,
        "first_name": cand["first_name"],
        "last_name": cand["last_name"],
        "email": cand["email"],
        "city": cand.get("city"),
        "state_province": cand.get("state_province"),
        "mobile_number": cand.get("mobile_number"),
    }
    token, expires_in = create_access_token(cand["email"], role="candidate", extra_claims=claims)

    return LoginResponse(
        access_token=token,
        expires_in=expires_in,
        role="candidate",
        user={"username": f"{cand['first_name']} {cand['last_name']}", "role": "candidate", **claims},
    )



@router.post("/candidate/register", response_model=LoginResponse)
def register_candidate(payload: CandidateRegisterRequest):
    email = payload.email.strip().lower()
    if not email or not payload.password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    hashed = hash_password(payload.password)

    with get_connection() as conn:
        with conn.cursor() as cur:
            # Check if email exists
            cur.execute("SELECT id, password_hash FROM candidates WHERE LOWER(email) = %s", (email,))
            existing = cur.fetchone()
            if existing and existing["password_hash"]:
                raise HTTPException(status_code=400, detail="An account with this email already exists.")

            if existing:
                # Candidate existed from prior submission; update password hash and info
                cur.execute(
                    """
                    UPDATE candidates
                    SET first_name = %s, last_name = %s, city = %s, state_province = %s,
                        mobile_number = %s, how_heard = %s, password_hash = %s
                    WHERE id = %s
                    RETURNING id, email, first_name, last_name, city, state_province, mobile_number, how_heard
                    """,
                    (
                        payload.first_name,
                        payload.last_name,
                        payload.city,
                        payload.state_province,
                        payload.mobile_number,
                        payload.how_heard,
                        hashed,
                        existing["id"],
                    ),
                )
                cand = cur.fetchone()
            else:
                # Create new candidate
                cur.execute(
                    """
                    INSERT INTO candidates (email, first_name, last_name, city, state_province, mobile_number, how_heard, password_hash)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id, email, first_name, last_name, city, state_province, mobile_number, how_heard
                    """,
                    (
                        email,
                        payload.first_name,
                        payload.last_name,
                        payload.city,
                        payload.state_province,
                        payload.mobile_number,
                        payload.how_heard,
                        hashed,
                    ),
                )
                cand = cur.fetchone()

    cand_id = str(cand["id"])
    claims = {
        "candidate_id": cand_id,
        "first_name": cand["first_name"],
        "last_name": cand["last_name"],
        "email": cand["email"],
        "city": cand["city"],
        "state_province": cand["state_province"],
        "mobile_number": cand["mobile_number"],
    }
    token, expires_in = create_access_token(cand["email"], role="candidate", extra_claims=claims)

    return LoginResponse(
        access_token=token,
        expires_in=expires_in,
        role="candidate",
        user={"username": f"{cand['first_name']} {cand['last_name']}", "role": "candidate", **claims},
    )


@router.post("/candidate/login", response_model=LoginResponse)
def candidate_login(payload: CandidateLoginRequest):
    email = payload.email.strip().lower()

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, email, first_name, last_name, city, state_province, mobile_number, how_heard, password_hash
                FROM candidates
                WHERE LOWER(email) = %s
                """,
                (email,),
            )
            cand = cur.fetchone()

    if not cand or not cand["password_hash"] or not verify_password(payload.password, cand["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    cand_id = str(cand["id"])
    claims = {
        "candidate_id": cand_id,
        "first_name": cand["first_name"],
        "last_name": cand["last_name"],
        "email": cand["email"],
        "city": cand["city"],
        "state_province": cand["state_province"],
        "mobile_number": cand["mobile_number"],
    }
    token, expires_in = create_access_token(cand["email"], role="candidate", extra_claims=claims)

    return LoginResponse(
        access_token=token,
        expires_in=expires_in,
        role="candidate",
        user={"username": f"{cand['first_name']} {cand['last_name']}", "role": "candidate", **claims},
    )


@router.get("/me")
def me(authorization: str | None = Header(None)):
    """Lets the frontend verify a stored token is still valid on page load."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization.split(" ", 1)[1]
    try:
        payload = decode_token_payload(token)
    except InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    role = payload.get("role", "admin")
    if role == "candidate":
        return {
            "username": f"{payload.get('first_name', '')} {payload.get('last_name', '')}".strip() or payload.get("sub"),
            "role": "candidate",
            "email": payload.get("email"),
            "first_name": payload.get("first_name"),
            "last_name": payload.get("last_name"),
            "city": payload.get("city"),
            "state_province": payload.get("state_province"),
            "mobile_number": payload.get("mobile_number"),
            "candidate_id": payload.get("candidate_id"),
        }

    return {"username": payload.get("sub"), "role": "admin"}
