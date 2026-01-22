#!/usr/bin/env python3
"""
Скрипт для загрузки примеров с Unsplash на S3 и добавления в базу данных
"""
import os
import sys
import httpx
import boto3
import uuid
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv('/Users/leo/orlovable/secrets/.env')

# S3 настройки
S3_BUCKET_NAME = os.getenv('S3_BUCKET_NAME')
S3_REGION = os.getenv('S3_REGION', 'ru-1')
S3_ACCESS_KEY = os.getenv('S3_ACCESS_KEY')
S3_SECRET_KEY = os.getenv('S3_SECRET_KEY')
S3_ENDPOINT_URL = os.getenv('S3_ENDPOINT_URL')
S3_PUBLIC_URL = os.getenv('S3_PUBLIC_URL')

# API URL
API_URL = "https://olai.onrender.com/api"

# Примеры с лендингов
EXAMPLES = [
    # Main landing examples
    {
        "title": "Абстрактный рисунок",
        "description": "Абстрактный рисунок → Серебряный кулон",
        "before_url": "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=400&fit=crop",
        "after_url": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop",
        "theme": "main"
    },
    {
        "title": "Художественный эскиз",
        "description": "Художественный эскиз → Золотой кулон",
        "before_url": "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=400&fit=crop",
        "after_url": "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=400&h=400&fit=crop",
        "theme": "main"
    },
    {
        "title": "Любимый символ",
        "description": "Любимый символ → Уникальное украшение",
        "before_url": "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&h=400&fit=crop",
        "after_url": "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop",
        "theme": "main"
    },

    # Kids landing examples
    {
        "title": "Солнышко для бабушки",
        "description": "Рисунок солнышка → Кулон для бабушки",
        "before_url": "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=400&fit=crop",
        "after_url": "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=400&fit=crop",
        "theme": "kids"
    },
    {
        "title": "Семейный портрет",
        "description": "Семейный портрет → Памятный кулон",
        "before_url": "https://images.unsplash.com/photo-1551966775-a4ddc8df052b?w=400&h=400&fit=crop",
        "after_url": "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=400&h=400&fit=crop",
        "theme": "kids"
    },
    {
        "title": "Любимый персонаж",
        "description": "Любимый персонаж → Украшение на память",
        "before_url": "https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=400&h=400&fit=crop",
        "after_url": "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop",
        "theme": "kids"
    },

    # Totems landing examples
    {
        "title": "Волк-хранитель",
        "description": "Волк-хранитель → Серебряный тотем",
        "before_url": "https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=400&h=400&fit=crop",
        "after_url": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop",
        "theme": "totems"
    },
    {
        "title": "Руна Одал",
        "description": "Руна Одал → Кулон защиты",
        "before_url": "https://images.unsplash.com/photo-1550853024-fae8cd4be47f?w=400&h=400&fit=crop",
        "after_url": "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=400&h=400&fit=crop",
        "theme": "totems"
    },
    {
        "title": "Ворон мудрости",
        "description": "Ворон мудрости → Артефакт силы",
        "before_url": "https://images.unsplash.com/photo-1557401620-67270b4bb838?w=400&h=400&fit=crop",
        "after_url": "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop",
        "theme": "totems"
    },
]


def get_s3_client():
    """Получить S3 клиент"""
    session = boto3.Session(
        aws_access_key_id=S3_ACCESS_KEY,
        aws_secret_access_key=S3_SECRET_KEY,
    )
    return session.client('s3', region_name=S3_REGION, endpoint_url=S3_ENDPOINT_URL)


def download_image(url: str) -> bytes:
    """Скачать изображение по URL"""
    response = httpx.get(url, follow_redirects=True, timeout=30)
    response.raise_for_status()
    return response.content


def upload_to_s3(image_data: bytes, folder: str, file_ext: str = "jpg") -> str:
    """Загрузить изображение в S3 и вернуть публичный URL"""
    s3_client = get_s3_client()
    file_name = f"{folder}/{uuid.uuid4()}.{file_ext}"

    content_type = "image/jpeg" if file_ext == "jpg" else "image/png"

    s3_client.put_object(
        Bucket=S3_BUCKET_NAME,
        Key=file_name,
        Body=image_data,
        ContentType=content_type,
        ACL='public-read'
    )

    # Формируем публичный URL
    public_url = f"{S3_PUBLIC_URL}/{S3_BUCKET_NAME}/{file_name}"
    return public_url


def create_example(example_data: dict) -> dict:
    """Создать пример через API"""
    response = httpx.post(
        f"{API_URL}/examples",
        json=example_data,
        timeout=30
    )
    response.raise_for_status()
    return response.json()


def main():
    print(f"S3 Bucket: {S3_BUCKET_NAME}")
    print(f"S3 Endpoint: {S3_ENDPOINT_URL}")
    print(f"API URL: {API_URL}")
    print(f"Total examples to upload: {len(EXAMPLES)}")
    print("-" * 50)

    for i, example in enumerate(EXAMPLES, 1):
        print(f"\n[{i}/{len(EXAMPLES)}] Processing: {example['title']}")

        try:
            # Скачиваем before изображение
            print(f"  Downloading before image...")
            before_data = download_image(example['before_url'])

            # Скачиваем after изображение
            print(f"  Downloading after image...")
            after_data = download_image(example['after_url'])

            # Загружаем на S3
            print(f"  Uploading to S3...")
            before_s3_url = upload_to_s3(before_data, f"examples/{example['theme']}")
            after_s3_url = upload_to_s3(after_data, f"examples/{example['theme']}")

            print(f"  Before URL: {before_s3_url}")
            print(f"  After URL: {after_s3_url}")

            # Создаем пример в БД
            print(f"  Creating example in DB...")
            result = create_example({
                "title": example['title'],
                "description": example['description'],
                "before_image_url": before_s3_url,
                "after_image_url": after_s3_url,
                "theme": example['theme'],
                "is_active": True
            })

            print(f"  ✅ Created example: {result.get('id')}")

        except Exception as e:
            print(f"  ❌ Error: {e}")
            continue

    print("\n" + "=" * 50)
    print("Done!")


if __name__ == "__main__":
    main()
