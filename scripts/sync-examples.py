#!/usr/bin/env python3
"""
Sync examples from database to static files.
Downloads images, optimizes them, and generates JSON for each theme.
"""

import os
import sys
import json
import subprocess
from pathlib import Path
from urllib.parse import urlparse

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'backend'))

# Load environment
env_path = Path(__file__).parent.parent / 'backend' / '.env'
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            if line.strip() and not line.startswith('#') and '=' in line:
                key, _, value = line.partition('=')
                os.environ[key.strip()] = value.strip()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Could not load Supabase credentials")
    sys.exit(1)

# Output directory
FRONTEND_DIR = Path(__file__).parent.parent / 'frontend'
EXAMPLES_DIR = FRONTEND_DIR / 'public' / 'examples'
EXAMPLES_DIR.mkdir(parents=True, exist_ok=True)

def fetch_examples():
    """Fetch active examples from database."""
    print("Fetching active examples from database...")

    result = subprocess.run([
        'curl', '-s',
        f'{SUPABASE_URL}/rest/v1/examples?is_active=eq.true&order=display_order.asc',
        '-H', f'apikey: {SUPABASE_KEY}',
        '-H', f'Authorization: Bearer {SUPABASE_KEY}',
        '-H', 'Accept: application/json'
    ], capture_output=True, text=True)

    try:
        examples = json.loads(result.stdout)
        print(f"✓ Found {len(examples)} active examples")
        return examples
    except json.JSONDecodeError as e:
        print(f"ERROR: Failed to parse response: {e}")
        print(f"Response: {result.stdout}")
        sys.exit(1)

def download_image(url, output_path):
    """Download image from URL."""
    if not url:
        return False

    try:
        subprocess.run(['curl', '-s', '-L', '-o', output_path, url], check=True)
        return True
    except subprocess.CalledProcessError:
        print(f"  ✗ Failed to download: {url}")
        return False

def optimize_image(input_path, output_path, max_width=1200, quality=85):
    """Optimize image using ImageMagick/sips."""
    try:
        # Use sips (built-in macOS tool) to optimize
        subprocess.run([
            'sips',
            '-s', 'format', 'jpeg',
            '-s', 'formatOptions', str(quality),
            '-Z', str(max_width),
            input_path,
            '--out', output_path
        ], check=True, capture_output=True)

        # Get file sizes
        original_size = os.path.getsize(input_path)
        optimized_size = os.path.getsize(output_path)
        saved = original_size - optimized_size
        percent = (saved / original_size * 100) if original_size > 0 else 0

        print(f"    Optimized: {original_size//1024}KB → {optimized_size//1024}KB (saved {percent:.1f}%)")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        # Fallback: just copy the file
        import shutil
        shutil.copy(input_path, output_path)
        print(f"    Copied (optimization not available)")
        return True

def process_examples(examples):
    """Download and optimize all example images."""
    by_theme = {}

    for example in examples:
        theme = example.get('theme', 'main')

        if theme not in by_theme:
            by_theme[theme] = []

        # Create theme directory
        theme_dir = EXAMPLES_DIR / theme
        theme_dir.mkdir(exist_ok=True)

        print(f"\nProcessing: {example['title']} ({theme})")

        example_data = {
            'id': example['id'],
            'title': example['title'],
            'description': example.get('description'),
            'theme': theme,
            'before': None,
            'after': None,
        }

        # Download and optimize before image
        if example.get('before_image_url'):
            before_name = f"{example['id']}_before.jpg"
            before_temp = theme_dir / f"{example['id']}_before_temp"
            before_final = theme_dir / before_name

            print(f"  Downloading before image...")
            if download_image(example['before_image_url'], before_temp):
                optimize_image(before_temp, before_final)
                example_data['before'] = f"/examples/{theme}/{before_name}"
                before_temp.unlink()

        # Download and optimize after image
        if example.get('after_image_url'):
            after_name = f"{example['id']}_after.jpg"
            after_temp = theme_dir / f"{example['id']}_after_temp"
            after_final = theme_dir / after_name

            print(f"  Downloading after image...")
            if download_image(example['after_image_url'], after_temp):
                optimize_image(after_temp, after_final)
                example_data['after'] = f"/examples/{theme}/{after_name}"
                after_temp.unlink()

        by_theme[theme].append(example_data)

    return by_theme

def generate_json_files(by_theme):
    """Generate JSON files for each theme."""
    print("\nGenerating JSON files...")

    for theme, examples in by_theme.items():
        json_path = EXAMPLES_DIR / f"{theme}.json"

        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(examples, f, ensure_ascii=False, indent=2)

        print(f"  ✓ {theme}.json ({len(examples)} examples)")

    # Generate combined file
    combined_path = EXAMPLES_DIR / 'all.json'
    with open(combined_path, 'w', encoding='utf-8') as f:
        json.dump(by_theme, f, ensure_ascii=False, indent=2)

    print(f"  ✓ all.json")

def main():
    print("=" * 70)
    print("SYNCING EXAMPLES TO STATIC FILES")
    print("=" * 70)

    # Fetch examples
    examples = fetch_examples()

    # Process images
    by_theme = process_examples(examples)

    # Generate JSON files
    generate_json_files(by_theme)

    print("\n" + "=" * 70)
    print("✓ SYNC COMPLETE!")
    print("=" * 70)
    print(f"\nExamples saved to: {EXAMPLES_DIR}")
    print("\nTo use in components:")
    print("  import examples from '/examples/main.json'")

if __name__ == '__main__':
    main()
