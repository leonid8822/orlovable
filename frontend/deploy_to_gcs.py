import os
import sys
import mimetypes
from google.cloud import storage

# Configuration
BUCKET_NAME = "lovable-pendant-frontend" # Change if needed or pass as arg
DIST_DIR = "dist"
KEY_FILE = "gcs_key.json" # Default, or pass as arg

def deploy(key_path=KEY_FILE, bucket_name=BUCKET_NAME):
    if not os.path.exists(key_path):
        print(f"Error: Service Account Key file '{key_path}' not found.")
        print("Please place your JSON key file in this directory and name it 'gcs_key.json', or pass the path.")
        sys.exit(1)

    if not os.path.exists(DIST_DIR):
        print(f"Error: '{DIST_DIR}' directory not found. Run 'npm run build' first.")
        sys.exit(1)

    print(f"Authenticating with {key_path}...")
    try:
        client = storage.Client.from_service_account_json(key_path)
    except Exception as e:
        print(f"Authentication failed: {e}")
        sys.exit(1)

    print(f"Connecting to bucket '{bucket_name}'...")
    try:
        bucket = client.bucket(bucket_name)
        if not bucket.exists():
            print(f"Bucket {bucket_name} does not exist. Creating it...")
            bucket.create(location="US") # Default location
    except Exception as e:
        print(f"Error accessing/creating bucket: {e}")
        sys.exit(1)

    # Configure as website (if permissions allow)
    try:
        bucket.configure_website(main_page_suffix='index.html', not_found_page='index.html')
        print("Configured bucket for website hosting.")
    except Exception as e:
        print(f"Warning: Could not configure website settings (permissions?): {e}")

    # Upload files
    print(f"Uploading files from '{DIST_DIR}'...")
    for root, dirs, files in os.walk(DIST_DIR):
        for file in files:
            local_path = os.path.join(root, file)
            # Relative path in bucket
            blob_path = os.path.relpath(local_path, DIST_DIR)
            
            blob = bucket.blob(blob_path)
            
            # Mime type guessing
            content_type, _ = mimetypes.guess_type(local_path)
            if not content_type:
                content_type = 'application/octet-stream'
                
            # Manual Fixes for common web types if guess fails
            if file.endswith('.css'): content_type = 'text/css'
            if file.endswith('.js'): content_type = 'application/javascript'
            
            print(f"  Uploading {blob_path} ({content_type})...")
            try:
                blob.upload_from_filename(local_path, content_type=content_type)
                
                # Make public
                # Note: This might fail if "Enforce public access prevention" is on, or user lacks permissions
                try:
                    blob.make_public()
                except Exception as e:
                    pass # Often fails on uniform bucket-level IAM, harmless if bucket is public via IAM
            except Exception as e:
                print(f"Failed to upload {blob_path}: {e}")

    print("\nDeployment Complete!")
    print(f"Website URL: https://storage.googleapis.com/{bucket_name}/index.html")

if __name__ == "__main__":
    key_file = sys.argv[1] if len(sys.argv) > 1 else KEY_FILE
    deploy(key_path=key_file)
