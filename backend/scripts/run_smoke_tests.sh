#!/bin/bash
# Быстрый запуск smoke tests на PROD

set -e

echo "🚀 Running smoke tests on PROD..."
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 not found. Please install Python 3.9+"
    exit 1
fi

# Check httpx
if ! python3 -c "import httpx" 2>/dev/null; then
    echo "📦 Installing httpx..."
    pip3 install httpx
fi

# Run tests
cd "$(dirname "$0")"
python3 smoke_tests.py

# Exit with test result
exit $?
