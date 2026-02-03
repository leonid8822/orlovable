#!/usr/bin/env python3
"""Execute gems migration using Supabase client."""

import os
import sys
import asyncio
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from supabase_client import supabase

migration_sql = """
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS gems JSONB DEFAULT '[]'::jsonb;

ALTER TABLE applications
ADD COLUMN IF NOT EXISTS back_engraving TEXT;

ALTER TABLE applications
ADD COLUMN IF NOT EXISTS has_back_engraving BOOLEAN DEFAULT false;

COMMENT ON COLUMN applications.gems IS 'Array of gem placements: [{id, gemId, x, y}]';
COMMENT ON COLUMN applications.back_engraving IS 'Text for back engraving';
COMMENT ON COLUMN applications.has_back_engraving IS 'Whether back engraving is enabled';

CREATE INDEX IF NOT EXISTS idx_applications_has_gems ON applications ((jsonb_array_length(gems) > 0));
"""

async def main():
    print("Checking if gems columns exist...")

    try:
        # Try to query with the new columns
        result = await supabase.select(
            "applications",
            columns=["id", "gems", "back_engraving", "has_back_engraving"],
            limit=1
        )

        print("✓ Columns already exist!")
        print(f"  Query returned {len(result)} row(s)")
        if result:
            print(f"  Sample data: {result[0]}")

        return True

    except Exception as e:
        error_msg = str(e).lower()

        if 'column' in error_msg and ('does not exist' in error_msg or 'not found' in error_msg):
            print("✗ Columns don't exist yet - migration needed!")
            print("\nAttempting to execute migration...")

            try:
                # Try to execute raw SQL
                await supabase.execute_sql(migration_sql)
                print("✓ Migration executed successfully!")
                return True

            except AttributeError:
                print("\n⚠ Cannot execute SQL directly through Supabase client")
                print("\nPlease execute this SQL manually in Supabase SQL Editor:")
                print("=" * 70)
                print(migration_sql)
                print("=" * 70)
                return False

        else:
            print(f"ERROR: {e}")
            return False

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
