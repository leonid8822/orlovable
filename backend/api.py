from fastapi import APIRouter, HTTPException
from typing import Optional
from pydantic import BaseModel
from supabase_client import supabase
import os
import httpx
import asyncio
import time
import uuid

router = APIRouter()


class GenerateRequest(BaseModel):
    imageBase64: Optional[str] = None
    prompt: Optional[str] = None
    formFactor: str = 'round'
    size: str = 'pendant'
    material: str = 'silver'
    sessionId: Optional[str] = None
    applicationId: Optional[str] = None
    theme: str = 'main'  # main, kids, totems


class ApplicationCreate(BaseModel):
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    form_factor: str = 'round'
    material: str = 'silver'
    size: str = 'pendant'
    input_image_url: Optional[str] = None
    user_comment: Optional[str] = None
    theme: str = 'main'  # main, kids, totems


class ApplicationUpdate(BaseModel):
    status: Optional[str] = None
    generated_preview: Optional[str] = None
    input_image_url: Optional[str] = None
    user_comment: Optional[str] = None
    form_factor: Optional[str] = None
    size: Optional[str] = None
    theme: Optional[str] = None


class SettingsUpdate(BaseModel):
    num_images: Optional[int] = None
    main_prompt: Optional[str] = None
    main_prompt_no_image: Optional[str] = None
    form_factors: Optional[dict] = None
    sizes: Optional[dict] = None


@router.get("/settings")
async def get_settings():
    """Get generation settings from Supabase"""
    defaults = {
        "num_images": 4,
        "main_prompt": "",
        "main_prompt_no_image": "",
        "form_factors": {
            "round": {
                "label": "Женская (круглый)",
                "addition": "Объект вписан в круглую рамку-медальон, изящный женственный дизайн.",
                "shape": "круглая форма, объект вписан в круг"
            },
            "oval": {
                "label": "Мужская (жетон)",
                "addition": "Вертикальный жетон, строгий мужской дизайн, слегка вытянутая овальная форма.",
                "shape": "вертикальный овал (жетон), вытянутая форма"
            },
            "contour": {
                "label": "Контурный (универсальный)",
                "addition": "Форма повторяет контур изображения, универсальный дизайн.",
                "shape": "по контуру выбранного объекта"
            }
        },
        "sizes": {
            "bracelet": {"label": "S", "dimensions": "13мм"},
            "pendant": {"label": "M", "dimensions": "19мм"},
            "interior": {"label": "L", "dimensions": "25мм"}
        }
    }

    try:
        settings_list = await supabase.select("generation_settings")

        if not settings_list:
            return defaults

        result = defaults.copy()
        for item in settings_list:
            key = item.get("key")
            value = item.get("value")

            if key == 'num_images':
                try:
                    result['num_images'] = int(value)
                except:
                    pass
            elif key == 'form_factors' and isinstance(value, dict):
                result['form_factors'] = value
            elif key == 'sizes' and isinstance(value, dict):
                result['sizes'] = value
            elif key in ['main_prompt', 'main_prompt_no_image']:
                result[key] = str(value) if value else ""

        return result
    except Exception as e:
        print(f"Error fetching settings: {e}")
        return defaults


@router.post("/settings")
async def update_settings(updates: SettingsUpdate):
    """Update generation settings in Supabase"""
    try:
        settings_list = await supabase.select("generation_settings")
        existing_keys = {item["key"]: item["id"] for item in settings_list}

        async def set_val(key, val):
            if val is None:
                return
            if key in existing_keys:
                await supabase.update("generation_settings", existing_keys[key], {"value": val})
            else:
                await supabase.insert("generation_settings", {"key": key, "value": val})

        if updates.num_images is not None:
            await set_val('num_images', updates.num_images)
        if updates.main_prompt is not None:
            await set_val('main_prompt', updates.main_prompt)
        if updates.main_prompt_no_image is not None:
            await set_val('main_prompt_no_image', updates.main_prompt_no_image)
        if updates.form_factors:
            await set_val('form_factors', updates.form_factors)
        if updates.sizes:
            await set_val('sizes', updates.sizes)

        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/applications")
