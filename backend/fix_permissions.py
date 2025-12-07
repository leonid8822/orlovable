import os
from google.cloud import storage

# Configuration
PROJECT_ID = "jewelry-480514"
BUCKET_NAME = "lovable-pendant-frontend"
KEY_FILE = "../google-credentials/jewelry-480514-10fe2d74d2e2.json"

# Resolve key file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
KEY_FILE = os.path.join(BASE_DIR, KEY_FILE)

def make_bucket_public():
    if not os.path.exists(KEY_FILE):
        print(f"Key file not found: {KEY_FILE}")
        return

    print(f"Authenticating with {KEY_FILE}...")
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = KEY_FILE
    
    storage_client = storage.Client()
    bucket = storage_client.bucket(BUCKET_NAME)

    # 1. Check if bucket exists
    if not bucket.exists():
        print(f"Bucket {BUCKET_NAME} not found!")
        return

    print(f"Setting IAM policy for {BUCKET_NAME} to public...")
    
    # 2. Get current policy
    policy = bucket.get_iam_policy(requested_policy_version=3)
    
    # 3. Add allUsers: roles/storage.objectViewer
    # Check if already exists
    binding_exists = False
    for binding in policy.bindings:
        if binding['role'] == 'roles/storage.objectViewer':
            if 'allUsers' in binding['members']:
                binding_exists = True
                print("Public access already granted (in IAM policy).")
            else:
                binding['members'].add('allUsers')
                print("Adding allUsers to existing objectViewer binding.")
                binding_exists = True
            break
    
    if not binding_exists:
        print("Creating new binding for objectViewer...")
        policy.bindings.append({
            "role": "roles/storage.objectViewer",
            "members": {"allUsers"}
        })

    # 4. Enable Uniform Bucket Level Access (Crucial for IAM policy to apply to all objects reliably)
    print("Enabling Uniform Bucket Level Access...")
    try:
        bucket.iam_configuration.uniform_bucket_level_access_enabled = True
        bucket.patch()
        print("  Success: Uniform Bucket Level Access enabled.")
    except Exception as e:
        print(f"  Failed to enable Uniform Bucket Level Access: {e}")

    # 5. Save policy (if needed, but UBLA might persist it. Re-applying to be sure)
    try:
        bucket.set_iam_policy(policy)
        print("Successfully updated bucket IAM policy to PUBLIC.")
    except Exception as e:
        print(f"Error setting IAM policy: {e}")
        print("Note: If 'Public Access Prevention' is enabled on the bucket, you must disable it via the Google Cloud Console.")

if __name__ == "__main__":
    make_bucket_public()
