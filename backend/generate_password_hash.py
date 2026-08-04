# Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.

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