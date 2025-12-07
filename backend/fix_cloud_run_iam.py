import os
from google.cloud import run_v2
from google.iam.v1 import iam_policy_pb2, policy_pb2

# Configuration
PROJECT_ID = "jewelry-480514"
REGION = "europe-central2"
SERVICE_NAME = "jewelry-backend"
KEY_FILE_PATH = "google-credentials/jewelry-480514-10fe2d74d2e2.json"

# Resolve absolute path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
KEY_FILE = os.path.join(BASE_DIR, "../" + KEY_FILE_PATH)

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = KEY_FILE

def make_public():
    client = run_v2.ServicesClient()
    resource = f"projects/{PROJECT_ID}/locations/{REGION}/services/{SERVICE_NAME}"
    
    print(f"Getting IAM policy for {resource}...")
    try:
        policy = client.get_iam_policy(request=iam_policy_pb2.GetIamPolicyRequest(resource=resource))
    except Exception as e:
        print(f"Error getting policy: {e}")
        return

    # Check if already public
    for binding in policy.bindings:
        if binding.role == "roles/run.invoker" and "allUsers" in binding.members:
            print("Service is already public.")
            return

    print("Adding public access binding...")
    # Create new binding
    # Note: We need to append to the repeated field 'bindings'
    binding = policy_pb2.Binding(role="roles/run.invoker", members=["allUsers"])
    policy.bindings.append(binding)

    print("Setting new IAM policy...")
    try:
        client.set_iam_policy(request=iam_policy_pb2.SetIamPolicyRequest(resource=resource, policy=policy))
        print("Successfully made service public (allUsers have roles/run.invoker).")
    except Exception as e:
        print(f"Error setting policy: {e}")

if __name__ == "__main__":
    make_public()
