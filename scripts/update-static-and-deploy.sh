#!/bin/bash
# Periodic script to update static examples and redeploy frontend
# Run this with cron or manually when examples are updated

set -e

echo "========================================"
echo "OLAI.ART - Static Examples Update"
echo "========================================"
echo "Started at: $(date)"
echo ""

# Change to project root
cd "$(dirname "$0")/.."

# 1. Sync examples from database to static files
echo "Step 1/3: Syncing examples from database..."
python3 scripts/sync-examples.py

if [ $? -ne 0 ]; then
    echo "❌ Failed to sync examples"
    exit 1
fi

echo "✅ Examples synced"
echo ""

# 2. Commit and push static files
echo "Step 2/3: Committing static examples..."
git add frontend/public/examples/
if git diff --cached --quiet; then
    echo "ℹ️  No changes to commit"
else
    git commit -m "Update static examples $(date '+%Y-%m-%d %H:%M')"
    git push origin main
    echo "✅ Changes pushed to main"
fi
echo ""

# 3. Trigger Vercel deploy
echo "Step 3/3: Deploying frontend to Vercel..."
curl -X POST "https://api.vercel.com/v1/integrations/deploy/prj_8msyhjERk6BWBdBSdKJDDxHjNJrq/DXSjiKoltz"

if [ $? -eq 0 ]; then
    echo "✅ Frontend deployment triggered"
else
    echo "❌ Failed to trigger deployment"
    exit 1
fi

echo ""
echo "========================================"
echo "✅ Update complete!"
echo "========================================"
echo "Finished at: $(date)"
echo ""
echo "Frontend will be live in ~2 minutes at https://olai.art"
echo "Static examples available at:"
echo "  - https://olai.art/examples/main.json"
echo "  - https://olai.art/examples/kids.json"
echo "  - https://olai.art/examples/totems.json"
