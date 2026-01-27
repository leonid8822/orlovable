from fastapi import APIRouter, HTTPException, Request
from typing import Optional
from pydantic import BaseModel
from supabase_client import supabase
from email_service import send_verification_email
from tinkoff_payment import (
    init_payment,
    get_payment_state,
    verify_notification_token,
    SUCCESS_STATUSES,
    FINAL_STATUSES,
)
import os
import httpx
import asyncio
import time
import uuid
import random
from datetime import datetime, timedelta

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
    last_error: Optional[str] = None
    telegram_username: Optional[str] = None
    order_comment: Optional[str] = None


class SettingsUpdate(BaseModel):
    num_images: Optional[int] = None
    main_prompt: Optional[str] = None
    main_prompt_no_image: Optional[str] = None
    form_factors: Optional[dict] = None
    sizes: Optional[dict] = None
    materials: Optional[dict] = None
    visualization: Optional[dict] = None


@router.get("/settings")
async def get_settings():
    """Get generation settings from Supabase"""
    defaults = {
        "num_images": 4,
        "main_prompt": "",
        "main_prompt_no_image": "",
        "form_factors": {
            "round": {
                "label": "Круглый кулон",
                "description": "Круглый кулон",
                "icon": "circle",
                "addition": "Объект вписан в круглую рамку-медальон.",
                "shape": "круглая форма, объект вписан в круг"
            },
            "oval": {
                "label": "Жетон",
                "description": "Мужской жетон",
                "icon": "rectangle-vertical",
                "addition": "Объект овальный, в форме вертикального армейского жетона.",
                "shape": "овальная вертикальная форма жетона (dog tag)"
            },
            "contour": {
                "label": "Контурный кулон",
                "description": "По контуру рисунка",
                "icon": "hexagon",
                "addition": "Форма повторяет контур изображения.",
                "shape": "по контуру выбранного объекта"
            }
        },
        "sizes": {
            "silver": {
                "s": {"label": "S", "dimensionsMm": 13, "apiSize": "bracelet", "price": 5000},
                "m": {"label": "M", "dimensionsMm": 19, "apiSize": "pendant", "price": 8000},
                "l": {"label": "L", "dimensionsMm": 25, "apiSize": "interior", "price": 12000}
            },
            "gold": {
                "s": {"label": "S", "dimensionsMm": 10, "apiSize": "bracelet", "price": 15000},
                "m": {"label": "M", "dimensionsMm": 13, "apiSize": "pendant", "price": 22000},
                "l": {"label": "L", "dimensionsMm": 19, "apiSize": "interior", "price": 35000}
            }
        },
        "materials": {
            "silver": {"label": "Серебро 925", "enabled": True},
            "gold": {"label": "Золото 585", "enabled": False}
        },
        "visualization": {
            "imageWidthMm": 250,
            "female": {"attachX": 0.5, "attachY": 0.5},
            "male": {"attachX": 0.5, "attachY": 0.75}
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
            elif key == 'materials' and isinstance(value, dict):
                result['materials'] = value
            elif key == 'visualization' and isinstance(value, dict):
                result['visualization'] = value
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
        if updates.materials:
            await set_val('materials', updates.materials)
        if updates.visualization:
            await set_val('visualization', updates.visualization)

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
    """Get application by ID with its generations"""
    try:
        app = await supabase.select_one("applications", app_id)
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")

        # Get all generations for this application
        generations = await supabase.select(
            "pendant_generations",
            filters={"application_id": app_id},
            order="created_at.desc",
            limit=10
        )

        # Get the latest generation's images
        all_images = []
        if generations:
            latest_gen = generations[0]
            if latest_gen.get("output_images"):
                all_images = latest_gen["output_images"]

        # Add generated_images to response
        app["generated_images"] = all_images

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
    # sizes structure: sizes[material][size_key] -> {label, price, apiSize, dimensionsMm}
    material_sizes = settings["sizes"].get(req.material, settings["sizes"].get("silver", {}))
    size_config = material_sizes.get(req.size, material_sizes.get("m", {}))
    size_dimensions = f"{size_config.get('dimensionsMm', 18)}мм"

    form_config = settings["form_factors"].get(req.formFactor, settings["form_factors"]["round"])
    form_addition = form_config.get("addition", "")
    form_shape_base = form_config.get("shape", "круглая форма, объект вписан в круг")
    form_shape = f"{form_shape_base}, размер {size_dimensions}"

    # Get form factor label for prompt
    form_label = form_config.get("label", "круглый кулон")

    if has_image:
        pendant_prompt = f"""Создай ювелирный кулон из референса на картинке.
Тип украшения: {form_label}.
{f'Дополнительные пожелания заказчика: {req.prompt}' if req.prompt else ''}
ВАЖНО: Максимально точно следуй референсу. Сохрани все детали и пропорции оригинального изображения.
Кулон должен быть ЦЕЛЬНЫМ, МОНОЛИТНЫМ, состоящим из ОДНОЙ ЧАСТИ — единый серебряный объект без отдельных элементов.
ВАЖНО: Поверхность кулона должна быть СПЛОШНОЙ, БЕЗ ДЫРОК И ПРОРЕЗЕЙ. Черный фон только СНАРУЖИ кулона, вокруг него. Внутри кулона не должно быть никаких черных областей или дырок — вся поверхность сплошная серебряная.
Ушко для цепочки — простое, классическое ювелирное, интегрированное в основной объект.
Строго один вид спереди.
Черный фон ТОЛЬКО ВОКРУГ кулона (снаружи). Изделие из серебра (silver metal). Без красок, без эмали, без дополнительных текстур.
Готов к 3D-печати — никаких отдельных частей, всё соединено в единую форму.
{form_addition}
Форма — {form_shape}.
Максимальная детализация поверхности, ювелирное качество."""
    else:
        pendant_prompt = f"""Создай ювелирный кулон.
Тип украшения: {form_label}.
{f'Описание: {req.prompt}' if req.prompt else 'Красивый элегантный ювелирный кулон.'}
Кулон должен быть ЦЕЛЬНЫМ, МОНОЛИТНЫМ, состоящим из ОДНОЙ ЧАСТИ — единый серебряный объект без отдельных элементов.
ВАЖНО: Поверхность кулона должна быть СПЛОШНОЙ, БЕЗ ДЫРОК И ПРОРЕЗЕЙ. Черный фон только СНАРУЖИ кулона, вокруг него. Внутри кулона не должно быть никаких черных областей или дырок.
Ушко для цепочки — простое, классическое ювелирное, интегрированное в основной объект.
Строго один вид спереди.
Черный фон ТОЛЬКО ВОКРУГ кулона (снаружи). Изделие из серебра (silver metal). Без красок, без эмали, без дополнительных текстур.
Готов к 3D-печати — никаких отдельных частей, всё соединено в единую форму.
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
        error_msg = str(e)
        print(f"Error: {error_msg}")

        # Save error to application if exists
        if req.applicationId:
            import traceback
            full_error = f"{error_msg}\n\nTraceback:\n{traceback.format_exc()}"
            try:
                await supabase.update("applications", req.applicationId, {
                    "status": "error",
                    "last_error": full_error[:4000]  # Limit to 4000 chars
                })
            except:
                pass  # Don't fail if error logging fails

        raise HTTPException(status_code=500, detail=error_msg)


# ============== EXAMPLES API ==============

class ExampleCreate(BaseModel):
    title: str = "Новый пример"
    description: Optional[str] = None
    before_image_url: Optional[str] = None
    after_image_url: Optional[str] = None
    model_3d_url: Optional[str] = None
    theme: str = 'main'  # main, kids, totems
    is_active: bool = False


class ExampleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    before_image_url: Optional[str] = None
    after_image_url: Optional[str] = None
    model_3d_url: Optional[str] = None
    display_order: Optional[int] = None
    theme: Optional[str] = None
    is_active: Optional[bool] = None


class ImportFromApplicationRequest(BaseModel):
    application_id: str
    title: Optional[str] = None
    description: Optional[str] = None
    theme: str = 'main'


@router.get("/examples")
async def list_examples(theme: Optional[str] = None, active_only: bool = False):
    """List examples, optionally filtered by theme"""
    try:
        examples = await supabase.select(
            "examples",
            order="display_order.asc"
        )

        # Filter by theme if specified
        if theme:
            examples = [e for e in examples if e.get('theme', 'main') == theme]

        # Filter active only if requested
        if active_only:
            examples = [e for e in examples if e.get('is_active', True)]

        return examples
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/examples")
async def create_example(example: ExampleCreate):
    """Create a new example"""
    try:
        # Get max display_order
        all_examples = await supabase.select("examples")
        max_order = max([e.get('display_order', 0) for e in all_examples], default=0)

        data = {
            "id": str(uuid.uuid4()),
            "title": example.title,
            "description": example.description,
            "before_image_url": example.before_image_url,
            "after_image_url": example.after_image_url,
            "model_3d_url": example.model_3d_url,
            "theme": example.theme,
            "display_order": max_order + 1,
            "is_active": example.is_active
        }
        result = await supabase.insert("examples", data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/examples/{example_id}")
async def update_example(example_id: str, updates: ExampleUpdate):
    """Update an example"""
    try:
        update_data = updates.model_dump(exclude_unset=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="No updates provided")

        result = await supabase.update("examples", example_id, update_data)
        if not result:
            raise HTTPException(status_code=404, detail="Example not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/examples/{example_id}")
async def delete_example(example_id: str):
    """Delete an example"""
    try:
        await supabase.delete("examples", example_id)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============== AUTH API ==============

# Test email for development - auto-verifies with code 123456
TEST_EMAIL = "test@olai.art"
TEST_CODE = "123456"


class RequestCodeRequest(BaseModel):
    email: str
    name: Optional[str] = None  # Now optional
    application_id: Optional[str] = None
    subscribe_newsletter: bool = False  # Newsletter subscription


class VerifyCodeRequest(BaseModel):
    email: str
    code: str
    application_id: Optional[str] = None


class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    telegram_username: Optional[str] = None
    subscribe_newsletter: Optional[bool] = None


def generate_verification_code() -> str:
    """Generate a 6-digit verification code"""
    return str(random.randint(100000, 999999))


@router.post("/auth/request-code")
async def request_verification_code(req: RequestCodeRequest):
    """Create or update user and send verification code"""
    try:
        email = req.email.lower().strip()
        name = req.name.strip() if req.name else None

        # Check if user exists
        existing_user = await supabase.select_by_field("users", "email", email)

        # For test email, use fixed code; otherwise generate random
        is_test_email = email == TEST_EMAIL
        code = TEST_CODE if is_test_email else generate_verification_code()
        expires_at = (datetime.utcnow() + timedelta(minutes=10)).isoformat()

        user_data = {
            "verification_code": code,
            "verification_code_expires_at": expires_at,
        }

        # Only update name if provided
        if name:
            user_data["name"] = name

        # Note: subscribe_newsletter, first_name, last_name, telegram_username
        # require database migration. For now, we store them only if columns exist.
        # TODO: Add these columns to the users table in Supabase

        if existing_user:
            # Update existing user with new code
            user_id = existing_user["id"]
            await supabase.update("users", user_id, user_data)
        else:
            # Create new user
            user_id = str(uuid.uuid4())
            await supabase.insert("users", {
                "id": user_id,
                "email": email,
                "name": name or "",
                "email_verified": False,
                **user_data
            })

        # Link application to user (preliminary, not verified yet)
        if req.application_id:
            try:
                await supabase.update("applications", req.application_id, {
                    "user_id": user_id
                })
            except Exception as link_error:
                print(f"Warning: Could not link application {req.application_id}: {link_error}")

        # Skip email sending for test account
        if is_test_email:
            print(f"Test email detected, using fixed code: {TEST_CODE}")
            email_sent = True
        else:
            # Send email with code
            email_sent = await send_verification_email(email, name or "Пользователь", code)

            if not email_sent:
                print(f"Warning: Email not sent to {email}, but code generated: {code}")

        return {
            "success": True,
            "user_id": user_id,
            "message": "Verification code sent",
            "is_test": is_test_email  # Let frontend know this is test account
        }

    except Exception as e:
        print(f"Error requesting verification code: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/auth/verify-code")
async def verify_code(req: VerifyCodeRequest):
    """Verify the code and mark user as verified"""
    try:
        email = req.email.lower().strip()
        is_test_email = email == TEST_EMAIL

        # Get user by email
        user = await supabase.select_by_field("users", "email", email)

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # For test email, accept fixed code; otherwise check stored code
        expected_code = TEST_CODE if is_test_email else user.get("verification_code")

        if req.code != expected_code:
            return {"success": False, "error": "Invalid code"}

        # Check if code is expired (skip for test email)
        if not is_test_email:
            expires_at = user.get("verification_code_expires_at")
            if expires_at:
                try:
                    # Parse ISO format datetime
                    expiry = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
                    if datetime.utcnow().replace(tzinfo=expiry.tzinfo) > expiry:
                        return {"success": False, "error": "Code expired"}
                except:
                    pass  # If parsing fails, continue with verification

        # Mark user as verified and clear code
        user_id = user["id"]
        await supabase.update("users", user_id, {
            "email_verified": True,
            "verification_code": None,
            "verification_code_expires_at": None
        })

        # Link application to verified user
        if req.application_id:
            try:
                await supabase.update("applications", req.application_id, {
                    "user_id": user_id
                })
            except Exception as link_error:
                print(f"Warning: Could not link application {req.application_id}: {link_error}")

        return {
            "success": True,
            "user_id": user_id,
            "verified": True,
            "user": {
                "id": user_id,
                "email": email,
                "name": user.get("name", ""),
                "first_name": user.get("first_name"),
                "last_name": user.get("last_name"),
                "telegram_username": user.get("telegram_username"),
                "subscribe_newsletter": user.get("subscribe_newsletter", False)
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error verifying code: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/examples/import-from-application")
async def import_example_from_application(req: ImportFromApplicationRequest):
    """Import an application as an example (copies input and generated images)"""
    try:
        # Get the application
        app = await supabase.select_one("applications", req.application_id)
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")

        # Get max display_order
        all_examples = await supabase.select("examples")
        max_order = max([e.get('display_order', 0) for e in all_examples], default=0)

        # Determine title based on form factor
        form_factor = app.get('form_factor', 'round')
        title = req.title
        if not title:
            form_labels = {
                'round': 'Круглый кулон',
                'oval': 'Жетон',
                'contour': 'Контурный кулон'
            }
            title = form_labels.get(form_factor, 'Кулон')

        # Get theme from application or use provided
        app_theme = app.get('theme', 'main')
        theme = req.theme if req.theme else app_theme

        # Create description
        material = app.get('material', 'silver')
        size = app.get('size', 'pendant')
        description = req.description
        if not description:
            material_labels = {'gold': 'Золото', 'silver': 'Серебро'}
            size_labels = {'bracelet': 'S', 'pendant': 'M', 'interior': 'L'}
            description = f"{material_labels.get(material, 'Серебро')}, размер {size_labels.get(size, 'M')}"

        data = {
            "id": str(uuid.uuid4()),
            "title": title,
            "description": description,
            "before_image_url": app.get('input_image_url'),
            "after_image_url": app.get('generated_preview'),
            "model_3d_url": None,
            "theme": theme,
            "display_order": max_order + 1,
            "is_active": False
        }

        result = await supabase.insert("examples", data)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============== USER PROFILE API ==============

@router.get("/users/{user_id}")
async def get_user_profile(user_id: str):
    """Get user profile by ID"""
    try:
        user = await supabase.select_one("users", user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "id": user["id"],
            "email": user.get("email"),
            "name": user.get("name"),
            "first_name": user.get("first_name"),
            "last_name": user.get("last_name"),
            "telegram_username": user.get("telegram_username"),
            "subscribe_newsletter": user.get("subscribe_newsletter", False),
            "email_verified": user.get("email_verified", False),
            "created_at": user.get("created_at")
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/users/{user_id}/profile")
async def update_user_profile(user_id: str, updates: UserProfileUpdate):
    """Update user profile"""
    try:
        user = await supabase.select_one("users", user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        update_data = updates.model_dump(exclude_unset=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="No updates provided")

        # Try to update - this may fail if columns don't exist yet
        try:
            result = await supabase.update("users", user_id, update_data)
        except Exception as update_err:
            # If columns don't exist, just return the current user data
            print(f"Warning: Could not update profile (columns may not exist): {update_err}")
            result = user

        return {
            "success": True,
            "user": {
                "id": user_id,
                "email": user.get("email"),
                "name": user.get("name"),
                "first_name": result.get("first_name") if result else None,
                "last_name": result.get("last_name") if result else None,
                "telegram_username": result.get("telegram_username") if result else None,
                "subscribe_newsletter": result.get("subscribe_newsletter", False) if result else False
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============== PAYMENT API ==============

class CreatePaymentRequest(BaseModel):
    application_id: str
    amount: int  # Amount in rubles
    email: Optional[str] = None
    name: Optional[str] = None
    order_comment: Optional[str] = None


class PaymentNotification(BaseModel):
    TerminalKey: str
    OrderId: str
    Success: bool
    Status: str
    PaymentId: int
    ErrorCode: str
    Amount: int
    CardId: Optional[int] = None
    Pan: Optional[str] = None
    ExpDate: Optional[str] = None
    Token: str


@router.post("/payments/create")
async def create_payment(req: CreatePaymentRequest):
    """Create payment and get payment URL"""
    try:
        # Get application to validate
        app = await supabase.select_one("applications", req.application_id)
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")

        # Generate unique order ID
        order_id = f"OLAI-{req.application_id[:8]}-{int(time.time())}"

        # Convert rubles to kopeks
        amount_kopeks = req.amount * 100

        # Build description
        material_labels = {'gold': 'Золото 585', 'silver': 'Серебро 925'}
        size_labels = {'bracelet': 'S', 'pendant': 'M', 'interior': 'L'}
        material = app.get('material', 'silver')
        size = app.get('size', 'pendant')
        description = f"Кулон OLAI.art - {material_labels.get(material, 'Серебро 925')}, размер {size_labels.get(size, 'M')}"

        # URLs for redirect after payment
        base_url = os.environ.get("FRONTEND_URL", "https://olai.art")
        success_url = f"{base_url}/#/payment/success?order={order_id}"
        fail_url = f"{base_url}/#/payment/fail?order={order_id}"

        # Initialize payment in Tinkoff
        payment_result = await init_payment(
            order_id=order_id,
            amount_kopeks=amount_kopeks,
            description=description,
            customer_email=req.email,
            customer_name=req.name,
            success_url=success_url,
            fail_url=fail_url,
        )

        # Save payment to database
        payment_data = {
            "id": str(uuid.uuid4()),
            "application_id": req.application_id,
            "order_id": order_id,
            "tinkoff_payment_id": str(payment_result["payment_id"]),
            "amount": req.amount,
            "status": payment_result["status"],
            "customer_email": req.email,
            "customer_name": req.name,
            "order_comment": req.order_comment,
        }
        await supabase.insert("payments", payment_data)

        # Update application status
        await supabase.update("applications", req.application_id, {
            "status": "pending_payment",
            "order_comment": req.order_comment,
        })

        return {
            "success": True,
            "payment_url": payment_result["payment_url"],
            "order_id": order_id,
            "payment_id": payment_result["payment_id"],
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating payment: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/payments/notification")
async def payment_notification(request: Request):
    """
    Webhook endpoint for Tinkoff payment notifications.
    Tinkoff sends POST with payment status updates.
    """
    try:
        # Parse JSON body
        data = await request.json()
        print(f"Payment notification received: {data}")

        # Verify token
        if not verify_notification_token(data):
            print("Invalid notification token")
            return {"error": "Invalid token"}

        order_id = data.get("OrderId")
        status = data.get("Status")
        payment_id = str(data.get("PaymentId"))
        success = data.get("Success", False)

        # Find payment by order_id
        payments = await supabase.select(
            "payments",
            filters={"order_id": order_id}
        )

        if not payments:
            print(f"Payment not found for order: {order_id}")
            return "OK"  # Return OK to stop retries

        payment = payments[0]

        # Update payment status
        update_data = {
            "status": status,
            "updated_at": datetime.utcnow().isoformat(),
        }

        if data.get("Pan"):
            update_data["card_pan"] = data["Pan"]

        await supabase.update("payments", payment["id"], update_data)

        # If payment successful, update application
        if status in SUCCESS_STATUSES:
            application_id = payment.get("application_id")
            if application_id:
                await supabase.update("applications", application_id, {
                    "status": "paid",
                    "paid_at": datetime.utcnow().isoformat(),
                })
                print(f"Application {application_id} marked as paid")

        # Tinkoff expects "OK" response
        return "OK"

    except Exception as e:
        print(f"Error processing payment notification: {e}")
        return "OK"  # Return OK to prevent retries


@router.get("/payments/status/{order_id}")
async def get_payment_status(order_id: str):
    """Get payment status by order ID"""
    try:
        # Find payment in database
        payments = await supabase.select(
            "payments",
            filters={"order_id": order_id}
        )

        if not payments:
            raise HTTPException(status_code=404, detail="Payment not found")

        payment = payments[0]

        # Get fresh status from Tinkoff
        tinkoff_payment_id = payment.get("tinkoff_payment_id")
        if tinkoff_payment_id:
            try:
                tinkoff_state = await get_payment_state(tinkoff_payment_id)

                # Update local status if changed
                if tinkoff_state.get("status") != payment.get("status"):
                    await supabase.update("payments", payment["id"], {
                        "status": tinkoff_state.get("status"),
                        "updated_at": datetime.utcnow().isoformat(),
                    })
                    payment["status"] = tinkoff_state.get("status")

            except Exception as e:
                print(f"Error getting Tinkoff state: {e}")

        is_paid = payment.get("status") in SUCCESS_STATUSES
        is_final = payment.get("status") in FINAL_STATUSES

        return {
            "order_id": order_id,
            "status": payment.get("status"),
            "amount": payment.get("amount"),
            "is_paid": is_paid,
            "is_final": is_final,
            "application_id": payment.get("application_id"),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/payments/test")
async def test_payment(amount: int = 100):
    """
    Test endpoint to create a payment with arbitrary amount.
    Use for testing: /api/payments/test?amount=100 (amount in rubles)
    Returns payment URL for redirect.
    """
    try:
        # Generate test order ID
        order_id = f"TEST-{int(time.time())}-{random.randint(1000, 9999)}"

        # Convert rubles to kopeks
        amount_kopeks = amount * 100

        # URLs for redirect
        base_url = os.environ.get("FRONTEND_URL", "https://olai.art")
        success_url = f"{base_url}/#/payment/success?order={order_id}"
        fail_url = f"{base_url}/#/payment/fail?order={order_id}"

        # Initialize payment
        payment_result = await init_payment(
            order_id=order_id,
            amount_kopeks=amount_kopeks,
            description=f"Тестовый платёж OLAI.art - {amount} руб.",
            success_url=success_url,
            fail_url=fail_url,
        )

        # Save test payment to database (no application_id)
        payment_data = {
            "id": str(uuid.uuid4()),
            "application_id": None,
            "order_id": order_id,
            "tinkoff_payment_id": str(payment_result["payment_id"]),
            "amount": amount,
            "status": payment_result["status"],
            "customer_email": None,
            "customer_name": "Test User",
            "order_comment": "Test payment",
        }
        await supabase.insert("payments", payment_data)

        # Return redirect URL
        return {
            "success": True,
            "order_id": order_id,
            "amount": amount,
            "payment_url": payment_result["payment_url"],
            "message": f"Redirect to: {payment_result['payment_url']}"
        }

    except Exception as e:
        print(f"Error creating test payment: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin/payments")
async def list_payments(
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    """List all payments with optional status filter (for admin panel)"""
    try:
        # Get all payments
        payments = await supabase.select(
            "payments",
            order="created_at.desc",
            limit=limit
        )

        # Filter by status if provided
        if status:
            payments = [p for p in payments if p.get("status") == status]

        # Get total stats
        all_payments = await supabase.select("payments")
        total_count = len(all_payments)
        total_amount = sum(p.get("amount", 0) for p in all_payments if p.get("status") in SUCCESS_STATUSES)
        paid_count = len([p for p in all_payments if p.get("status") in SUCCESS_STATUSES])

        return {
            "payments": payments,
            "stats": {
                "total_count": total_count,
                "paid_count": paid_count,
                "total_amount": total_amount
            }
        }
    except Exception as e:
        print(f"Error listing payments: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# Admin Authentication Endpoints
# ============================================

# Admin email whitelist - only these emails can access admin panel
ADMIN_EMAILS = [
    "orlovleoart@gmail.com",
    "leo@olai.art",
    "me@leonid.one",
]


class AdminLoginRequest(BaseModel):
    email: str


class AdminVerifyRequest(BaseModel):
    email: str
    code: str


@router.post("/admin/request-code")
async def admin_request_code(req: AdminLoginRequest):
    """Request admin verification code - only for whitelisted emails"""
    try:
        email = req.email.lower().strip()

        # Check if email is in admin whitelist
        if email not in ADMIN_EMAILS:
            # Don't reveal that email isn't in whitelist
            return {
                "success": True,
                "message": "If this email is registered as admin, a code has been sent"
            }

        # Check if user exists, create if not
        existing_user = await supabase.select_by_field("users", "email", email)

        # Generate verification code
        code = generate_verification_code()
        expires_at = (datetime.utcnow() + timedelta(minutes=10)).isoformat()

        if existing_user:
            user_id = existing_user["id"]
            await supabase.update("users", user_id, {
                "verification_code": code,
                "verification_code_expires_at": expires_at,
                "is_admin": True
            })
        else:
            user_id = str(uuid.uuid4())
            await supabase.insert("users", {
                "id": user_id,
                "email": email,
                "name": "Admin",
                "email_verified": True,
                "is_admin": True,
                "verification_code": code,
                "verification_code_expires_at": expires_at
            })

        # Send email with code
        email_sent = await send_verification_email(email, "Admin", code)

        if not email_sent:
            print(f"Warning: Admin email not sent to {email}, code: {code}")

        return {
            "success": True,
            "message": "If this email is registered as admin, a code has been sent"
        }

    except Exception as e:
        print(f"Error in admin login: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/verify-code")
async def admin_verify_code(req: AdminVerifyRequest):
    """Verify admin code and return session token"""
    try:
        email = req.email.lower().strip()

        # Check if email is in admin whitelist
        if email not in ADMIN_EMAILS:
            return {"success": False, "error": "Access denied"}

        # Get user by email
        user = await supabase.select_by_field("users", "email", email)

        if not user:
            return {"success": False, "error": "Access denied"}

        # Check if code matches
        if user.get("verification_code") != req.code:
            return {"success": False, "error": "Invalid code"}

        # Check if code is expired
        expires_at = user.get("verification_code_expires_at")
        if expires_at:
            try:
                expiry = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
                if datetime.utcnow().replace(tzinfo=expiry.tzinfo) > expiry:
                    return {"success": False, "error": "Code expired"}
            except:
                pass

        # Generate session token
        session_token = str(uuid.uuid4())
        session_expires = (datetime.utcnow() + timedelta(hours=24)).isoformat()

        # Update user with session
        user_id = user["id"]
        await supabase.update("users", user_id, {
            "verification_code": None,
            "verification_code_expires_at": None,
            "admin_session_token": session_token,
            "admin_session_expires_at": session_expires
        })

        return {
            "success": True,
            "token": session_token,
            "email": email,
            "expires_at": session_expires
        }

    except Exception as e:
        print(f"Error verifying admin code: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/verify-session")
async def admin_verify_session(request: Request):
    """Verify admin session token"""
    try:
        body = await request.json()
        token = body.get("token")
        email = body.get("email", "").lower().strip()

        if not token or not email:
            return {"valid": False}

        # Check if email is in whitelist
        if email not in ADMIN_EMAILS:
            return {"valid": False}

        # Get user
        user = await supabase.select_by_field("users", "email", email)

        if not user:
            return {"valid": False}

        # Check session token
        if user.get("admin_session_token") != token:
            return {"valid": False}

        # Check if session is expired
        expires_at = user.get("admin_session_expires_at")
        if expires_at:
            try:
                expiry = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
                if datetime.utcnow().replace(tzinfo=expiry.tzinfo) > expiry:
                    return {"valid": False}
            except:
                return {"valid": False}

        return {"valid": True, "email": email}

    except Exception as e:
        print(f"Error verifying admin session: {e}")
        return {"valid": False}


@router.post("/admin/logout")
async def admin_logout(request: Request):
    """Logout admin - invalidate session"""
    try:
        body = await request.json()
        email = body.get("email", "").lower().strip()

        if email:
            user = await supabase.select_by_field("users", "email", email)
            if user:
                await supabase.update("users", user["id"], {
                    "admin_session_token": None,
                    "admin_session_expires_at": None
                })

        return {"success": True}

    except Exception as e:
        print(f"Error logging out admin: {e}")
        return {"success": True}  # Always return success for logout


@router.get("/admin/check/{user_id}")
async def check_admin_status(user_id: str):
    """Check if user is an admin by user_id"""
    try:
        user = await supabase.select_one("users", user_id)

        if not user:
            return {"is_admin": False}

        email = user.get("email", "").lower().strip()

        # Check if email is in admin whitelist or has is_admin flag
        is_admin = email in ADMIN_EMAILS or user.get("is_admin", False)

        return {"is_admin": is_admin, "email": email if is_admin else None}

    except Exception as e:
        print(f"Error checking admin status: {e}")
        return {"is_admin": False}


# ============================================
# Admin Clients & Invoices
# ============================================

@router.get("/admin/clients")
async def admin_list_clients():
    """List all clients with aggregated order/payment data"""
    try:
        # Get all users
        users = await supabase.select("users", order="created_at.desc")

        clients = []
        for user in users:
            user_id = user.get("id")
            email = user.get("email", "")

            # Get applications for this user
            apps = await supabase.select("applications", filters={"user_id": user_id}, order="created_at.desc")

            # Get payments for this user's applications
            total_spent = 0
            paid_count = 0
            payments = []
            for app in apps:
                app_payments = await supabase.select("payments", filters={"application_id": app["id"]})
                for p in app_payments:
                    payments.append(p)
                    if p.get("status") in ("CONFIRMED", "AUTHORIZED"):
                        total_spent += p.get("amount", 0)
                        paid_count += 1

            clients.append({
                "id": user_id,
                "email": email,
                "name": user.get("name", ""),
                "first_name": user.get("first_name", ""),
                "last_name": user.get("last_name", ""),
                "telegram_username": user.get("telegram_username", ""),
                "created_at": user.get("created_at"),
                "orders_count": len(apps),
                "paid_count": paid_count,
                "total_spent": total_spent,
                "applications": [{
                    "id": a["id"],
                    "status": a.get("status"),
                    "form_factor": a.get("form_factor"),
                    "material": a.get("material"),
                    "size": a.get("size"),
                    "generated_preview": a.get("generated_preview"),
                    "input_image_url": a.get("input_image_url"),
                    "created_at": a.get("created_at"),
                    "paid_at": a.get("paid_at"),
                    "order_comment": a.get("order_comment"),
                    "user_comment": a.get("user_comment"),
                } for a in apps],
                "payments": [{
                    "id": p["id"],
                    "order_id": p.get("order_id"),
                    "amount": p.get("amount", 0),
                    "status": p.get("status"),
                    "created_at": p.get("created_at"),
                    "customer_email": p.get("customer_email"),
                } for p in payments],
            })

        # Filter out users with no applications (unless they have a name)
        clients = [c for c in clients if c["orders_count"] > 0 or c.get("name")]

        return {"clients": clients, "total": len(clients)}

    except Exception as e:
        print(f"Error listing clients: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin/clients/{user_id}")
async def admin_get_client(user_id: str):
    """Get detailed client card"""
    try:
        user = await supabase.select_one("users", user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get applications
        apps = await supabase.select("applications", filters={"user_id": user_id}, order="created_at.desc")

        # Get all payments
        all_payments = []
        for app in apps:
            app_payments = await supabase.select("payments", filters={"application_id": app["id"]})
            for p in app_payments:
                p["application_id"] = app["id"]
                all_payments.append(p)

        total_spent = sum(p.get("amount", 0) for p in all_payments if p.get("status") in ("CONFIRMED", "AUTHORIZED"))

        return {
            "id": user_id,
            "email": user.get("email", ""),
            "name": user.get("name", ""),
            "first_name": user.get("first_name", ""),
            "last_name": user.get("last_name", ""),
            "telegram_username": user.get("telegram_username", ""),
            "created_at": user.get("created_at"),
            "orders_count": len(apps),
            "total_spent": total_spent,
            "applications": [{
                "id": a["id"],
                "status": a.get("status"),
                "form_factor": a.get("form_factor"),
                "material": a.get("material"),
                "size": a.get("size"),
                "generated_preview": a.get("generated_preview"),
                "input_image_url": a.get("input_image_url"),
                "created_at": a.get("created_at"),
                "paid_at": a.get("paid_at"),
                "order_comment": a.get("order_comment"),
                "user_comment": a.get("user_comment"),
            } for a in apps],
            "payments": [{
                "id": p["id"],
                "order_id": p.get("order_id"),
                "application_id": p.get("application_id"),
                "amount": p.get("amount", 0),
                "status": p.get("status"),
                "created_at": p.get("created_at"),
                "card_pan": p.get("card_pan"),
            } for p in all_payments],
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting client: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class CreateInvoiceRequest(BaseModel):
    application_id: Optional[str] = None
    amount: int  # in rubles
    description: str
    customer_email: str
    customer_name: Optional[str] = None


@router.post("/admin/create-invoice")
async def admin_create_invoice(req: CreateInvoiceRequest):
    """Create invoice (payment link) for a client from admin panel"""
    try:
        # Generate unique order ID
        app_prefix = req.application_id[:8] if req.application_id else "MANUAL"
        order_id = f"OLAI-{app_prefix}-{int(time.time())}"

        # Convert rubles to kopeks
        amount_kopeks = req.amount * 100

        # URLs for redirect after payment
        base_url = os.environ.get("FRONTEND_URL", "https://olai.art")
        success_url = f"{base_url}/#/payment/success?order={order_id}"
        fail_url = f"{base_url}/#/payment/fail?order={order_id}"

        # Initialize payment in Tinkoff (without НДС - УСН)
        payment_result = await init_payment(
            order_id=order_id,
            amount_kopeks=amount_kopeks,
            description=req.description,
            customer_email=req.customer_email,
            customer_name=req.customer_name,
            success_url=success_url,
            fail_url=fail_url,
        )

        # Save payment to database
        payment_data = {
            "id": str(uuid.uuid4()),
            "application_id": req.application_id,
            "order_id": order_id,
            "tinkoff_payment_id": str(payment_result["payment_id"]),
            "amount": req.amount,
            "status": payment_result["status"],
            "customer_email": req.customer_email,
            "customer_name": req.customer_name,
            "order_comment": req.description,
        }
        await supabase.insert("payments", payment_data)

        # Update application status if linked
        if req.application_id:
            await supabase.update("applications", req.application_id, {
                "status": "pending_payment",
            })

        return {
            "success": True,
            "payment_url": payment_result["payment_url"],
            "order_id": order_id,
            "amount": req.amount,
        }

    except Exception as e:
        print(f"Error creating invoice: {e}")
        raise HTTPException(status_code=500, detail=str(e))
