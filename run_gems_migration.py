#!/usr/bin/env python3
"""Apply gems migration to applications table"""
import os
import sys
import asyncio

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Load environment
env_path = os.path.join(os.path.dirname(__file__), 'backend', '.env')
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            if line.strip() and not line.startswith('#') and '=' in line:
                key, _, value = line.partition('=')
                os.environ[key.strip()] = value.strip()

from supabase_client import SupabaseClient

async def main():
    print("Applying gems migration...")

    # Read migration SQL
    with open('backend/migrations/009_add_gems_to_applications.sql', 'r') as f:
        sql = f.read()

    client = SupabaseClient()

    try:
        # Try to execute SQL
        result = await client.execute_sql(sql)
        print(f"✓ Migration applied: {result}")
    except Exception as e:
        print(f"✗ Failed to apply migration via API: {e}")
        print("\nPlease run this SQL manually in Supabase SQL Editor:")
        print("=" * 70)
        print(sql)
        print("=" * 70)

if __name__ == '__main__':
    asyncio.run(main())