async def list_applications(user_id: Optional[str] = None, limit: int = 20):
    """List applications"""
    try:
        filters = {"user_id": user_id} if user_id else None
        apps = await supabase.select(
            "applications",
            filters=filters,
            order="created_at.desc",
            limit=limit
        )
        return apps
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/applications")
async def create_application(app: ApplicationCreate):
    """Create new application"""
    try:
        data = {
            "id": str(uuid.uuid4()),
            "session_id": app.session_id,
            "user_id": app.user_id,
            "form_factor": app.form_factor,
            "material": app.material,
            "size": app.size,
            "input_image_url": app.input_image_url,
            "user_comment": app.user_comment,
            "theme": app.theme,
            "status": "pending_generation",
            "current_step": 1
        }
        result = await supabase.insert("applications", data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/applications/{app_id}")
async def get_application(app_id: str):
    """Get application by ID"""
    try:
        app = await supabase.select_one("applications", app_id)
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")
        return app
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/applications/{app_id}")
async def update_application(app_id: str, updates: ApplicationUpdate):
    """Update application"""
    try:
        update_data = updates.model_dump(exclude_unset=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="No updates provided")

        result = await supabase.update("applications", app_id, update_data)
        if not result:
            raise HTTPException(status_code=404, detail="Application not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_history(limit: int = 20):
    """Get generation history"""
    try:
        generations = await supabase.select(
            "pendant_generations",
            order="created_at.desc",
            limit=limit
        )
        return generations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Cost constants (fal.ai pricing)
COST_PER_IMAGE_CENTS = 3
COST_REMOVE_BG_CENTS = 1  # Background removal cost


async def remove_background(image_url: str, fal_key: str) -> str:
    """Remove background from image using FAL.ai birefnet model"""
    try:
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                "https://queue.fal.run/fal-ai/birefnet",
                json={
                    "image_url": image_url,
                    "model": "General Use (Light)",
                    "operating_resolution": "1024x1024",
                    "output_format": "png"
                },
                headers={
                    "Authorization": f"Key {fal_key}",
                    "Content-Type": "application/json"
                }
            )
            response.raise_for_status()
            result = response.json()

            # Poll for results if queued
            if "request_id" in result and "status_url" in result:
                attempts = 0
                max_attempts = 60

                while attempts < max_attempts:
                    await asyncio.sleep(1)
                    status_res = await client.get(
                        result["status_url"],
                        headers={"Authorization": f"Key {fal_key}"}
                    )
                    status_data = status_res.json()

                    if status_data.get("status") == "COMPLETED":
                        result_res = await client.get(
                            result["response_url"],
                            headers={"Authorization": f"Key {fal_key}"}
                        )
                        final_result = result_res.json()
                        if "image" in final_result:
                            return final_result["image"]["url"]
                        break
                    elif status_data.get("status") == "FAILED":
                        print(f"Background removal failed")
                        return image_url

                    attempts += 1

            elif "image" in result:
                return result["image"]["url"]

            return image_url
    except Exception as e:
        print(f"Error removing background: {e}")
        return image_url  # Return original on error


@router.post("/generate")
async def generate_pendant(req: GenerateRequest):
    """Generate pendant images using FAL.ai"""
    start_time = time.time()

    fal_key = os.environ.get("FAL_KEY")
    if not fal_key:
        raise HTTPException(status_code=500, detail="FAL_KEY is not configured")

    # Get settings
    settings = await get_settings()
    num_images = settings.get("num_images", 4)

    has_image = req.imageBase64 and len(req.imageBase64) > 0
    print(f"Starting pendant generation. Has image: {has_image}, Form: {req.formFactor}")

    # Build prompt
    size_config = settings["sizes"].get(req.size, settings["sizes"]["pendant"])
    size_dimensions = size_config.get("dimensions", "18мм")

    form_config = settings["form_factors"].get(req.formFactor, settings["form_factors"]["round"])
    form_addition = form_config.get("addition", "")
    form_shape_base = form_config.get("shape", "круглая форма, объект вписан в круг")
    form_shape = f"{form_shape_base}, размер {size_dimensions}"

    if has_image:
        pendant_prompt = f"""Создай ювелирный кулон из референса на картинке.
{f'Дополнительные пожелания заказчика: {req.prompt}' if req.prompt else ''}
ВАЖНО: Максимально точно следуй референсу. Сохрани все детали и пропорции оригинального изображения.
Ушко для цепочки — простое, классическое ювелирное.
Строго один вид спереди.
Черный фон, изделие из серебра (silver metal). Без красок, без дополнительных текстур.
Объект должен быть ЦЕЛОСТНЫМ, МОНОЛИТНЫМ, готовым к 3D-печати — никаких отдельных частей, всё соединено.
{form_addition}
Форма — {form_shape}.
Максимальная детализация поверхности, ювелирное качество."""
    else:
        pendant_prompt = f"""Создай ювелирный кулон.
{f'Описание: {req.prompt}' if req.prompt else 'Красивый элегантный ювелирный кулон.'}
Ушко для цепочки — простое, классическое ювелирное.
Строго один вид спереди.
Черный фон, изделие из серебра (silver metal). Без красок, без дополнительных текстур.
Объект должен быть ЦЕЛОСТНЫМ, МОНОЛИТНЫМ, готовым к 3D-печати — никаких отдельных частей, всё соединено.
{form_addition}
Форма — {form_shape}.
Максимальная детализация поверхности, ювелирное качество."""

    print(f"Final prompt: {pendant_prompt}")

    model_url = "https://queue.fal.run/fal-ai/bytedance/seedream/v4/edit" if has_image else "https://queue.fal.run/fal-ai/bytedance/seedream/v4/text-to-image"
    model_name = "seedream-v4-edit" if has_image else "seedream-v4-text-to-image"

    request_body = {
        "prompt": pendant_prompt,
        "num_images": num_images,
        "enable_safety_checker": True,
        "image_size": "square_hd"
    }

    if has_image:
        request_body["image_urls"] = [req.imageBase64]

    headers = {
        "Authorization": f"Key {fal_key}",
        "Content-Type": "application/json"
    }

    try:
        async with httpx.AsyncClient(timeout=300) as client:
            response = await client.post(model_url, json=request_body, headers=headers)
            response.raise_for_status()
            result = response.json()

            image_urls = []

            # Poll for results
            if "request_id" in result and "status_url" in result:
                attempts = 0
                max_attempts = 120

                while attempts < max_attempts:
                    await asyncio.sleep(2)
                    status_res = await client.get(result["status_url"], headers={"Authorization": f"Key {fal_key}"})
                    status_data = status_res.json()

                    print(f"Status: {status_data.get('status')}, attempt: {attempts}")

                    if status_data.get("status") == "COMPLETED":
                        result_res = await client.get(result["response_url"], headers={"Authorization": f"Key {fal_key}"})
                        final_result = result_res.json()
                        if "images" in final_result:
                            image_urls = [img["url"] for img in final_result["images"]]
                        break
                    elif status_data.get("status") == "FAILED":
                        raise Exception("Generation failed")

                    attempts += 1
            elif "images" in result:
                image_urls = [img["url"] for img in result["images"]]

            if not image_urls:
                raise Exception("No images generated")

            # Remove background from all generated images
            print(f"Removing background from {len(image_urls)} images...")
            images_with_transparent_bg = []
            for img_url in image_urls:
                transparent_url = await remove_background(img_url, fal_key)
                images_with_transparent_bg.append(transparent_url)

            image_urls = images_with_transparent_bg
            print(f"Background removal complete")

            execution_time_ms = int((time.time() - start_time) * 1000)
            cost_cents = len(image_urls) * COST_PER_IMAGE_CENTS + len(image_urls) * COST_REMOVE_BG_CENTS

            # Save to Supabase
            gen_data = {
                "id": str(uuid.uuid4()),
                "input_image_url": req.imageBase64[:500] + "..." if has_image and req.imageBase64 else None,
                "user_comment": req.prompt,
                "form_factor": req.formFactor,
                "material": req.material,
                "size": req.size,
                "theme": req.theme,
                "output_images": image_urls,
                "prompt_used": pendant_prompt,
                "cost_cents": cost_cents,
                "model_used": model_name,
                "session_id": req.sessionId,
                "application_id": req.applicationId,
                "execution_time_ms": execution_time_ms
            }
            db_gen = await supabase.insert("pendant_generations", gen_data)

            # Update application if exists
            if req.applicationId:
                await supabase.update("applications", req.applicationId, {
                    "status": "generated",
                    "generated_preview": image_urls[0]
                })

            return {
                "success": True,
                "images": image_urls,
                "prompt": pendant_prompt,
                "generationId": db_gen["id"] if db_gen else None,
                "costCents": cost_cents,
                "executionTimeMs": execution_time_ms
            }

    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
