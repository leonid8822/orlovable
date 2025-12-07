import google.auth
import google.auth.transport.requests
import requests
import os
import json

# Configuration
PROJECT_ID = "jewelry-480514"
KEY_FILE_PATH = "google-credentials/jewelry-480514-10fe2d74d2e2.json"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
KEY_FILE = os.path.join(BASE_DIR, "../" + KEY_FILE_PATH)
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = KEY_FILE

def enable_api():
    try:
        creds, project = google.auth.default(scopes=['https://www.googleapis.com/auth/cloud-platform'])
        auth_req = google.auth.transport.requests.Request()
        creds.refresh(auth_req)
        token = creds.token
        
        print(f"Authenticated. Enabling sqladmin.googleapis.com for {PROJECT_ID}...")
        
        # POST to enable service
        resp = requests.post(
            f"https://serviceusage.googleapis.com/v1/projects/{PROJECT_ID}/services/sqladmin.googleapis.com:enable",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        print(f"Status: {resp.status_code}")
        print(resp.json())

    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    enable_api()
