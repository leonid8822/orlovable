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

def list_instances():
    try:
        creds, project = google.auth.default(scopes=['https://www.googleapis.com/auth/cloud-platform'])
        auth_req = google.auth.transport.requests.Request()
        creds.refresh(auth_req)
        token = creds.token
        
        print(f"Authenticated. Listing instances for {PROJECT_ID}...")
        
        resp = requests.get(
            f"https://sqladmin.googleapis.com/sql/v1beta4/projects/{PROJECT_ID}/instances",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if resp.status_code != 200:
            print(f"Error: {resp.status_code} {resp.text}")
            return

        data = resp.json()
        items = data.get('items', [])
        
        if not items:
            print("No Cloud SQL instances found.")
        else:
            for i in items:
                print(f"Instance: {i['name']}")
                print(f"  Connection Name: {i.get('connectionName')}")
                print(f"  State: {i.get('state')}")
                
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    list_instances()
