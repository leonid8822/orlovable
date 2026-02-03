#!/bin/bash

set -e

echo "Checking gems migration status..."
echo "=================================================================="

# Load environment variables
if [ -f backend/.env ]; then
    export $(cat backend/.env | grep -v '^#' | xargs)
fi

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo "ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set"
    exit 1
fi

# Try the deployed endpoint first
echo
echo "Attempt 1: Using deployed API endpoint..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "https://olai.onrender.com/api/migrations/run")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ Migration executed via API endpoint!"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    exit 0
fi

echo "  ✗ API endpoint not available (HTTP $HTTP_CODE) - Render still deploying"

# Check if columns exist
echo
echo "Attempt 2: Checking if columns already exist..."
CHECK_RESPONSE=$(curl -s -w "\n%{http_code}" \
    "$SUPABASE_URL/rest/v1/applications?select=id,gems,back_engraving,has_back_engraving&limit=1" \
    -H "apikey: $SUPABASE_SERVICE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_KEY")

CHECK_CODE=$(echo "$CHECK_RESPONSE" | tail -n1)
CHECK_BODY=$(echo "$CHECK_RESPONSE" | sed '$d')

if [ "$CHECK_CODE" = "200" ]; then
    echo "  ✓ Columns already exist - migration not needed!"
    echo "  Sample data:"
    echo "$CHECK_BODY" | python3 -m json.tool 2>/dev/null || echo "$CHECK_BODY"
    exit 0
fi

echo "  ✗ Columns don't exist (HTTP $CHECK_CODE) - migration needed!"

# Can't execute SQL directly, provide manual instructions
echo
echo "Manual migration required:"
echo "=================================================================="
echo "Please execute the following SQL in Supabase SQL Editor:"
echo "(Dashboard -> SQL Editor -> New Query)"
echo "=================================================================="
cat backend/migrations/005_add_gems_and_engraving_to_applications.sql
echo "=================================================================="
echo
echo "Or wait for Render to finish deploying and run:"
echo "  curl -X POST https://olai.onrender.com/api/migrations/run"
