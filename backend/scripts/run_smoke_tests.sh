#!/bin/bash
# Run smoke tests for OLAI.art
# Usage:
#   ./run_smoke_tests.sh           # Basic tests
#   ./run_smoke_tests.sh --e2e     # Include E2E test (dry run)
#   ./run_smoke_tests.sh --full    # Full E2E test (costs money!)

set -e

cd "$(dirname "$0")/.."

echo "Installing dependencies..."
pip install -q requests 2>/dev/null || pip3 install -q requests 2>/dev/null || true

echo ""
python3 scripts/smoke_tests.py "$@"
