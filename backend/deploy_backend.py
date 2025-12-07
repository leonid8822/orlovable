import os
import sys
import shutil
import tarfile
from google.cloud import storage
from google.cloud.devtools import cloudbuild_v1
from google.protobuf.duration_pb2 import Duration

# Configuration
SERVICE_NAME = "jewelry-backend"
REGION = "europe-central2"
PROJECT_ID = "jewelry-480514"

# Resolve key file relative to this script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
KEY_FILE = os.path.join(BASE_DIR, "../google-credentials/jewelry-480514-10fe2d74d2e2.json")
BUCKET_NAME = f"{PROJECT_ID}_cloudbuild"

def deploy_backend():
    if not os.path.exists(KEY_FILE):
        print(f"Error: Key file {KEY_FILE} not found.")
        sys.exit(1)

    print(f"Authenticating...")
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = KEY_FILE
    
    # Change to backend directory to ensure Dockerfile is at source root
    os.chdir(BASE_DIR)

    # 1. Zip Backend Source
    source_archive = "source.tgz"
    print(f"Archiving backend source to {source_archive}...")
    
    def exclude_filter(tarinfo):
        if "venv" in tarinfo.name or "__pycache__" in tarinfo.name or ".git" in tarinfo.name or "node_modules" in tarinfo.name:
            return None
        return tarinfo

    with tarfile.open(source_archive, "w:gz") as tar:
        tar.add(".", arcname=".", filter=exclude_filter)

    # 2. Upload to GCS
    print(f"Uploading source to gs://{BUCKET_NAME}...")
    storage_client = storage.Client()
    try:
        bucket = storage_client.bucket(BUCKET_NAME)
        if not bucket.exists():
            bucket.create(location=REGION)
    except Exception as e:
        print(f"Bucket check/create failed: {e}")
        # Proceed hoping bucket exists or permission issues clarify later
    
    blob = bucket.blob(source_archive)
    blob.upload_from_filename(source_archive)
    print("Source uploaded.")

    # 3. Trigger Cloud Build
    print("Triggering Cloud Build...")
    client = cloudbuild_v1.CloudBuildClient()
    
    build = cloudbuild_v1.Build()
    build.source = {
        "storage_source": {
            "bucket": BUCKET_NAME,
            "object_": source_archive,
        }
    }
    
    # Build steps: Docker Build -> Docker Push -> Cloud Run Deploy
    image_name = f"gcr.io/{PROJECT_ID}/{SERVICE_NAME}"
    
    build.steps = [
        # Build
        {
            "name": "gcr.io/cloud-builders/docker",
            "args": ["build", "-t", image_name, "."],
        },
        # Push
        {
            "name": "gcr.io/cloud-builders/docker",
            "args": ["push", image_name],
        },
        # Deploy
        {
            "name": "gcr.io/google.com/cloudsdktool/cloud-sdk",
            "entrypoint": "gcloud",
            "args": [
                "run", "deploy", SERVICE_NAME,
                "--image", image_name,
                "--region", REGION,
                "--platform", "managed",
                "--allow-unauthenticated",
                "--port", "8080",
                "--allow-unauthenticated",
                "--port", "8080",
                # Enable Cloud SQL
                "--add-cloudsql-instances", "jewelry-480514:me-west1:jewelry-db",
                # Use Cloud SQL Socket for connection (overrides local .env)
                "--set-env-vars", "DATABASE_URL=postgresql://gen_user:OneHero2025!@/jewelry_db?host=/cloudsql/jewelry-480514:me-west1:jewelry-db"
            ],
        },
    ]
    
    build.images = [image_name]
    build.timeout = Duration(seconds=1200)

    operation = client.create_build(project_id=PROJECT_ID, build=build)
    
    print("Build submitted. Waiting for completion...")
    result = operation.result()

    print(f"Build {result.status}!")
    print(f"Logs: {result.log_url}")

    # Clean up
    if os.path.exists(source_archive):
        os.remove(source_archive)

if __name__ == "__main__":
    from dotenv import load_dotenv
    # Load .env from project root
    load_dotenv(os.path.join(BASE_DIR, "../.env"))
    deploy_backend()
