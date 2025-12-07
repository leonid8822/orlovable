import os
from google.cloud import run_v2

# Configuration
PROJECT_ID = "jewelry-480514"
REGION = "europe-central2"
SERVICE_NAME = "jewelry-backend"
KEY_FILE = "../google-credentials/jewelry-480514-10fe2d74d2e2.json"

# Resolve key file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
KEY_FILE = os.path.join(BASE_DIR, KEY_FILE)

def get_service_url():
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = KEY_FILE
    
    client = run_v2.ServicesClient()
    name = f"projects/{PROJECT_ID}/locations/{REGION}/services/{SERVICE_NAME}"
    
    try:
        request = run_v2.GetServiceRequest(name=name)
        response = client.get_service(request=request)
        print(f"Service URL: {response.uri}")
        return response.uri
    except Exception as e:
        print(f"Error getting service URL: {e}")
        return None

if __name__ == "__main__":
    get_service_url()
