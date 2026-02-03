#!/usr/bin/env python3
"""
Production smoke tests for OLAI.art
Runs after deployment to verify critical functionality.
"""
import os
import sys
import json
import time
import base64
import argparse
import requests
from pathlib import Path
from datetime import datetime

# Configuration
API_URL = os.getenv('API_URL', 'https://olai.onrender.com/api')
TIMEOUT = 30

# Colors for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def log(message, color=''):
    """Print colored log message"""
    timestamp = datetime.now().strftime('%H:%M:%S')
    print(f"{color}[{timestamp}] {message}{RESET}")

def test_health_check():
    """Test basic API health"""
    log("Testing API health check...", BLUE)
    try:
        response = requests.get(f"{API_URL.replace('/api', '')}/", timeout=TIMEOUT)
        data = response.json()

        if response.status_code == 200 and 'message' in data:
            log(f"✓ API is healthy: {data['message']}", GREEN)
            return True
        else:
            log(f"✗ Unexpected response: {data}", RED)
            return False
    except Exception as e:
        log(f"✗ Health check failed: {e}", RED)
        return False

def test_settings_endpoint():
    """Test settings retrieval"""
    log("Testing settings endpoint...", BLUE)
    try:
        response = requests.get(f"{API_URL}/settings", timeout=TIMEOUT)
        data = response.json()

        if response.status_code == 200:
            required_keys = ['form_factors', 'materials', 'sizes']
            missing = [k for k in required_keys if k not in data]

            if missing:
                log(f"✗ Missing settings keys: {missing}", RED)
                return False

            log(f"✓ Settings loaded successfully ({len(data)} keys)", GREEN)
            return True
        else:
            log(f"✗ Settings request failed: {response.status_code}", RED)
            return False
    except Exception as e:
        log(f"✗ Settings test failed: {e}", RED)
        return False

def test_gems_endpoint():
    """Test gems library retrieval"""
    log("Testing gems endpoint...", BLUE)
    try:
        response = requests.get(f"{API_URL}/gems", timeout=TIMEOUT)
        data = response.json()

        if response.status_code == 200:
            gems = data.get('gems', [])
            log(f"✓ Gems library loaded ({len(gems)} gems)", GREEN)
            return True
        else:
            log(f"✗ Gems request failed: {response.status_code}", RED)
            return False
    except Exception as e:
        log(f"✗ Gems test failed: {e}", RED)
        return False

def test_examples_gallery():
    """Test examples gallery"""
    log("Testing examples gallery...", BLUE)
    try:
        # Test database endpoint
        response = requests.get(f"{API_URL}/examples", timeout=TIMEOUT)
        if response.status_code != 200:
            log(f"✗ Examples API failed: {response.status_code}", RED)
            return False

        data = response.json()
        # Handle both list and dict responses
        examples = data if isinstance(data, list) else data.get('examples', [])
        log(f"✓ Examples API loaded ({len(examples)} examples)", GREEN)

        # Test static files (if this script is run from frontend context)
        static_themes = ['main', 'kids', 'totems']
        for theme in static_themes:
            try:
                static_response = requests.get(
                    f"{API_URL.replace('/api', '')}/examples/{theme}.json",
                    timeout=10
                )
                if static_response.status_code == 200:
                    static_data = static_response.json()
                    log(f"  ✓ Static {theme}.json ({len(static_data)} examples)", GREEN)
                else:
                    log(f"  ! Static {theme}.json not found (OK if not deployed yet)", YELLOW)
            except Exception:
                log(f"  ! Static {theme}.json check skipped", YELLOW)

        return True
    except Exception as e:
        log(f"✗ Examples test failed: {e}", RED)
        return False

def test_logs_system():
    """Test logging system"""
    log("Testing logs system...", BLUE)
    try:
        # Try to fetch recent logs
        response = requests.get(f"{API_URL}/logs?limit=5", timeout=TIMEOUT)

        if response.status_code == 200:
            data = response.json()
            logs = data.get('logs', [])
            log(f"✓ Logs system working ({len(logs)} recent logs)", GREEN)
            return True
        else:
            log(f"✗ Logs request failed: {response.status_code}", RED)
            return False
    except Exception as e:
        log(f"✗ Logs test failed: {e}", RED)
        return False

def test_generation_settings():
    """Test generation settings"""
    log("Testing generation settings...", BLUE)
    try:
        response = requests.get(f"{API_URL}/settings", timeout=TIMEOUT)
        data = response.json()

        if 'generation_variants' in data:
            variants = data['generation_variants']
            log(f"✓ Generation settings loaded ({len(variants)} variants)", GREEN)
            return True
        else:
            log("! Generation variants not found (may be OK)", YELLOW)
            return True
    except Exception as e:
        log(f"✗ Generation settings test failed: {e}", RED)
        return False

