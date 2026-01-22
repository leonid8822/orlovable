#!/bin/bash

# Keep-alive pinger for Render backend
# Pings every 10 minutes to prevent cold starts

API_URL="https://jewelry-backend-nqev4d2b4a-lm.a.run.app/health"
INTERVAL=600  # 10 minutes

echo "🏓 Starting keep-alive pinger for Render backend"
echo "   URL: $API_URL"
echo "   Interval: ${INTERVAL}s (10 min)"
echo "   Press Ctrl+C to stop"
echo ""

while true; do
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 60 "$API_URL")

    if [ "$RESPONSE" = "200" ]; then
        echo "[$TIMESTAMP] ✅ Pong (${RESPONSE})"
    else
        echo "[$TIMESTAMP] ⚠️  Response: ${RESPONSE}"
    fi

    sleep $INTERVAL
done
