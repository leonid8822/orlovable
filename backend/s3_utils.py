"""
Утилиты для работы с AWS S3
"""
import os
import boto3
from botocore.exceptions import ClientError
import uuid
from typing import Optional
import base64
from io import BytesIO
from PIL import Image

# S3 настройки из переменных окружения
S3_BUCKET_NAME = os.getenv('S3_BUCKET_NAME')
S3_REGION = os.getenv('S3_REGION', 'us-east-1')
S3_ACCESS_KEY = os.getenv('S3_ACCESS_KEY')
S3_SECRET_KEY = os.getenv('S3_SECRET_KEY')
S3_ENDPOINT_URL = os.getenv('S3_ENDPOINT_URL')  # Для S3-совместимых сервисов
S3_PUBLIC_URL = os.getenv('S3_PUBLIC_URL')  # Публичный URL бакета

def get_s3_client():
    """Получить S3 клиент"""
    if not S3_BUCKET_NAME:
        raise ValueError("S3_BUCKET_NAME не установлен в переменных окружения")
    
    if not S3_ACCESS_KEY or not S3_SECRET_KEY:
        raise ValueError("S3_ACCESS_KEY и S3_SECRET_KEY должны быть установлены")
    
    session = boto3.Session(
        aws_access_key_id=S3_ACCESS_KEY,
        aws_secret_access_key=S3_SECRET_KEY,
    )
    
    s3_config = {
        'region_name': S3_REGION,
    }
    
    if S3_ENDPOINT_URL:
        s3_config['endpoint_url'] = S3_ENDPOINT_URL
    
    return session.client('s3', **s3_config)


def upload_image_to_s3(
    image_data: bytes,
    folder: str = 'images',
    file_extension: str = 'png',
    content_type: str = 'image/png'
) -> Optional[str]:
    """
    Загрузить изображение в S3
    
    Args:
        image_data: Байты изображения
        folder: Папка в S3 (например, 'images', 'stones', '3d_models')
        file_extension: Расширение файла (png, jpg, etc)
        content_type: MIME тип контента
    
    Returns:
        Публичный URL загруженного изображения или None в случае ошибки
    """
    if not S3_BUCKET_NAME:
        print("⚠️  S3_BUCKET_NAME не установлен, пропускаем загрузку")
        return None
    
    try:
        s3_client = get_s3_client()
        
        # Генерируем уникальное имя файла
        file_name = f"{folder}/{uuid.uuid4()}.{file_extension}"
        
        # Загружаем в S3
        s3_client.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=file_name,
            Body=image_data,
            ContentType=content_type,
            ACL='public-read'  # Делаем файл публичным
        )
        
        # Формируем публичный URL
        if S3_PUBLIC_URL:
            # Если указан кастомный публичный URL
            public_url = f"{S3_PUBLIC_URL}/{file_name}"
        elif S3_ENDPOINT_URL:
            # Если используется S3-совместимый сервис
            public_url = f"{S3_ENDPOINT_URL}/{S3_BUCKET_NAME}/{file_name}"
        else:
            # Стандартный AWS S3 URL
            public_url = f"https://{S3_BUCKET_NAME}.s3.{S3_REGION}.amazonaws.com/{file_name}"
        
        print(f"✅ Изображение загружено: {public_url}")
        return public_url
        
    except Exception as e:
        print(f"❌ Ошибка при загрузке в S3: {e}")
        import traceback
        traceback.print_exc()
        return None


def upload_base64_to_s3(
    base64_string: str,
    folder: str = 'images',
    content_type: str = 'image/png'
) -> Optional[str]:
    """
    Загрузить base64 изображение в S3
    
    Args:
        base64_string: Base64 строка изображения (с префиксом data:image/png;base64, или без)
        folder: Папка в S3
        content_type: MIME тип контента
    
    Returns:
        Публичный URL загруженного изображения или None
    """
    try:
        # Убираем префикс data:image/...;base64, если есть
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Декодируем base64
        image_data = base64.b64decode(base64_string)
        
        # Определяем расширение из content_type
        extension_map = {
            'image/png': 'png',
            'image/jpeg': 'jpg',
            'image/jpg': 'jpg',
            'image/webp': 'webp',
        }
        file_extension = extension_map.get(content_type, 'png')
        
        return upload_image_to_s3(image_data, folder, file_extension, content_type)
        
    except Exception as e:
        print(f"❌ Ошибка при загрузке base64 в S3: {e}")
        import traceback
        traceback.print_exc()
        return None


def upload_canvas_image_to_s3(
    canvas_data_url: str,
    folder: str = 'images'
) -> Optional[str]:
    """
    Загрузить изображение из canvas data URL в S3
    
    Args:
        canvas_data_url: Data URL из canvas (например, canvas.toDataURL('image/png'))
        folder: Папка в S3
    
    Returns:
        Публичный URL загруженного изображения или None
    """
    try:
        # Парсим data URL
        if not canvas_data_url.startswith('data:'):
            raise ValueError("Неверный формат data URL")
        
        # Извлекаем content type и данные
        header, data = canvas_data_url.split(',', 1)
        content_type = header.split(';')[0].split(':')[1]
        
        return upload_base64_to_s3(data, folder, content_type)
        
    except Exception as e:
        print(f"❌ Ошибка при загрузке canvas изображения в S3: {e}")
        import traceback
        traceback.print_exc()
        return None

