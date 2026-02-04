#!/usr/bin/env python3
"""
Sync examples from Supabase database to static files in frontend/public/examples/

This script:
1. Fetches all active examples from the database
2. Downloads and optimizes images (resize, WebP conversion)
3. Generates JSON files for each theme
4. Optionally triggers frontend deploy

Usage:
    python scripts/sync_examples_to_static.py [--deploy]

Options:
    --deploy    Trigger Vercel deploy after sync
"""

import os
import sys
import json
import asyncio
import argparse
from pathlib import Path
from io import BytesIO
from typing import Optional
import httpx
from PIL import Image

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://vofigcbihwkmocrsfowt.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
API_URL = os.getenv("API_URL", "https://olai.onrender.com")

# Image optimization settings
MAX_WIDTH = 800  # Max width for gallery images
MAX_HEIGHT = 800  # Max height for gallery images
THUMBNAIL_SIZE = 400  # Size for thumbnails
JPEG_QUALITY = 85
WEBP_QUALITY = 85

# Paths
SCRIPT_DIR = Path(__file__).parent
BACKEND_DIR = SCRIPT_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent
FRONTEND_PUBLIC = PROJECT_ROOT / "frontend" / "public" / "examples"

# Themes
THEMES = ["main", "kids", "totems", "custom"]


async def fetch_examples_from_api() -> list:
    """Fetch examples from the API endpoint."""
    print("Fetching examples from API...")

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(f"{API_URL}/api/examples")
        response.raise_for_status()
        data = response.json()

        # Handle both array and object response
        examples = data if isinstance(data, list) else data.get("examples", [])
        print(f"  Found {len(examples)} examples")
        return examples


async def fetch_examples_from_supabase() -> list:
    """Fetch examples directly from Supabase."""
    print("Fetching examples from Supabase...")

    if not SUPABASE_KEY:
        print("  ERROR: SUPABASE_SERVICE_KEY not set")
        return []

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        url = f"{SUPABASE_URL}/rest/v1/examples?select=*&is_active=eq.true&order=display_order.asc"
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        examples = response.json()
        print(f"  Found {len(examples)} active examples")
        return examples


async def download_image(url: str) -> Optional[bytes]:
    """Download image from URL."""
    if not url or url.startswith("data:"):
        return None

    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.content
    except Exception as e:
        print(f"  Warning: Failed to download {url}: {e}")
        return None


def optimize_image(image_bytes: bytes, max_size: int = MAX_WIDTH, quality: int = JPEG_QUALITY) -> bytes:
    """Optimize image: resize and compress."""
    try:
        img = Image.open(BytesIO(image_bytes))

        # Convert to RGB if necessary (for WebP/JPEG output)
        if img.mode in ("RGBA", "P"):
            # Create white background for transparency
            background = Image.new("RGB", img.size, (255, 255, 255))
            if img.mode == "RGBA":
                background.paste(img, mask=img.split()[3])
            else:
                background.paste(img)
            img = background
        elif img.mode != "RGB":
            img = img.convert("RGB")

        # Resize if larger than max size
        if img.width > max_size or img.height > max_size:
            img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)

        # Save as optimized JPEG
        output = BytesIO()
        img.save(output, format="JPEG", quality=quality, optimize=True)
        return output.getvalue()
    except Exception as e:
        print(f"  Warning: Image optimization failed: {e}")
        return image_bytes


def ensure_directories():
    """Ensure all theme directories exist."""
    for theme in THEMES:
        theme_dir = FRONTEND_PUBLIC / theme
        theme_dir.mkdir(parents=True, exist_ok=True)
    print(f"Ensured directories exist in {FRONTEND_PUBLIC}")


