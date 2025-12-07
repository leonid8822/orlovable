import os
from google.cloud.devtools import cloudbuild_v1

# Configuration
PROJECT_ID = "jewelry-480514"
KEY_FILE = "../google-credentials/jewelry-480514-10fe2d74d2e2.json"

# Resolve key file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
KEY_FILE = os.path.join(BASE_DIR, KEY_FILE)

def debug_last_build():
    if not os.path.exists(KEY_FILE):
        print(f"Key file not found: {KEY_FILE}")
        return

    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = KEY_FILE
    client = cloudbuild_v1.CloudBuildClient()
    
    # List builds
    request = cloudbuild_v1.ListBuildsRequest(project_id=PROJECT_ID, page_size=1)
    page_result = client.list_builds(request=request)
    
    for build in page_result:
        print(f"Build ID: {build.id}")
        print(f"Status: {build.status.name}")
        print(f"Log URL: {build.log_url}")
        if build.failure_info:
             print(f"Failure Info: {build.failure_info}")
        return # Just the first one

if __name__ == "__main__":
    debug_last_build()
