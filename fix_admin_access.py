#!/usr/bin/env python3
"""Fix admin access for me@leonid.one"""

import os
import sys

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), 'backend', '.env')
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            if line.strip() and not line.startswith('#') and '=' in line:
                key, _, value = line.partition('=')
                os.environ[key.strip()] = value.strip()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Could not load Supabase credentials")
    sys.exit(1)

import subprocess
import json

# Check current status
print("Checking current admin status for me@leonid.one...")
check_cmd = [
    'curl', '-s',
    f'{SUPABASE_URL}/rest/v1/users?select=id,email,is_admin&email=eq.me@leonid.one',
    '-H', f'apikey: {SUPABASE_KEY}',
    '-H', f'Authorization: Bearer {SUPABASE_KEY}',
    '-H', 'Accept: application/json'
]

result = subprocess.run(check_cmd, capture_output=True, text=True)
try:
    users = json.loads(result.stdout)
    if not users:
        print("User not found. Creating new user...")
        create_cmd = [
            'curl', '-s', '-X', 'POST',
            f'{SUPABASE_URL}/rest/v1/users',
            '-H', f'apikey: {SUPABASE_KEY}',
            '-H', f'Authorization: Bearer {SUPABASE_KEY}',
            '-H', 'Content-Type: application/json',
            '-H', 'Prefer: return=representation',
            '-d', json.dumps({
                'email': 'me@leonid.one',
                'name': 'Leonid',
                'is_admin': True
            })
        ]
        create_result = subprocess.run(create_cmd, capture_output=True, text=True)
        print("Created user with admin access!")
        print(create_result.stdout)
    else:
        user = users[0]
        print(f"Found user: {user['email']}")
        print(f"Current is_admin: {user.get('is_admin', False)}")

        if not user.get('is_admin'):
            print("\nUpdating admin status to True...")
            update_cmd = [
                'curl', '-s', '-X', 'PATCH',
                f'{SUPABASE_URL}/rest/v1/users?id=eq.{user["id"]}',
                '-H', f'apikey: {SUPABASE_KEY}',
                '-H', f'Authorization: Bearer {SUPABASE_KEY}',
                '-H', 'Content-Type: application/json',
                '-H', 'Prefer: return=representation',
                '-d', json.dumps({'is_admin': True})
            ]
            update_result = subprocess.run(update_cmd, capture_output=True, text=True)
            print("✓ Admin access restored!")
            print(update_result.stdout)
        else:
            print("✓ User already has admin access!")

except json.JSONDecodeError as e:
    print(f"Error parsing response: {e}")
    print(f"Response: {result.stdout}")
    sys.exit(1)