async def process_example(example: dict) -> Optional[dict]:
    """Process a single example: download and optimize images."""
    example_id = example.get("id")
    theme = example.get("theme", "main")

    if theme not in THEMES:
        theme = "main"

    theme_dir = FRONTEND_PUBLIC / theme

    # Download and optimize before image
    before_url = example.get("before_image_url")
    before_path = None
    if before_url:
        print(f"  Downloading before image for {example_id[:8]}...")
        before_data = await download_image(before_url)
        if before_data:
            before_data = optimize_image(before_data)
            before_filename = f"{example_id}_before.jpg"
            before_path = theme_dir / before_filename
            before_path.write_bytes(before_data)
            print(f"    Saved: {before_filename} ({len(before_data) // 1024}KB)")

    # Download and optimize after image
    after_url = example.get("after_image_url")
    after_path = None
    if after_url:
        print(f"  Downloading after image for {example_id[:8]}...")
        after_data = await download_image(after_url)
        if after_data:
            after_data = optimize_image(after_data)
            after_filename = f"{example_id}_after.jpg"
            after_path = theme_dir / after_filename
            after_path.write_bytes(after_data)
            print(f"    Saved: {after_filename} ({len(after_data) // 1024}KB)")

    # Return processed example data
    return {
        "id": example_id,
        "title": example.get("title", ""),
        "description": example.get("description", ""),
        "theme": theme,
        "before": f"/examples/{theme}/{example_id}_before.jpg" if before_path else None,
        "after": f"/examples/{theme}/{example_id}_after.jpg" if after_path else None,
        "display_order": example.get("display_order", 0)
    }


def generate_json_files(examples: list):
    """Generate JSON files for each theme and all combined."""
    # Group by theme
    by_theme = {theme: [] for theme in THEMES}
    for ex in examples:
        theme = ex.get("theme", "main")
        if theme in by_theme:
            by_theme[theme].append(ex)

    # Sort by display_order
    for theme in THEMES:
        by_theme[theme].sort(key=lambda x: x.get("display_order", 0))

    # Write theme-specific files
    for theme, items in by_theme.items():
        json_path = FRONTEND_PUBLIC / f"{theme}.json"
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(items, f, ensure_ascii=False, indent=2)
        print(f"  Generated {theme}.json with {len(items)} examples")

    # Write combined file
    all_examples = sorted(examples, key=lambda x: (x.get("theme", "main"), x.get("display_order", 0)))
    all_path = FRONTEND_PUBLIC / "all.json"
    with open(all_path, "w", encoding="utf-8") as f:
        json.dump(all_examples, f, ensure_ascii=False, indent=2)
    print(f"  Generated all.json with {len(all_examples)} examples")


async def trigger_deploy():
    """Trigger Vercel deploy via deploy hook."""
    print("\nTriggering Vercel deploy...")
    deploy_hook = "https://api.vercel.com/v1/integrations/deploy/prj_8msyhjERk6BWBdBSdKJDDxHjNJrq/DXSjiKoltz"

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(deploy_hook)
        if response.status_code == 200 or response.status_code == 201:
            print("  Deploy triggered successfully!")
            return True
        else:
            print(f"  Warning: Deploy trigger returned {response.status_code}")
            return False


async def main(deploy: bool = False):
    """Main sync function."""
    print("=" * 60)
    print("Examples Sync - Static File Generator")
    print("=" * 60)

    # Ensure directories exist
    ensure_directories()

    # Try API first, fallback to Supabase
    examples = await fetch_examples_from_api()
    if not examples:
        examples = await fetch_examples_from_supabase()

    if not examples:
        print("\nNo examples found!")
        return

    # Filter only active examples
    active_examples = [ex for ex in examples if ex.get("is_active", True)]
    print(f"\nProcessing {len(active_examples)} active examples...")

    # Process each example
    processed = []
    for ex in active_examples:
        result = await process_example(ex)
        if result and (result.get("before") or result.get("after")):
            processed.append(result)

    print(f"\nSuccessfully processed {len(processed)} examples")

    # Generate JSON files
    print("\nGenerating JSON files...")
    generate_json_files(processed)

    # Optional deploy
    if deploy:
        await trigger_deploy()

    print("\n" + "=" * 60)
    print("Sync complete!")
    print("=" * 60)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sync examples from database to static files")
    parser.add_argument("--deploy", action="store_true", help="Trigger Vercel deploy after sync")
    args = parser.parse_args()

    asyncio.run(main(deploy=args.deploy))
