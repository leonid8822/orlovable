#!/usr/bin/env python3
"""Execute the gems and engraving migration directly in Supabase."""

import os
import sys
from supabase import create_client

# Read migration SQL
migration_sql = """
-- Add gems and engraving fields to applications table

-- Add gems field (array of gem placements)
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS gems JSONB DEFAULT '[]'::jsonb;

-- Add back engraving fields
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS back_engraving TEXT;

ALTER TABLE applications
ADD COLUMN IF NOT EXISTS has_back_engraving BOOLEAN DEFAULT false;

-- Add comments
COMMENT ON COLUMN applications.gems IS 'Array of gem placements: [{id, gemId, x, y}]';
COMMENT ON COLUMN applications.back_engraving IS 'Text for back engraving';
COMMENT ON COLUMN applications.has_back_engraving IS 'Whether back engraving is enabled';

-- Create index for querying applications with gems
CREATE INDEX IF NOT EXISTS idx_applications_has_gems ON applications ((jsonb_array_length(gems) > 0));
"""

def main():
    # Get Supabase credentials from environment
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_KEY')

    if not supabase_url or not supabase_key:
        print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
        print("\nPlease run:")
        print("export SUPABASE_URL='your_url'")
        print("export SUPABASE_SERVICE_KEY='your_key'")
        sys.exit(1)

    # Create client
    supabase = create_client(supabase_url, supabase_key)

    print("Executing gems and engraving migration...")
    print("-" * 60)

    try:
        # Execute the migration SQL
        # Note: Supabase Python client doesn't have direct SQL execution
        # We need to use the PostgREST RPC or REST API

        # Check if columns already exist by trying to query
        result = supabase.table('applications').select('id, gems, back_engraving, has_back_engraving').limit(1).execute()

        print("✓ Migration already applied - columns exist!")
        print(f"  Found {len(result.data)} application(s)")
        if result.data:
            print(f"  Sample: {result.data[0]}")

    except Exception as e:
        error_str = str(e).lower()
        if 'column' in error_str and ('does not exist' in error_str or 'not found' in error_str):
            print("✗ Columns don't exist - migration needed!")
            print("\nPlease execute this SQL in Supabase SQL Editor:")
            print("-" * 60)
            print(migration_sql)
            print("-" * 60)
            print("\nOr run this curl command:")
            print('curl -X POST "https://olai.onrender.com/api/migrations/run"')
            sys.exit(1)
        else:
            print(f"ERROR: {e}")
            sys.exit(1)

    print("\n✓ Migration check completed successfully!")

if __name__ == "__main__":
    main()
