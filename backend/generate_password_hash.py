"""
Run this to generate a value for ADMIN_PASSWORD_HASH in backend/.env

Usage:
    python generate_password_hash.py
    (then paste the output into .env)
"""
import getpass

from app.services.auth import hash_password

if __name__ == "__main__":
    password = getpass.getpass("Enter the admin password to hash: ")
    confirm = getpass.getpass("Confirm password: ")

    if password != confirm:
        print("Passwords did not match. Try again.")
    else:
        print("\nAdd this line to backend/.env:\n")
        print(f"ADMIN_PASSWORD_HASH={hash_password(password)}")