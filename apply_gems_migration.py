#!/usr/bin/env python3
"""Apply gems migration to applications table"""
import os
import sys
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

print("Applying migration: Add gems column to applications...")

# Read migration file
with open('backend/migrations/009_add_gems_to_applications.sql', 'r') as f:
    sql = f.read()

# Execute via PostgREST RPC
# Since we can't execute DDL directly via REST API, we'll use curl with SQL editor
print("\nPlease run the following SQL in Supabase SQL Editor:")
print("=" * 70)
print(sql)
print("=" * 70)

print("\nOr run this command:")
print(f"cat backend/migrations/009_add_gems_to_applications.sql")
