#!/usr/bin/env python3
"""Update form factor labels to remove gender mentions"""

import os
import sys
import json
import subprocess

# Load environment
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

# Get current settings
print("Fetching current settings...")
result = subprocess.run([
    'curl', '-s',
    f'{SUPABASE_URL}/rest/v1/generation_settings?key=eq.form_factors',
    '-H', f'apikey: {SUPABASE_KEY}',
    '-H', f'Authorization: Bearer {SUPABASE_KEY}',
    '-H', 'Accept: application/json'
], capture_output=True, text=True)

try:
    settings = json.loads(result.stdout)
    if not settings:
        print("No form_factors settings found")
        sys.exit(1)

    current = settings[0]
    form_factors = current['value']

    # Update labels
    form_factors['round']['description'] = 'Круглый кулон'
    form_factors['oval']['description'] = 'Жетон'

    print("\nUpdated form factors:")
    print(f"  round: {form_factors['round']['description']}")
    print(f"  oval: {form_factors['oval']['description']}")
    print(f"  contour: {form_factors['contour']['description']}")

    # Update in database
    print("\nUpdating database...")
    update_result = subprocess.run([
        'curl', '-s', '-X', 'PATCH',
        f'{SUPABASE_URL}/rest/v1/generation_settings?key=eq.form_factors',
        '-H', f'apikey: {SUPABASE_KEY}',
        '-H', f'Authorization: Bearer {SUPABASE_KEY}',
        '-H', 'Content-Type: application/json',
        '-H', 'Prefer: return=representation',
        '-d', json.dumps({'value': form_factors})
    ], capture_output=True, text=True)

    print("✓ Updated successfully!")
    print(update_result.stdout)

except json.JSONDecodeError as e:
    print(f"Error: {e}")
    print(f"Response: {result.stdout}")
    sys.exit(1)