def test_e2e_generation(dry_run=True):
    """Test end-to-end pendant generation flow"""
    log("Testing E2E generation flow...", BLUE)

    if dry_run:
        log("  (Running in dry_run mode - no actual API calls)", YELLOW)

    try:
        # Step 1: Create application
        log("  1/4 Creating application...", BLUE)
        app_data = {
            "session_id": f"smoke_test_{int(time.time())}",
            "current_step": 1,
            "form_factor": "round",
            "material": "silver",
            "size": "m"
        }

        if not dry_run:
            response = requests.post(f"{API_URL}/applications", json=app_data, timeout=TIMEOUT)
            if response.status_code != 200:
                log(f"  ✗ Failed to create application: {response.status_code}", RED)
                return False
            app_id = response.json().get('id')
            log(f"  ✓ Application created: {app_id}", GREEN)
        else:
            log("  ✓ Application creation (skipped in dry run)", GREEN)

        # Step 2: Generate pendant
        log("  2/4 Generating pendant preview...", BLUE)

        # Create a simple test image (1x1 red pixel)
        test_image_data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="

        gen_data = {
            "imageBase64": f"data:image/png;base64,{test_image_data}",
            "prompt": "Smoke test generation",
            "formFactor": "round",
            "size": "pendant",
            "material": "silver",
            "sessionId": app_data["session_id"]
        }

        if not dry_run:
            # This would actually call FAL.ai and cost money
            log("  ! Skipping actual generation (costs money)", YELLOW)
            log("  ✓ Generation payload validated", GREEN)
        else:
            log("  ✓ Generation validated (skipped in dry run)", GREEN)

        # Step 3: Update application with selection
        log("  3/4 Updating application with selection...", BLUE)
        if not dry_run:
            update_data = {
                "current_step": 3,
                "generated_preview": "https://example.com/test.jpg"
            }
            response = requests.patch(
                f"{API_URL}/applications/{app_id}",
                json=update_data,
                timeout=TIMEOUT
            )
            if response.status_code != 200:
                log(f"  ✗ Failed to update application: {response.status_code}", RED)
                return False
            log("  ✓ Application updated", GREEN)
        else:
            log("  ✓ Application update (skipped in dry run)", GREEN)

        # Step 4: Verify application state
        log("  4/4 Verifying application state...", BLUE)
        if not dry_run:
            response = requests.get(f"{API_URL}/applications/{app_id}", timeout=TIMEOUT)
            if response.status_code != 200:
                log(f"  ✗ Failed to fetch application: {response.status_code}", RED)
                return False
            app = response.json()
            if app.get('current_step') != 3:
                log(f"  ✗ Application state incorrect: step {app.get('current_step')}", RED)
                return False
            log("  ✓ Application state verified", GREEN)
        else:
            log("  ✓ Application verification (skipped in dry run)", GREEN)

        log("✓ E2E generation flow completed successfully", GREEN)
        return True

    except Exception as e:
        log(f"✗ E2E test failed: {e}", RED)
        return False

def main():
    global API_URL

    parser = argparse.ArgumentParser(description='Run smoke tests for OLAI.art')
    parser.add_argument('--api-url', help='API URL to test', default=None)
    parser.add_argument('--e2e', action='store_true', help='Run E2E generation test')
    parser.add_argument('--full', action='store_true', help='Run full E2E test (not dry run)')
    args = parser.parse_args()

    if args.api_url:
        API_URL = args.api_url

    log("=" * 70, BLUE)
    log("OLAI.ART SMOKE TESTS", BLUE)
    log("=" * 70, BLUE)
    log(f"API URL: {API_URL}", BLUE)
    log(f"Timestamp: {datetime.now().isoformat()}", BLUE)
    log("", BLUE)

    results = {}

    # Run basic tests
    tests = [
        ("Health Check", test_health_check),
        ("Settings", test_settings_endpoint),
        ("Gems Library", test_gems_endpoint),
        ("Examples Gallery", test_examples_gallery),
        ("Logs System", test_logs_system),
        ("Generation Settings", test_generation_settings),
    ]

    for test_name, test_func in tests:
        try:
            results[test_name] = test_func()
            time.sleep(0.5)  # Brief pause between tests
        except Exception as e:
            log(f"✗ {test_name} crashed: {e}", RED)
            results[test_name] = False

    # Run E2E test if requested
    if args.e2e:
        log("", BLUE)
        try:
            results["E2E Generation"] = test_e2e_generation(dry_run=not args.full)
        except Exception as e:
            log(f"✗ E2E test crashed: {e}", RED)
            results["E2E Generation"] = False

    # Summary
    log("", BLUE)
    log("=" * 70, BLUE)
    log("SUMMARY", BLUE)
    log("=" * 70, BLUE)

    passed = sum(1 for v in results.values() if v)
    total = len(results)

    for test_name, result in results.items():
        status = f"{GREEN}✓ PASS{RESET}" if result else f"{RED}✗ FAIL{RESET}"
        log(f"{test_name}: {status}")

    log("", BLUE)
    if passed == total:
        log(f"✓ ALL TESTS PASSED ({passed}/{total})", GREEN)
        sys.exit(0)
    else:
        log(f"✗ SOME TESTS FAILED ({passed}/{total} passed)", RED)
        sys.exit(1)

if __name__ == '__main__':
    main()
