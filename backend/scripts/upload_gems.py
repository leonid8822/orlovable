#!/usr/bin/env python3
"""
Script to upload gem images to the gem library via API.
Supports background removal and automatic resizing.

Usage:
    python upload_gems.py [--api-url API_URL]

Default API URL: https://olai.onrender.com/api
"""

import os
import sys
import base64
import json
import argparse
import asyncio
from pathlib import Path

try:
    import httpx
except ImportError:
    print("Installing httpx...")
    os.system(f"{sys.executable} -m pip install httpx")
    import httpx


# Gem definitions - name, English name, color, image filename, shape
GEMS_TO_UPLOAD = [
    {
        "name": "Изумруд",
        "name_en": "emerald",
        "color": "#50C878",  # Emerald green
        "shape": "round",
        "size_mm": 2.0,
        "sort_order": 1,
        "image_file": "emerald.png",
    },
    {
        "name": "Рубин",
        "name_en": "ruby",
        "color": "#E31B23",  # Ruby red
        "shape": "round",
        "size_mm": 2.0,
        "sort_order": 2,
        "image_file": "ruby.png",
    },
    {
        "name": "Сапфир",
        "name_en": "sapphire",
        "color": "#0F52BA",  # Sapphire blue
        "shape": "round",
        "size_mm": 2.0,
        "sort_order": 3,
        "image_file": "sapphire.png",
    },
]


async def upload_gem(client: httpx.AsyncClient, api_url: str, gem_data: dict, images_dir: Path):
    """Upload a single gem to the API."""
    image_path = images_dir / gem_data["image_file"]

    if not image_path.exists():
        print(f"  Warning: Image not found: {image_path}")
        return None

    # Read and encode image
    with open(image_path, "rb") as f:
        image_bytes = f.read()
    image_base64 = f"data:image/png;base64,{base64.b64encode(image_bytes).decode()}"

    # Prepare request
    payload = {
        "name": gem_data["name"],
        "name_en": gem_data["name_en"],
        "color": gem_data["color"],
        "shape": gem_data["shape"],
        "size_mm": gem_data["size_mm"],
        "sort_order": gem_data["sort_order"],
        "image_base64": image_base64,
        "remove_background": True,
        "bg_tolerance": 30,
        "is_active": True,
    }

    try:
        response = await client.post(
            f"{api_url}/admin/gems",
            json=payload,
            timeout=120.0  # Background removal can take time
        )

        if response.status_code == 200:
            result = response.json()
            return result.get("gem")
        else:
            print(f"  Error: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"  Exception: {e}")
        return None


async def main():
    parser = argparse.ArgumentParser(description="Upload gem images to OLAI.art")
    parser.add_argument(
        "--api-url",
        default="https://olai.onrender.com/api",
        help="API base URL"
    )
    parser.add_argument(
        "--images-dir",
        default=None,
        help="Directory with gem images (default: ./gem_images)"
    )
    args = parser.parse_args()

    # Find images directory
    if args.images_dir:
        images_dir = Path(args.images_dir)
    else:
        # Try relative paths
        script_dir = Path(__file__).parent
        possible_dirs = [
            script_dir / "gem_images",
            script_dir.parent / "gem_images",
            Path("./gem_images"),
        ]
        images_dir = None
        for d in possible_dirs:
            if d.exists():
                images_dir = d
                break

        if not images_dir:
            images_dir = script_dir / "gem_images"
            images_dir.mkdir(exist_ok=True)
            print(f"Created images directory: {images_dir}")
            print("Please add gem images to this directory:")
            for gem in GEMS_TO_UPLOAD:
                print(f"  - {gem['image_file']}")
            return

    print(f"Using API: {args.api_url}")
    print(f"Images directory: {images_dir}")
    print()

    # Check which images exist
    missing = []
    for gem in GEMS_TO_UPLOAD:
        img_path = images_dir / gem["image_file"]
        if not img_path.exists():
            missing.append(gem["image_file"])

    if missing:
        print("Missing images:")
        for m in missing:
            print(f"  - {m}")
        print()
        print("Please add the missing images and run again.")
        return

    # Upload gems
    async with httpx.AsyncClient() as client:
        print("Uploading gems...")
        for gem in GEMS_TO_UPLOAD:
            print(f"  Uploading {gem['name']} ({gem['name_en']})...")
            result = await upload_gem(client, args.api_url, gem, images_dir)
            if result:
                print(f"    Success! ID: {result.get('id')}")
                print(f"    Image URL: {result.get('image_url')}")
            else:
                print(f"    Failed to upload {gem['name']}")

    print()
    print("Done!")


if __name__ == "__main__":
    asyncio.run(main())
