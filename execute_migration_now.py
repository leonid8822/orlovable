#!/usr/bin/env python3
"""Execute the gems migration NOW using direct approach."""

import os
import sys
import asyncio
import httpx

# Get credentials from env
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    # Try loading from backend/.env
    env_path = os.path.join(os.path.dirname(__file__), 'backend', '.env')
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    key, _, value = line.partition('=')
                    if key.strip() == 'SUPABASE_URL':
                        SUPABASE_URL = value.strip()
                    elif key.strip() == 'SUPABASE_SERVICE_KEY':
                        SUPABASE_KEY = value.strip()

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Could not find Supabase credentials")
    sys.exit(1)

# Migration SQL - split into individual statements for better compatibility
migration_statements = [
    "ALTER TABLE applications ADD COLUMN IF NOT EXISTS gems JSONB DEFAULT '[]'::jsonb;",
    "ALTER TABLE applications ADD COLUMN IF NOT EXISTS back_engraving TEXT;",
    "ALTER TABLE applications ADD COLUMN IF NOT EXISTS has_back_engraving BOOLEAN DEFAULT false;",
    "COMMENT ON COLUMN applications.gems IS 'Array of gem placements: [{id, gemId, x, y}]';",
    "COMMENT ON COLUMN applications.back_engraving IS 'Text for back engraving';",
    "COMMENT ON COLUMN applications.has_back_engraving IS 'Whether back engraving is enabled';",
    "CREATE INDEX IF NOT EXISTS idx_applications_has_gems ON applications ((jsonb_array_length(gems) > 0));"
]

async def check_columns_exist():
    """Check if the gems columns already exist."""
    url = f"{SUPABASE_URL}/rest/v1/applications"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Accept": "application/json"
    }

    async with httpx.AsyncClient() as client:
        # Try to select the new columns
        response = await client.get(
            f"{url}?select=id,gems,back_engraving,has_back_engraving&limit=1",
            headers=headers
        )

        if response.status_code == 200:
            return True  # Columns exist
        elif response.status_code == 406 or 'column' in response.text.lower():
            return False  # Columns don't exist
        else:
            print(f"Unexpected response: {response.status_code} - {response.text}")
            return None

async def execute_via_deployed_endpoint():
    """Try to execute via the deployed migrations endpoint."""
    url = "https://olai.onrender.com/api/migrations/run"

    async with httpx.AsyncClient(timeout=30) as client:
        try:
            response = await client.post(url)
            if response.status_code == 200:
                print("✓ Migration executed via API endpoint!")
                print(response.json())
                return True
            else:
                return False
        except Exception as e:
            return False

async def main():
    print("Checking if gems migration is needed...")
    print("=" * 70)

    # First, try the deployed endpoint
    print("\nAttempt 1: Using deployed API endpoint...")
    if await execute_via_deployed_endpoint():
        print("\n✓ Migration completed successfully via API!")
        return

    print("  ✗ API endpoint not available yet (Render still deploying)")

    # Check if columns already exist
    print("\nAttempt 2: Checking if columns already exist...")
    exists = await check_columns_exist()

    if exists is True:
        print("  ✓ Columns already exist - migration not needed!")
        return

    if exists is False:
        print("  ✗ Columns don't exist - migration needed!")

    # We can't execute SQL directly, so provide instructions
    print("\nManual migration required:")
    print("=" * 70)
    print("Please execute the following SQL in Supabase SQL Editor:")
    print("(Dashboard -> SQL Editor -> New Query)")
    print("=" * 70)
    for stmt in migration_statements:
        print(stmt)
    print("=" * 70)

    print("\nOr wait for Render to deploy and run:")
    print("  curl -X POST https://olai.onrender.com/api/migrations/run")

if __name__ == "__main__":
    asyncio.run(main())
