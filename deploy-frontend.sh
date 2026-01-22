#!/bin/bash

# Deploy frontend to Vercel
# Usage: ./deploy-frontend.sh

set -e

echo "🏗️  Building frontend..."
cd "$(dirname "$0")/frontend"
npm run build

echo "📦 Loading secrets..."
if [ -f "../secrets/.env" ]; then
    source ../secrets/.env
else
    echo "❌ secrets/.env not found!"
    exit 1
fi

if [ -z "$VERCEL_TOKEN" ]; then
    echo "❌ VERCEL_TOKEN not set in secrets/.env"
    echo "Get your token at: https://vercel.com/account/tokens"
    exit 1
fi

echo "🚀 Deploying to Vercel..."
vercel --prod --token "$VERCEL_TOKEN"

echo "✅ Done! Check https://olai.art"
