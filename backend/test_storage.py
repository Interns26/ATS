"""
Quick manual test — run this directly to prove storage.py actually works
against your running MinIO container, before wiring it into any API routes.

Run with: python test_storage.py
"""
from app.services.storage import ensure_bucket_exists, upload_file, download_file, list_files, delete_file

# 1. Make sure the bucket exists
ensure_bucket_exists()

# 2. Upload a small test file
test_key = "test-candidate/hello.txt"
upload_file(test_key, b"Hello from MinIO!", content_type="text/plain")
print(f"Uploaded: {test_key}")

# 3. List files to confirm it's there
files = list_files()
print(f"Files in bucket: {files}")

# 4. Download it back and check the contents match
content = download_file(test_key)
print(f"Downloaded content: {content.decode()}")
assert content == b"Hello from MinIO!", "Content mismatch!"
print("Content matches what we uploaded — success!")

# 5. Clean up the test file
delete_file(test_key)
print(f"Deleted: {test_key}")

print("\nAll storage.py functions work correctly.")