#!/usr/bin/env python3
"""
Migration script: Upload all existing generation images from FAL.ai to Supabase Storage.
Updates database records with new Supabase URLs.

Usage:
    python scripts/migrate_images_to_supabase.py [--dry-run]
"""

import asyncio
import os
import sys
import httpx
from dotenv import load_dotenv

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://vofigcbihwkmocrsfowt.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
BUCKET_NAME = "generations"


async def get_all_generations():
    """Fetch all generations from database"""
    url = f"{SUPABASE_URL}/rest/v1/pendant_generations?select=*&order=created_at.desc"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        return response.json()


async def upload_image_to_supabase(source_url: str, dest_path: str) -> str:
    """Download image from URL and upload to Supabase Storage"""
    async with httpx.AsyncClient(timeout=60) as client:
        # Download image
        response = await client.get(source_url)
        response.raise_for_status()

        # Determine content type
        content_type = response.headers.get("content-type", "image/png")

        # Upload to Supabase Storage
        upload_url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{dest_path}"
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": content_type,
        }

        upload_response = await client.post(upload_url, headers=headers, content=response.content)
        upload_response.raise_for_status()

        # Return public URL
        return f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{dest_path}"


async def update_generation_urls(gen_id: str, new_urls: list):
    """Update generation record with new Supabase URLs"""
    url = f"{SUPABASE_URL}/rest/v1/pendant_generations?id=eq.{gen_id}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }

    async with httpx.AsyncClient() as client:
        response = await client.patch(url, headers=headers, json={"output_images": new_urls})
        response.raise_for_status()
        return response.json()


def is_fal_url(url: str) -> bool:
    """Check if URL is from FAL.ai (needs migration)"""
    fal_domains = ["fal.media", "fal.ai", "fal-cdn", "v3.fal.media"]
    return any(domain in url for domain in fal_domains)


def is_supabase_url(url: str) -> bool:
    """Check if URL is already from Supabase"""
    return "supabase" in url or "vofigcbihwkmocrsfowt" in url


async def migrate_generation(gen: dict, dry_run: bool = False) -> dict:
    """Migrate a single generation's images to Supabase"""
    gen_id = gen["id"]
    output_images = gen.get("output_images", [])

    if not output_images:
        return {"id": gen_id, "status": "skipped", "reason": "no images"}

    # Check if already migrated
    if all(is_supabase_url(url) for url in output_images):
        return {"id": gen_id, "status": "skipped", "reason": "already migrated"}

    # Check if has FAL URLs
    fal_urls = [url for url in output_images if is_fal_url(url)]
    if not fal_urls:
        return {"id": gen_id, "status": "skipped", "reason": "no FAL URLs"}

    if dry_run:
        return {"id": gen_id, "status": "would_migrate", "count": len(fal_urls)}

    # Migrate each image
    new_urls = []
    errors = []

    for i, url in enumerate(output_images):
        if is_fal_url(url):
            try:
                dest_path = f"{gen_id}/{i}.png"
                new_url = await upload_image_to_supabase(url, dest_path)
                new_urls.append(new_url)
                print(f"  ✓ Uploaded image {i+1}/{len(output_images)}")
            except Exception as e:
                errors.append(f"Image {i}: {str(e)}")
                new_urls.append(url)  # Keep original on error
                print(f"  ✗ Failed image {i+1}: {e}")
        else:
            new_urls.append(url)  # Keep non-FAL URLs as-is

    # Update database
    if new_urls != output_images:
        try:
            await update_generation_urls(gen_id, new_urls)
            print(f"  ✓ Database updated")
        except Exception as e:
            errors.append(f"DB update: {str(e)}")
            print(f"  ✗ DB update failed: {e}")

    return {
        "id": gen_id,
        "status": "migrated" if not errors else "partial",
        "migrated": len([u for u in new_urls if is_supabase_url(u)]),
        "errors": errors if errors else None
    }


async def main():
    dry_run = "--dry-run" in sys.argv

    if not SUPABASE_KEY:
        print("Error: SUPABASE_SERVICE_KEY not set")
        sys.exit(1)

    print(f"{'[DRY RUN] ' if dry_run else ''}Starting migration to Supabase Storage")
    print(f"Bucket: {BUCKET_NAME}")
    print()

    # Get all generations
    print("Fetching generations from database...")
    generations = await get_all_generations()
    print(f"Found {len(generations)} generations")
    print()

    # Analyze what needs migration
    needs_migration = []
    already_migrated = 0
    no_images = 0

    for gen in generations:
        output_images = gen.get("output_images", [])
        if not output_images:
            no_images += 1
        elif all(is_supabase_url(url) for url in output_images):
            already_migrated += 1
        elif any(is_fal_url(url) for url in output_images):
            needs_migration.append(gen)

    print(f"Summary:")
    print(f"  - Already migrated: {already_migrated}")
    print(f"  - No images: {no_images}")
    print(f"  - Needs migration: {len(needs_migration)}")
    print()

    if not needs_migration:
        print("Nothing to migrate!")
        return

    if dry_run:
        print("Dry run - no changes will be made")
        print()

    # Migrate each generation
    results = {"migrated": 0, "partial": 0, "failed": 0, "skipped": 0}

    for i, gen in enumerate(needs_migration):
        print(f"[{i+1}/{len(needs_migration)}] Migrating generation {gen['id'][:8]}...")
        result = await migrate_generation(gen, dry_run)

        if result["status"] == "migrated":
            results["migrated"] += 1
        elif result["status"] == "partial":
            results["partial"] += 1
        elif result["status"] == "would_migrate":
            results["migrated"] += 1
        else:
            results["skipped"] += 1

    print()
    print("=" * 50)
    print("Migration complete!")
    print(f"  Migrated: {results['migrated']}")
    print(f"  Partial: {results['partial']}")
    print(f"  Skipped: {results['skipped']}")


if __name__ == "__main__":
    asyncio.run(main())
