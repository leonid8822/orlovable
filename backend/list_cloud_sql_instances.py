from googleapiclient import discovery
from oauth2client.client import GoogleCredentials
import os

PROJECT_ID = "jewelry-480514"
KEY_FILE_PATH = "google-credentials/jewelry-480514-10fe2d74d2e2.json"

# Resolve absolute path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
KEY_FILE = os.path.join(BASE_DIR, "../" + KEY_FILE_PATH)
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = KEY_FILE

def list_instances():
    service = discovery.build('sqladmin', 'v1beta4')

    req = service.instances().list(project=PROJECT_ID)
    resp = req.execute()
    
    instances = resp.get('items', [])
    if not instances:
        print("No Cloud SQL instances found.")
    else:
        for i in instances:
            print(f"Instance: {i['name']}")
            print(f"  Connection Name: {i['connectionName']}")
            print(f"  IP Addresses: {i.get('ipAddresses', [])}")
            print(f"  State: {i['state']}")

if __name__ == "__main__":
    list_instances()
