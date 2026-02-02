#!/usr/bin/env python3
"""
Script to upload gem images from URLs to the gem library.
Downloads images, removes background via API, and creates gem entries.

Usage:
    python upload_gems_from_url.py

Set EMERALD_URL, RUBY_URL, SAPPHIRE_URL environment variables
or edit the URLs in this file.
"""

import os
import sys
import base64
import asyncio

try:
    import httpx
except ImportError:
    print("Installing httpx...")
    os.system(f"{sys.executable} -m pip install httpx")
    import httpx


# API URL
API_URL = os.environ.get("API_URL", "https://olai-api.onrender.com/api")

# Gem definitions with image URLs
# Replace these with actual URLs or set environment variables
GEMS = [
    {
        "name": "Изумруд",
        "name_en": "emerald",
        "color": "#50C878",
        "shape": "round",
        "size_mm": 2.0,
        "sort_order": 1,
        "image_url": os.environ.get("EMERALD_URL", ""),
    },
    {
        "name": "Рубин",
        "name_en": "ruby",
        "color": "#E31B23",
        "shape": "round",
        "size_mm": 2.0,
        "sort_order": 2,
        "image_url": os.environ.get("RUBY_URL", ""),
    },
    {
        "name": "Сапфир",
        "name_en": "sapphire",
        "color": "#0F52BA",
        "shape": "round",
        "size_mm": 2.0,
        "sort_order": 3,
        "image_url": os.environ.get("SAPPHIRE_URL", ""),
    },
]


async def download_image(client: httpx.AsyncClient, url: str) -> bytes:
    """Download image from URL."""
    response = await client.get(url, follow_redirects=True, timeout=30.0)
    response.raise_for_status()
    return response.content


async def upload_gem(client: httpx.AsyncClient, gem: dict) -> dict:
    """Upload gem to API."""
    print(f"  Downloading image from: {gem['image_url'][:50]}...")
    image_bytes = await download_image(client, gem["image_url"])

    # Encode to base64
    image_base64 = f"data:image/png;base64,{base64.b64encode(image_bytes).decode()}"

    payload = {
        "name": gem["name"],
        "name_en": gem["name_en"],
        "color": gem["color"],
        "shape": gem["shape"],
        "size_mm": gem["size_mm"],
        "sort_order": gem["sort_order"],
        "image_base64": image_base64,
        "remove_background": True,
        "bg_tolerance": 30,
        "is_active": True,
    }

    print(f"  Uploading to API (with background removal)...")
    response = await client.post(
        f"{API_URL}/admin/gems",
        json=payload,
        timeout=120.0
    )

    if response.status_code == 200:
        return response.json().get("gem", {})
    else:
        print(f"  Error: {response.status_code}")
        print(f"  Response: {response.text[:500]}")
        return {}


async def main():
    print(f"API URL: {API_URL}")
    print()

    # Check for missing URLs
    missing = [g["name"] for g in GEMS if not g["image_url"]]
    if missing:
        print("Missing image URLs for:", ", ".join(missing))
        print()
        print("Set environment variables:")
        print("  EMERALD_URL=<url>")
        print("  RUBY_URL=<url>")
        print("  SAPPHIRE_URL=<url>")
        print()
        print("Or edit this script to add URLs directly.")
        return

    async with httpx.AsyncClient() as client:
        for gem in GEMS:
            print(f"Processing {gem['name']}...")
            try:
                result = await upload_gem(client, gem)
                if result:
                    print(f"  Success! ID: {result.get('id')}")
                    print(f"  Image URL: {result.get('image_url')}")
                else:
                    print(f"  Failed!")
            except Exception as e:
                print(f"  Error: {e}")
            print()

    print("Done!")


if __name__ == "__main__":
    asyncio.run(main())
