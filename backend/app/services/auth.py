"""
Auth service: password hashing + JWT issuing/verification.

This project has a single admin account (credentials come from env vars,
not a database), so there's no user table — just a username/password-hash
pair checked against whatever is in `.env`.
"""
import os
from datetime import datetime, timedelta, timezone

import bcrypt
from dotenv import load_dotenv
from jose import JWTError, jwt

load_dotenv()

ALGORITHM = "HS256"
DEFAULT_EXPIRE_MINUTES = 120


class InvalidTokenError(Exception):
    """Raised when a JWT is missing, malformed, expired, or has a bad signature."""


def _get_jwt_secret() -> str:
    secret = os.getenv("JWT_SECRET_KEY")
    if not secret:
        raise RuntimeError(
            "JWT_SECRET_KEY is not set. Add it to backend/.env "
            "(see .env.example)."
        )
    return secret


def _get_expire_minutes() -> int:
    try:
        return int(os.getenv("JWT_EXPIRE_MINUTES", DEFAULT_EXPIRE_MINUTES))
    except ValueError:
        return DEFAULT_EXPIRE_MINUTES


def hash_password(plain_password: str) -> str:
    """Used to generate the ADMIN_PASSWORD_HASH value for .env — not called at runtime."""
    return bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"), hashed_password.encode("utf-8")
        )
    except ValueError:
        # malformed hash in .env
        return False


def authenticate_admin(username: str, password: str) -> bool:
    admin_username = os.getenv("ADMIN_USERNAME")
    admin_password_hash = os.getenv("ADMIN_PASSWORD_HASH")

    if not admin_username or not admin_password_hash:
        raise RuntimeError(
            "ADMIN_USERNAME / ADMIN_PASSWORD_HASH are not set. "
            "Add them to backend/.env (see .env.example)."
        )

    if username != admin_username:
        return False

    return verify_password(password, admin_password_hash)


def create_access_token(username: str) -> tuple[str, int]:
    """Returns (token, expires_in_seconds)."""
    expire_minutes = _get_expire_minutes()
    expire_at = datetime.now(timezone.utc) + timedelta(minutes=expire_minutes)

    payload = {"sub": username, "exp": expire_at}
    token = jwt.encode(payload, _get_jwt_secret(), algorithm=ALGORITHM)

    return token, expire_minutes * 60


def decode_access_token(token: str) -> str:
    """Returns the username (the `sub` claim). Raises InvalidTokenError on failure."""
    try:
        payload = jwt.decode(token, _get_jwt_secret(), algorithms=[ALGORITHM])
    except JWTError as exc:
        raise InvalidTokenError(str(exc)) from exc

    username = payload.get("sub")
    if not username:
        raise InvalidTokenError("Token missing subject claim")

    return username