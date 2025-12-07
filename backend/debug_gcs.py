import os
from google.cloud import storage

# Configuration
PROJECT_ID = "jewelry-480514"
BUCKET_NAME = "lovable-pendant-frontend"
KEY_FILE = "../google-credentials/jewelry-480514-10fe2d74d2e2.json"

# Resolve key file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
KEY_FILE = os.path.join(BASE_DIR, KEY_FILE)

def debug_gcs():
    if not os.path.exists(KEY_FILE):
        print(f"Key file not found: {KEY_FILE}")
        return

    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = KEY_FILE
    storage_client = storage.Client()
    bucket = storage_client.bucket(BUCKET_NAME)

    if not bucket.exists():
        print(f"Bucket {BUCKET_NAME} does not exist.")
        return

    print(f"Listing files in {BUCKET_NAME}:")
    blobs = list(bucket.list_blobs())
    if not blobs:
        print("  (Empty bucket)")
    for blob in blobs:
        print(f"  - {blob.name} (Public URL: {blob.public_url})")

    print("\nBucket details:")
    bucket.reload() # Refresh metadata
    print(f"  IAM Configuration: {bucket.iam_configuration}")
    
    # Check for Public Access Prevention
    # Note: python client exposes this usually via iam_configuration.public_access_prevention
    if hasattr(bucket.iam_configuration, 'public_access_prevention'):
         print(f"  Public Access Prevention: {bucket.iam_configuration.public_access_prevention}")
    else:
         print("  (Could not determine Public Access Prevention status directly)")

    # Attempt to disable it if enforced
    if bucket.iam_configuration.public_access_prevention == 'enforced':
        print("\nAttempting to disable Public Access Prevention...")
        try:
            bucket.iam_configuration.public_access_prevention = 'inherited'
            bucket.patch()
            print("  Success: Public Access Prevention set to 'inherited'.")
        except Exception as e:
            print(f"  Failed to disable Public Access Prevention: {e}")

if __name__ == "__main__":
    debug_gcs()
