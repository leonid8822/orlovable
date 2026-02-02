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
import base64
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
    theme: str = 'main'  # main, kids, totems, custom
    # Custom 3D form specific fields
    objectDescription: Optional[str] = None  # Description of which object to extract from photo


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
    # Gems and engraving
    gems: Optional[list] = None
    back_engraving: Optional[str] = None
    has_back_engraving: Optional[bool] = None


class SettingsUpdate(BaseModel):
    num_images: Optional[int] = None
    main_prompt: Optional[str] = None
    main_prompt_no_image: Optional[str] = None
    form_factors: Optional[dict] = None
    sizes: Optional[dict] = None
    materials: Optional[dict] = None
    visualization: Optional[dict] = None
    # Gems settings
    gems_config: Optional[dict] = None  # {scaleCoefficient, pricePerGem}
    # Custom 3D form generation settings
    custom_form_prompt: Optional[str] = None
    custom_form_sizes: Optional[dict] = None
    custom_form_enabled: Optional[bool] = None
    # Model selection
    generation_model: Optional[str] = None  # 'seedream' | 'flux-kontext' | 'nano-banana'
    available_models: Optional[dict] = None  # Model definitions
    # Separate prompts for flat medallion vs volumetric 3D
    flat_pendant_prompt: Optional[str] = None  # For regular pendants (round, contour, oval)
    volumetric_pendant_prompt: Optional[str] = None  # For custom 3D objects


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
                "addition": "Форма армейского жетона (dog tag) - вертикальный скруглённый прямоугольник с небольшой выемкой сверху для цепочки.",
                "shape": "military dog tag shape - vertical rounded rectangle with small notch at top for chain"
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
        },
        # Gems configuration
        "gems_config": {
            "scaleCoefficient": 1.4,  # Pendant height * 1.4 = image height for gem sizing
            "pricePerGem": 2000  # Price per gem in rubles
        },
        # Custom 3D form generation (arbitrary objects from photos)
        "custom_form_enabled": False,
        "custom_form_prompt": "",  # Deprecated, use volumetric_pendant_prompt instead
        "custom_form_sizes": {
            "silver": {
                "s": {"label": "S", "dimensionsMm": 15, "price": 7000},
                "m": {"label": "M", "dimensionsMm": 25, "price": 12000},
                "l": {"label": "L", "dimensionsMm": 40, "price": 18000}
            }
        },
        # Separate prompts for different pendant types
        "flat_pendant_prompt": """Create a jewelry pendant from the reference image.
Type: {form_label}
{user_wishes}

CRITICAL REQUIREMENTS:
- The pendant must be a SINGLE, MONOLITHIC piece - one unified silver object with no separate parts
- Surface must be SOLID, NO HOLES OR CUTOUTS. Black background only OUTSIDE the pendant, around it. Inside the pendant there should be no black areas or holes - the entire surface is solid silver
- Bail/loop for chain - simple, classic jewelry style, integrated into the main object
- Strictly front view only
- Black background ONLY AROUND the pendant (outside). Silver metal finish. No paint, no enamel, no additional textures
- Ready for 3D printing - no separate parts, everything connected into a single form
- {form_addition}
- Shape: {form_shape}
- Maximum surface detail, jewelry quality finish""",
        "volumetric_pendant_prompt": """Create a wearable 3D silver pendant based on the object from the photo.
Object to transform: {object_description}
{user_wishes}

CRITICAL REQUIREMENTS:
- This is a REAL WEARABLE PENDANT that hangs on a chain around the neck
- Create a VOLUMETRIC, THREE-DIMENSIONAL silver sculpture with DEPTH and VOLUME
- The pendant must look like a finished jewelry piece ready to wear, not just a sculpture
- BAIL/LOOP PLACEMENT: Add a jewelry bail (small loop for chain attachment) at the TOPMOST point of the object. The bail must be positioned so the pendant hangs correctly and naturally when worn. If user specified bail placement in wishes, follow their preference.
- The bail must be integrated seamlessly into the design - a classic, elegant jewelry-style loop
- Preserve the 3D shape, form and proportions of the original object
- Show the pendant from a 3/4 angle to emphasize its three-dimensional nature and wearability
- Material: polished silver metal with realistic reflections and highlights
- The object must be SOLID, MONOLITHIC, ready for 3D printing - no separate parts, everything connected
- Black background, dramatic lighting to show depth and volume
- Size: {size_dimensions}
- Maximum surface detail, jewelry quality finish
- Style: realistic silver miniature sculpture that looks like a professional jewelry piece you can actually wear""",
        # Model selection for AI generation
        "generation_model": "seedream",  # 'seedream' | 'flux-kontext' | 'nano-banana'
        "available_models": {
            "seedream": {
                "label": "Seedream v4",
                "description": "Bytedance SeedDream - хорошая детализация",
                "cost_per_image_cents": 3
            },
            "flux-kontext": {
                "label": "Flux Kontext",
                "description": "Black Forest Labs - качественное редактирование",
                "cost_per_image_cents": 4
            },
            "nano-banana": {
                "label": "Nano Banana",
                "description": "Google - быстрая генерация",
                "cost_per_image_cents": 3
            }
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
            elif key == 'gems_config' and isinstance(value, dict):
                result['gems_config'] = value
            elif key in ['main_prompt', 'main_prompt_no_image', 'custom_form_prompt', 'flat_pendant_prompt', 'volumetric_pendant_prompt']:
                result[key] = str(value) if value else ""
            elif key == 'custom_form_sizes' and isinstance(value, dict):
                result['custom_form_sizes'] = value
            elif key == 'custom_form_enabled':
                result['custom_form_enabled'] = bool(value) if value is not None else False
            elif key == 'generation_model':
                result['generation_model'] = str(value) if value else "seedream"
            elif key == 'available_models' and isinstance(value, dict):
                result['available_models'] = value

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
        if updates.gems_config:
            await set_val('gems_config', updates.gems_config)
        if updates.custom_form_prompt is not None:
            await set_val('custom_form_prompt', updates.custom_form_prompt)
        if updates.custom_form_sizes:
            await set_val('custom_form_sizes', updates.custom_form_sizes)
        if updates.custom_form_enabled is not None:
            await set_val('custom_form_enabled', updates.custom_form_enabled)
        if updates.generation_model is not None:
            await set_val('generation_model', updates.generation_model)
        if updates.available_models:
            await set_val('available_models', updates.available_models)
        if updates.flat_pendant_prompt is not None:
            await set_val('flat_pendant_prompt', updates.flat_pendant_prompt)
        if updates.volumetric_pendant_prompt is not None:
            await set_val('volumetric_pendant_prompt', updates.volumetric_pendant_prompt)

        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/settings/reset")
async def reset_settings_to_defaults():
    """Reset critical settings to correct defaults - model, prompts, form factors"""
    try:
        settings_list = await supabase.select("generation_settings")
        existing_keys = {item["key"]: item["id"] for item in settings_list}

        async def set_val(key, val):
            if key in existing_keys:
                await supabase.update("generation_settings", existing_keys[key], {"value": val})
            else:
                await supabase.insert("generation_settings", {"key": key, "value": val})

        # Reset model to seedream
        await set_val('generation_model', 'seedream')

        # Reset form factors with correct dog tag shape
        await set_val('form_factors', {
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
                "addition": "Форма армейского жетона (dog tag) - вертикальный скруглённый прямоугольник с небольшой выемкой сверху для цепочки.",
                "shape": "military dog tag shape - vertical rounded rectangle with small notch at top for chain"
            },
            "contour": {
                "label": "Контурный кулон",
                "description": "По контуру рисунка",
                "icon": "hexagon",
                "addition": "Форма повторяет контур изображения.",
                "shape": "по контуру выбранного объекта"
            }
        })

        # Reset flat pendant prompt with NO COLORS requirement
        await set_val('flat_pendant_prompt', """Create a jewelry pendant from the reference image.
Type: {form_label}
{user_wishes}

CRITICAL REQUIREMENTS:
- The pendant must be a SINGLE, MONOLITHIC piece - one unified silver object with no separate parts
- Surface must be SOLID, NO HOLES OR CUTOUTS. Black background only OUTSIDE the pendant, around it. Inside the pendant there should be no black areas or holes - the entire surface is solid silver
- Bail/loop for chain - simple, classic jewelry style, integrated into the main object
- Strictly front view only
- Black background ONLY AROUND the pendant (outside)
- CRITICAL: The pendant must be made ENTIRELY of polished silver metal. ABSOLUTELY NO COLORS, NO PAINT, NO ENAMEL, NO COLORED AREAS. The entire pendant surface must be monochromatic silver/gray metallic only. No red, no yellow, no blue, no any other colors - ONLY silver metal finish.
- Ready for 3D printing - no separate parts, everything connected into a single form
- {form_addition}
- Shape: {form_shape}
- Maximum surface detail, jewelry quality finish""")

        # Reset volumetric prompt with NO COLORS requirement
        await set_val('volumetric_pendant_prompt', """Create a wearable 3D silver pendant based on the object from the photo.
Object to transform: {object_description}
{user_wishes}

CRITICAL REQUIREMENTS:
- This is a REAL WEARABLE PENDANT that hangs on a chain around the neck
- Create a VOLUMETRIC, THREE-DIMENSIONAL silver sculpture with DEPTH and VOLUME
- The pendant must look like a finished jewelry piece ready to wear, not just a sculpture
- BAIL/LOOP PLACEMENT: Add a jewelry bail (small loop for chain attachment) at the TOPMOST point of the object. The bail must be positioned so the pendant hangs correctly and naturally when worn.
- The bail must be integrated seamlessly into the design - a classic, elegant jewelry-style loop
- Preserve the 3D shape, form and proportions of the original object
- Show the pendant from a 3/4 angle to emphasize its three-dimensional nature and wearability
- Material: polished silver metal with realistic reflections and highlights
- CRITICAL: ABSOLUTELY NO COLORS, NO PAINT, NO ENAMEL. The entire pendant must be monochromatic silver/gray metallic ONLY. No red, no yellow, no blue, no any other colors - ONLY silver metal finish.
- The object must be SOLID, MONOLITHIC, ready for 3D printing - no separate parts, everything connected
- Black background, dramatic lighting to show depth and volume
- Size: {size_dimensions}
- Maximum surface detail, jewelry quality finish
- Style: realistic silver miniature sculpture that looks like a professional jewelry piece you can actually wear""")

        return {
            "success": True,
            "message": "Settings reset to defaults: seedream model, no-colors prompts, correct dog tag shape",
            "updated": ["generation_model", "form_factors", "flat_pendant_prompt", "volumetric_pendant_prompt"]
        }
    except Exception as e:
        print(f"Error resetting settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/applications")
async def list_applications(user_id: Optional[str] = None, limit: int = 100):
    """List applications"""
    try:
        # Cap limit at 500 for performance
        limit = min(limit, 500)
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


class SubmitOrderRequest(BaseModel):
    """Request to submit order without payment"""
    email: str
    name: Optional[str] = None
    phone: Optional[str] = None
    telegram: Optional[str] = None
    material: str = 'silver'
    size: str = 'pendant'
    size_option: str = 'm'
    order_comment: Optional[str] = None
    gems: Optional[list] = None


@router.post("/applications/{app_id}/submit")
async def submit_order(app_id: str, req: SubmitOrderRequest):
    """Submit order without payment - just save contact info and mark as submitted"""
    try:
        # Verify application exists
        app = await supabase.select_one("applications", app_id)
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")

        # Find or create user by email
        # ALWAYS save customer data to users table (source of truth)
        user_id = None
        if req.email:
            existing_user = await supabase.select_by_field("users", "email", req.email)
            if existing_user:
                user_id = existing_user.get("id")
                # Always update user info when provided (users is source of truth)
                user_updates = {}
                if req.name:
                    user_updates["name"] = req.name
                if req.phone:
                    user_updates["phone"] = req.phone
                if req.telegram:
                    user_updates["telegram_username"] = req.telegram
                if user_updates:
                    await supabase.update("users", user_id, user_updates)
            else:
                # Create new user
                new_user = await supabase.insert("users", {
                    "email": req.email,
                    "name": req.name or "",
                    "phone": req.phone or "",
                    "telegram_username": req.telegram or "",
                })
                if new_user:
                    user_id = new_user.get("id")

        # Update application with order details
        update_data = {
            "status": "completed",  # Order completed (payment separate)
            "material": req.material,
            "size": req.size,
            "size_option": req.size_option,
            "order_comment": req.order_comment,
            "customer_email": req.email,
            "customer_name": req.name,
            "customer_phone": req.phone,
            "customer_telegram": req.telegram,
            "submitted_at": datetime.utcnow().isoformat(),
        }

        # Link to user
        if user_id:
            update_data["user_id"] = user_id

        # Add gems if provided
        if req.gems:
            update_data["gems"] = req.gems

        result = await supabase.update("applications", app_id, update_data)

        # TODO: Send notification to admin (Telegram bot, email, etc.)

        return {
            "success": True,
            "application_id": app_id,
            "user_id": user_id,
            "status": "completed",
            "message": "Заказ успешно оформлен! Мы свяжемся с вами для уточнения деталей."
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error submitting order: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_history(limit: int = 100):
    """Get generation history"""
    try:
        # Cap limit at 500 for performance
        limit = min(limit, 500)
        generations = await supabase.select(
            "pendant_generations",
            order="created_at.desc",
            limit=limit
        )
        return generations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Cost constants (fal.ai pricing)
COST_PER_IMAGE_CENTS = 3  # Default, overridden by model config
COST_REMOVE_BG_CENTS = 1  # Background removal cost

# Model configurations
MODEL_CONFIGS = {
    "seedream": {
        "edit_url": "https://queue.fal.run/fal-ai/bytedance/seedream/v4/edit",
        "text_url": "https://queue.fal.run/fal-ai/bytedance/seedream/v4/text-to-image",
        "edit_name": "seedream-v4-edit",
        "text_name": "seedream-v4-text-to-image",
        "cost_per_image_cents": 3,
        "image_key": "image_urls",  # Key for input images in request
        "supports_num_images": True,
    },
    "flux-kontext": {
        "edit_url": "https://queue.fal.run/fal-ai/flux-kontext/dev",
        "text_url": None,  # Flux Kontext doesn't support text-to-image
        "edit_name": "flux-kontext-dev",
        "text_name": None,
        "cost_per_image_cents": 4,
        "image_key": "image_url",  # Single image URL
        "supports_num_images": True,
    },
    "nano-banana": {
        "edit_url": "https://queue.fal.run/fal-ai/nano-banana/edit",
        "text_url": "https://queue.fal.run/fal-ai/nano-banana",
        "edit_name": "nano-banana-edit",
        "text_name": "nano-banana",
        "cost_per_image_cents": 3,
        "image_key": "image_urls",  # Array of image URLs
        "supports_num_images": True,
    },
}


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
    is_custom_form = req.theme == 'custom'
    print(f"Starting pendant generation. Has image: {has_image}, Form: {req.formFactor}, Theme: {req.theme}")

    # Build prompt based on theme
    if is_custom_form:
        # Custom 3D form generation - extract 3D object from photo (volumetric)
        custom_sizes = settings.get("custom_form_sizes", {}).get(req.material, {})
        size_config = custom_sizes.get(req.size, custom_sizes.get("m", {}))
        size_dimensions = f"{size_config.get('dimensionsMm', 25)}mm"

        object_desc = req.objectDescription or "the main object in the photo"
        user_wishes = f"Additional wishes: {req.prompt}" if req.prompt else ""

        # Use admin-configurable volumetric prompt or fallback to default
        volumetric_template = settings.get("volumetric_pendant_prompt", "")
        if volumetric_template and "{object_description}" in volumetric_template:
            pendant_prompt = volumetric_template.format(
                object_description=object_desc,
                user_wishes=user_wishes,
                size_dimensions=size_dimensions
            )
        else:
            pendant_prompt = f"""Create a wearable 3D silver pendant based on the object from the photo.
Object to transform: {object_desc}
{user_wishes}

CRITICAL REQUIREMENTS:
- This is a REAL WEARABLE PENDANT that hangs on a chain around the neck
- Create a VOLUMETRIC, THREE-DIMENSIONAL silver sculpture with DEPTH and VOLUME
- The pendant must look like a finished jewelry piece ready to wear, not just a sculpture
- BAIL/LOOP PLACEMENT: Add a jewelry bail (small loop for chain attachment) at the TOPMOST point of the object. The bail must be positioned so the pendant hangs correctly and naturally when worn.
- The bail must be integrated seamlessly into the design - a classic, elegant jewelry-style loop
- Preserve the 3D shape, form and proportions of the original object
- Show the pendant from a 3/4 angle to emphasize its three-dimensional nature and wearability
- Material: polished silver metal with realistic reflections and highlights
- CRITICAL: ABSOLUTELY NO COLORS, NO PAINT, NO ENAMEL. The entire pendant must be monochromatic silver/gray metallic ONLY. No red, no yellow, no blue, no any other colors - ONLY silver metal finish.
- The object must be SOLID, MONOLITHIC, ready for 3D printing - no separate parts, everything connected
- Black background, dramatic lighting to show depth and volume
- Size: {size_dimensions}
- Maximum surface detail, jewelry quality finish
- Style: realistic silver miniature sculpture that looks like a professional jewelry piece you can actually wear"""
    else:
        # Standard pendant generation (flat medallion style)
        # sizes structure: sizes[material][size_key] -> {label, price, apiSize, dimensionsMm}
        material_sizes = settings["sizes"].get(req.material, settings["sizes"].get("silver", {}))
        size_config = material_sizes.get(req.size, material_sizes.get("m", {}))
        size_dimensions = f"{size_config.get('dimensionsMm', 18)}mm"

        form_config = settings["form_factors"].get(req.formFactor, settings["form_factors"]["round"])
        form_addition = form_config.get("addition", "")
        form_shape_base = form_config.get("shape", "round shape, object inscribed in circle")
        form_shape = f"{form_shape_base}, size {size_dimensions}"

        # Get form factor label for prompt
        form_label = form_config.get("label", "round pendant")
        user_wishes = f"Additional wishes: {req.prompt}" if req.prompt else ""

        # Use admin-configurable flat pendant prompt or fallback to default
        flat_template = settings.get("flat_pendant_prompt", "")

        if has_image:
            if flat_template and "{form_label}" in flat_template:
                pendant_prompt = flat_template.format(
                    form_label=form_label,
                    user_wishes=user_wishes,
                    form_addition=form_addition,
                    form_shape=form_shape
                )
            else:
                pendant_prompt = f"""Create a jewelry pendant from the reference image.
Type: {form_label}
{user_wishes}
IMPORTANT: Follow the reference as closely as possible. Preserve all details and proportions of the original image.
The pendant must be a SINGLE, MONOLITHIC piece - one unified silver object with no separate parts.
IMPORTANT: Surface must be SOLID, NO HOLES OR CUTOUTS. Black background only OUTSIDE the pendant, around it. Inside the pendant there should be no black areas or holes - the entire surface is solid silver.
Bail/loop for chain - simple, classic jewelry style, integrated into the main object.
Strictly front view only.
Black background ONLY AROUND the pendant (outside).
CRITICAL: The pendant must be made ENTIRELY of polished silver metal. ABSOLUTELY NO COLORS, NO PAINT, NO ENAMEL, NO COLORED AREAS. The entire pendant surface must be monochromatic silver/gray metallic only. No red, no yellow, no blue, no any other colors - ONLY silver metal finish.
Ready for 3D printing - no separate parts, everything connected into a single form.
{form_addition}
Shape: {form_shape}
Maximum surface detail, jewelry quality finish."""
        else:
            pendant_prompt = f"""Create a jewelry pendant.
Type: {form_label}
{user_wishes if user_wishes else 'A beautiful elegant jewelry pendant.'}
The pendant must be a SINGLE, MONOLITHIC piece - one unified silver object with no separate parts.
IMPORTANT: Surface must be SOLID, NO HOLES OR CUTOUTS. Black background only OUTSIDE the pendant, around it. Inside the pendant there should be no black areas or holes.
Bail/loop for chain - simple, classic jewelry style, integrated into the main object.
Strictly front view only.
Black background ONLY AROUND the pendant (outside).
CRITICAL: The pendant must be made ENTIRELY of polished silver metal. ABSOLUTELY NO COLORS, NO PAINT, NO ENAMEL, NO COLORED AREAS. The entire pendant surface must be monochromatic silver/gray metallic only. No red, no yellow, no blue, no any other colors - ONLY silver metal finish.
Ready for 3D printing - no separate parts, everything connected into a single form.
{form_addition}
Shape: {form_shape}
Maximum surface detail, jewelry quality finish."""

    print(f"Final prompt: {pendant_prompt}")

    # Get selected model from settings
    selected_model = settings.get("generation_model", "seedream")
    model_config = MODEL_CONFIGS.get(selected_model, MODEL_CONFIGS["seedream"])

    # Determine model URL and name based on whether we have an image
    if has_image:
        model_url = model_config["edit_url"]
        model_name = model_config["edit_name"]
    else:
        # Fall back to seedream for text-to-image if model doesn't support it
        if model_config["text_url"]:
            model_url = model_config["text_url"]
            model_name = model_config["text_name"]
        else:
            # Flux Kontext doesn't support text-to-image, fall back to seedream
            fallback_config = MODEL_CONFIGS["seedream"]
            model_url = fallback_config["text_url"]
            model_name = fallback_config["text_name"]
            print(f"Model {selected_model} doesn't support text-to-image, falling back to seedream")

    print(f"Using model: {model_name} ({selected_model})")

    # Build request body based on model
    request_body = {
        "prompt": pendant_prompt,
        "enable_safety_checker": True,
    }

    # Add num_images if supported
    if model_config.get("supports_num_images", True):
        request_body["num_images"] = num_images

    # Model-specific parameters
    if selected_model == "seedream":
        request_body["image_size"] = "square_hd"
        if has_image:
            request_body["image_urls"] = [req.imageBase64]
    elif selected_model == "flux-kontext":
        request_body["output_format"] = "png"
        request_body["guidance_scale"] = 2.5
        request_body["num_inference_steps"] = 28
        if has_image:
            request_body["image_url"] = req.imageBase64
    elif selected_model == "nano-banana":
        request_body["aspect_ratio"] = "1:1"
        request_body["output_format"] = "png"
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

            # Upload images to Supabase Storage for reliable access
            # Create both full size (1024px) and thumbnail (400px) versions in WebP format
            print(f"Uploading {len(image_urls)} images to Supabase Storage...")
            generation_id = str(uuid.uuid4())
            supabase_urls = []
            thumbnail_urls = []
            for i, img_url in enumerate(image_urls):
                try:
                    file_path = f"{generation_id}/{i}.png"
                    full_url, thumb_url = await supabase.upload_with_thumbnail(
                        "generations",
                        file_path,
                        img_url,
                        full_size=1024,
                        thumb_size=400,
                        format="WEBP",
                        quality=85
                    )
                    supabase_urls.append(full_url)
                    thumbnail_urls.append(thumb_url)
                    print(f"Uploaded image {i+1}/{len(image_urls)} with thumbnail")
                except Exception as upload_err:
                    print(f"Failed to upload image {i}: {upload_err}, using original URL")
                    supabase_urls.append(img_url)
                    thumbnail_urls.append(img_url)  # Fallback to full image for thumb

            # Use Supabase URLs if upload succeeded
            if supabase_urls:
                image_urls = supabase_urls
            print(f"Upload complete")

            execution_time_ms = int((time.time() - start_time) * 1000)
            cost_per_image = model_config.get("cost_per_image_cents", COST_PER_IMAGE_CENTS)
            cost_cents = len(image_urls) * cost_per_image + len(image_urls) * COST_REMOVE_BG_CENTS

            # Upload input image to Supabase Storage for history
            input_image_url = None
            if has_image and req.imageBase64:
                try:
                    input_path = f"{generation_id}/input.webp"
                    if req.imageBase64.startswith("data:"):
                        # Base64 encoded image - extract base64 data after the comma
                        base64_data = req.imageBase64.split(",", 1)[1] if "," in req.imageBase64 else req.imageBase64
                        image_bytes = base64.b64decode(base64_data)
                        await supabase.upload_file("generations", input_path, image_bytes, "image/webp")
                        input_image_url = await supabase.get_public_url("generations", input_path)
                    elif req.imageBase64.startswith("http"):
                        # URL - download and upload
                        input_image_url = await supabase.upload_from_url("generations", input_path, req.imageBase64)
                    print(f"Uploaded input image: {input_image_url}")
                except Exception as input_err:
                    print(f"Failed to upload input image: {input_err}")
                    input_image_url = None

            # Save to Supabase
            gen_data = {
                "id": generation_id,
                "input_image_url": input_image_url,
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
                "thumbnails": thumbnail_urls,
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
    phone: Optional[str] = None
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
                "phone": user.get("phone"),
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
            "phone": user.get("phone"),
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
                "phone": result.get("phone") if result else None,
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
        success_url = f"{base_url}/payment/success?order={order_id}"
        fail_url = f"{base_url}/payment/fail?order={order_id}"

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
            "payment_url": payment_result["payment_url"],
        }
        await supabase.insert("payments", payment_data)

        # Update application status
        await supabase.update("applications", req.application_id, {
            "status": "pending_order",
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
        success_url = f"{base_url}/payment/success?order={order_id}"
        fail_url = f"{base_url}/payment/fail?order={order_id}"

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
            "payment_url": payment_result["payment_url"],
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
                "is_admin": user.get("is_admin", False),
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


@router.get("/admin/clients/search")
async def admin_search_clients(q: str = ""):
    """Search clients by email, name or telegram for autocomplete"""
    try:
        if len(q) < 2:
            return {"clients": []}

        users = await supabase.select("users", order="created_at.desc", limit=100)
        q_lower = q.lower()

        results = []
        for user in users:
            email = user.get("email", "").lower()
            name = user.get("name", "").lower()
            first_name = user.get("first_name", "").lower()
            last_name = user.get("last_name", "").lower()
            telegram = user.get("telegram_username", "").lower()

            if (q_lower in email or q_lower in name or
                q_lower in first_name or q_lower in last_name or
                q_lower in telegram):
                results.append({
                    "id": user.get("id"),
                    "email": user.get("email"),
                    "name": user.get("name", ""),
                    "first_name": user.get("first_name", ""),
                    "last_name": user.get("last_name", ""),
                    "telegram_username": user.get("telegram_username", ""),
                })

            if len(results) >= 10:
                break

        return {"clients": results}

    except Exception as e:
        print(f"Error searching clients: {e}")
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


class UpdateUserAdminRequest(BaseModel):
    is_admin: bool


@router.patch("/admin/users/{user_id}/admin")
async def admin_update_user_admin(user_id: str, req: UpdateUserAdminRequest):
    """Update user admin status"""
    try:
        user = await supabase.select_one("users", user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        result = await supabase.update("users", user_id, {"is_admin": req.is_admin})
        return {"success": True, "is_admin": req.is_admin}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating user admin: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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
        success_url = f"{base_url}/payment/success?order={order_id}"
        fail_url = f"{base_url}/payment/fail?order={order_id}"

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
            "payment_url": payment_result["payment_url"],
        }
        await supabase.insert("payments", payment_data)

        # Update application status if linked
        if req.application_id:
            await supabase.update("applications", req.application_id, {
                "status": "pending_order",
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


# Client management endpoints

class CreateClientRequest(BaseModel):
    email: str
    name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    telegram_username: Optional[str] = None


class UpdateClientRequest(BaseModel):
    email: Optional[str] = None
    name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    telegram_username: Optional[str] = None
    is_admin: Optional[bool] = None


class AssignClientRequest(BaseModel):
    user_id: str


@router.post("/admin/clients")
async def admin_create_client(req: CreateClientRequest):
    """Create a new client (user)"""
    try:
        # Check if user with this email already exists
        existing = await supabase.select("users", filters={"email": req.email})
        if existing:
            raise HTTPException(status_code=400, detail="Клиент с таким email уже существует")

        user_id = str(uuid.uuid4())
        user_data = {
            "id": user_id,
            "email": req.email,
            "name": req.name or "",
            "first_name": req.first_name or "",
            "last_name": req.last_name or "",
            "telegram_username": req.telegram_username or "",
            "is_admin": False,
        }
        await supabase.insert("users", user_data)

        return {"success": True, "id": user_id, "email": req.email}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating client: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/admin/clients/{user_id}")
async def admin_update_client(user_id: str, req: UpdateClientRequest):
    """Update client data"""
    try:
        user = await supabase.select_one("users", user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Клиент не найден")

        updates = {}
        if req.email is not None:
            # Check if email is already taken by another user
            existing = await supabase.select("users", filters={"email": req.email})
            if existing and existing[0].get("id") != user_id:
                raise HTTPException(status_code=400, detail="Email уже используется другим клиентом")
            updates["email"] = req.email
        if req.name is not None:
            updates["name"] = req.name
        if req.first_name is not None:
            updates["first_name"] = req.first_name
        if req.last_name is not None:
            updates["last_name"] = req.last_name
        if req.telegram_username is not None:
            updates["telegram_username"] = req.telegram_username
        if req.is_admin is not None:
            updates["is_admin"] = req.is_admin

        if updates:
            await supabase.update("users", user_id, updates)

        return {"success": True, "id": user_id}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating client: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/admin/applications/{app_id}/client")
async def admin_assign_client_to_application(app_id: str, req: AssignClientRequest):
    """Assign or change client (user) on an application"""
    try:
        # Verify application exists
        app = await supabase.select_one("applications", app_id)
        if not app:
            raise HTTPException(status_code=404, detail="Заявка не найдена")

        # Verify user exists
        user = await supabase.select_one("users", req.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Клиент не найден")

        # Update application
        await supabase.update("applications", app_id, {"user_id": req.user_id})

        return {
            "success": True,
            "application_id": app_id,
            "user_id": req.user_id,
            "user_email": user.get("email"),
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error assigning client: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== SHOP / PRODUCTS API ==============

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: str = "totem"
    image_url: str
    gallery_urls: Optional[list] = []
    price_silver: int
    price_gold: Optional[int] = None
    sizes_available: Optional[list] = ["s", "m", "l"]
    is_available: bool = True
    stock_count: int = -1
    display_order: int = 0
    is_featured: bool = False
    slug: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    gallery_urls: Optional[list] = None
    price_silver: Optional[int] = None
    price_gold: Optional[int] = None
    sizes_available: Optional[list] = None
    is_available: Optional[bool] = None
    stock_count: Optional[int] = None
    display_order: Optional[int] = None
    is_featured: Optional[bool] = None
    slug: Optional[str] = None


@router.get("/products")
async def get_products(category: Optional[str] = None, featured_only: bool = False):
    """Get all available products for shop"""
    try:
        # Build query - get only available products, ordered by display_order
        products = await supabase.select(
            "products",
            order="display_order.asc,created_at.desc"
        )

        # Filter by availability
        products = [p for p in products if p.get("is_available", True)]

        # Filter by category if specified
        if category:
            products = [p for p in products if p.get("category") == category]

        # Filter featured only
        if featured_only:
            products = [p for p in products if p.get("is_featured", False)]

        return products
    except Exception as e:
        print(f"Error fetching products: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/products/{product_id}")
async def get_product(product_id: str):
    """Get single product by ID or slug"""
    try:
        # Try to find by ID first
        product = await supabase.select_one("products", product_id)

        # If not found by ID, try by slug
        if not product:
            product = await supabase.select_by_field("products", "slug", product_id)

        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        return product
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching product: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin/products")
async def admin_get_products():
    """Get all products for admin (including unavailable)"""
    try:
        products = await supabase.select(
            "products",
            order="display_order.asc,created_at.desc"
        )
        return products
    except Exception as e:
        print(f"Error fetching products: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/products")
async def admin_create_product(req: ProductCreate):
    """Create a new product"""
    try:
        # Generate slug from name if not provided
        slug = req.slug
        if not slug:
            import re
            # Transliterate Russian to English for slug
            translit_map = {
                'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
                'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
                'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
                'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
                'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
            }
            slug = req.name.lower()
            for ru, en in translit_map.items():
                slug = slug.replace(ru, en)
            slug = re.sub(r'[^a-z0-9]+', '-', slug).strip('-')

        product_data = {
            "name": req.name,
            "description": req.description,
            "category": req.category,
            "image_url": req.image_url,
            "gallery_urls": req.gallery_urls or [],
            "price_silver": req.price_silver,
            "price_gold": req.price_gold,
            "sizes_available": req.sizes_available or ["s", "m", "l"],
            "is_available": req.is_available,
            "stock_count": req.stock_count,
            "display_order": req.display_order,
            "is_featured": req.is_featured,
            "slug": slug,
        }

        product = await supabase.insert("products", product_data)
        return {"success": True, "product": product}
    except Exception as e:
        print(f"Error creating product: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/admin/products/{product_id}")
async def admin_update_product(product_id: str, req: ProductUpdate):
    """Update a product"""
    try:
        # Check product exists
        existing = await supabase.select_one("products", product_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Product not found")

        updates = req.model_dump(exclude_unset=True)
        if not updates:
            raise HTTPException(status_code=400, detail="No updates provided")

        product = await supabase.update("products", product_id, updates)
        return {"success": True, "product": product}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating product: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/admin/products/{product_id}")
async def admin_delete_product(product_id: str):
    """Delete a product"""
    try:
        existing = await supabase.select_one("products", product_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Product not found")

        await supabase.delete("products", product_id)
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting product: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== GEM MANAGEMENT ENDPOINTS ==============

class GemShape(str):
    ROUND = "round"
    OVAL = "oval"
    SQUARE = "square"
    MARQUISE = "marquise"
    PEAR = "pear"
    HEART = "heart"


class CreateGemRequest(BaseModel):
    name: str  # e.g., "Рубин", "Сапфир"
    name_en: Optional[str] = None  # English name
    shape: str = "round"  # round, oval, square, marquise, pear, heart
    size_mm: float = 1.5  # Size in millimeters
    color: str  # Hex color for fallback, e.g., "#E31C25"
    image_base64: Optional[str] = None  # Base64 encoded image
    remove_background: bool = True  # Auto-remove background
    bg_tolerance: int = 30  # Background removal tolerance
    is_active: bool = True
    sort_order: int = 0


class UpdateGemRequest(BaseModel):
    name: Optional[str] = None
    name_en: Optional[str] = None
    shape: Optional[str] = None
    size_mm: Optional[float] = None
    color: Optional[str] = None
    image_base64: Optional[str] = None
    remove_background: Optional[bool] = True
    bg_tolerance: Optional[int] = 30
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


@router.get("/gems")
async def get_gems():
    """Get all active gems for the gem constructor"""
    try:
        gems = await supabase.select(
            "gems",
            order="sort_order.asc,name.asc"
        )
        # Filter active gems
        active_gems = [g for g in gems if g.get("is_active", True)]
        return {"gems": active_gems}
    except Exception as e:
        print(f"Error getting gems: {e}")
        return {"gems": []}


@router.get("/admin/gems")
async def admin_get_gems():
    """Get all gems (including inactive) for admin"""
    try:
        gems = await supabase.select(
            "gems",
            order="sort_order.asc,name.asc"
        )
        return {"gems": gems or []}
    except Exception as e:
        print(f"Error getting gems: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/gems")
async def admin_create_gem(req: CreateGemRequest):
    """Create a new gem type"""
    import traceback
    from app_logger import logger

    try:
        gem_id = str(uuid.uuid4())
        image_url = None

        await logger.info("gem_upload", f"Creating gem: {req.name}", {
            "gem_id": gem_id,
            "shape": req.shape,
            "has_image": bool(req.image_base64),
            "remove_bg": req.remove_background
        })

        # Process and upload image if provided
        if req.image_base64:
            import base64

            # Decode base64
            try:
                if "," in req.image_base64:
                    image_data = base64.b64decode(req.image_base64.split(",")[1])
                else:
                    image_data = base64.b64decode(req.image_base64)
                await logger.debug("gem_upload", f"Image decoded", {"size_bytes": len(image_data)})
            except Exception as decode_err:
                await logger.error("gem_upload", "Base64 decode failed", {"error": str(decode_err)})
                raise HTTPException(status_code=400, detail=f"Invalid image data: {decode_err}")

            # Upload with background removal
            try:
                path = f"gems/{gem_id}.png"
                await logger.debug("gem_upload", f"Uploading to storage", {
                    "path": path,
                    "remove_bg": req.remove_background,
                    "tolerance": req.bg_tolerance
                })
                image_url = await supabase.upload_gem_image(
                    bucket="images",
                    path=path,
                    image_data=image_data,
                    remove_bg=req.remove_background,
                    max_size=400,
                    bg_tolerance=req.bg_tolerance
                )
                await logger.info("gem_upload", "Upload successful", {"image_url": image_url})
            except Exception as upload_err:
                await logger.exception("gem_upload", "Upload failed", upload_err)
                raise HTTPException(status_code=500, detail=f"Image upload failed: {upload_err}")

        gem_data = {
            "id": gem_id,
            "name": req.name,
            "name_en": req.name_en or req.name.lower(),
            "shape": req.shape,
            "size_mm": req.size_mm,
            "color": req.color,
            "image_url": image_url,
            "is_active": req.is_active,
            "sort_order": req.sort_order,
        }

        await supabase.insert("gems", gem_data)
        await logger.info("gem_upload", f"Gem created successfully: {req.name}", {"gem_id": gem_id})

        return {"success": True, "gem": gem_data}

    except HTTPException:
        raise
    except Exception as e:
        await logger.exception("gem_upload", "Unexpected error creating gem", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/admin/gems/{gem_id}")
async def admin_update_gem(gem_id: str, req: UpdateGemRequest):
    """Update a gem type"""
    from app_logger import logger

    try:
        gem = await supabase.select_one("gems", gem_id)
        if not gem:
            await logger.warning("gem_update", f"Gem not found: {gem_id}")
            raise HTTPException(status_code=404, detail="Камень не найден")

        await logger.info("gem_update", f"Updating gem: {gem.get('name')}", {
            "gem_id": gem_id,
            "has_new_image": bool(req.image_base64)
        })

        updates = {}

        if req.name is not None:
            updates["name"] = req.name
        if req.name_en is not None:
            updates["name_en"] = req.name_en
        if req.shape is not None:
            updates["shape"] = req.shape
        if req.size_mm is not None:
            updates["size_mm"] = req.size_mm
        if req.color is not None:
            updates["color"] = req.color
        if req.is_active is not None:
            updates["is_active"] = req.is_active
        if req.sort_order is not None:
            updates["sort_order"] = req.sort_order

        # Process new image if provided
        if req.image_base64:
            import base64

            try:
                if "," in req.image_base64:
                    image_data = base64.b64decode(req.image_base64.split(",")[1])
                else:
                    image_data = base64.b64decode(req.image_base64)
                await logger.debug("gem_update", "Image decoded", {"size_bytes": len(image_data)})
            except Exception as decode_err:
                await logger.error("gem_update", "Base64 decode failed", {"error": str(decode_err)})
                raise HTTPException(status_code=400, detail=f"Invalid image data: {decode_err}")

            try:
                path = f"gems/{gem_id}.png"
                remove_bg = req.remove_background if req.remove_background is not None else True
                tolerance = req.bg_tolerance if req.bg_tolerance is not None else 30

                await logger.debug("gem_update", "Uploading to storage", {
                    "path": path,
                    "remove_bg": remove_bg,
                    "tolerance": tolerance
                })

                image_url = await supabase.upload_gem_image(
                    bucket="images",
                    path=path,
                    image_data=image_data,
                    remove_bg=remove_bg,
                    max_size=400,
                    bg_tolerance=tolerance
                )
                updates["image_url"] = image_url
                await logger.info("gem_update", "Upload successful", {"image_url": image_url})
            except Exception as upload_err:
                await logger.exception("gem_update", "Upload failed", upload_err)
                raise HTTPException(status_code=500, detail=f"Image upload failed: {upload_err}")

        if updates:
            await logger.debug("gem_update", f"Updating database", {"fields": list(updates.keys())})
            await supabase.update("gems", gem_id, updates)

        updated_gem = await supabase.select_one("gems", gem_id)
        await logger.info("gem_update", f"Gem updated successfully: {updated_gem.get('name')}", {"gem_id": gem_id})
        return {"success": True, "gem": updated_gem}

    except HTTPException:
        raise
    except Exception as e:
        await logger.exception("gem_update", "Unexpected error updating gem", e, {"gem_id": gem_id})
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/admin/gems/{gem_id}")
async def admin_delete_gem(gem_id: str):
    """Delete a gem type"""
    try:
        gem = await supabase.select_one("gems", gem_id)
        if not gem:
            raise HTTPException(status_code=404, detail="Камень не найден")

        await supabase.delete("gems", gem_id)
        return {"success": True}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting gem: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Gem shapes reference
GEM_SHAPES = [
    {"value": "round", "label": "Круглый", "label_en": "Round"},
    {"value": "oval", "label": "Овальный", "label_en": "Oval"},
    {"value": "square", "label": "Квадратный", "label_en": "Square"},
    {"value": "marquise", "label": "Маркиз", "label_en": "Marquise"},
    {"value": "pear", "label": "Груша", "label_en": "Pear"},
    {"value": "heart", "label": "Сердце", "label_en": "Heart"},
]


@router.get("/gems/shapes")
async def get_gem_shapes():
    """Get available gem shapes"""
    return {"shapes": GEM_SHAPES}


# ============== LOGS ENDPOINTS ==============

@router.get("/logs")
async def get_logs(
    limit: int = 100,
    level: Optional[str] = None,
    source: Optional[str] = None
):
    """
    Get application logs for debugging.

    Query params:
    - limit: Max number of logs to return (default 100)
    - level: Filter by level (debug, info, warning, error)
    - source: Filter by source (gem_upload, generation, payment, etc.)

    Example: GET /api/logs?limit=50&level=error&source=gem_upload
    """
    try:
        # Build filter string for Supabase REST API
        filters = []
        if level:
            filters.append(f"level=eq.{level}")
        if source:
            filters.append(f"source=eq.{source}")

        filter_str = "&".join(filters) if filters else ""

        logs = await supabase.select(
            "app_logs",
            order="created_at.desc",
            limit=limit,
            filters=filter_str
        )

        return {
            "logs": logs or [],
            "count": len(logs) if logs else 0,
            "filters": {"level": level, "source": source, "limit": limit}
        }
    except Exception as e:
        # If app_logs table doesn't exist yet, return helpful message
        print(f"Error getting logs: {e}")
        error_msg = str(e)
        if "app_logs" in error_msg.lower() or "does not exist" in error_msg.lower():
            return {
                "logs": [],
                "count": 0,
                "error": "Table app_logs not found. Run migration: backend/migrations/003_create_logs_table.sql"
            }
        return {"logs": [], "count": 0, "error": error_msg}


@router.post("/logs")
async def create_log(level: str = "info", source: str = "manual", message: str = "test"):
    """Create a test log entry (for debugging)."""
    try:
        from app_logger import logger
        await logger._log(level, source, message, {"manual": True})
        return {"success": True, "message": "Log created"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/logs/init")
async def init_logs_table():
    """
    Initialize the app_logs table in Supabase.
    Call this once to create the logging infrastructure.
    """
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS app_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        level VARCHAR(20) NOT NULL DEFAULT 'info',
        source VARCHAR(100),
        message TEXT NOT NULL,
        details JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_app_logs_created_at ON app_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_app_logs_level ON app_logs(level);
    CREATE INDEX IF NOT EXISTS idx_app_logs_source ON app_logs(source);
    """

    # Try multiple methods to create the table
    methods_tried = []

    # Method 1: Try direct insert to check if table exists
    try:
        test_log = {
            "level": "info",
            "source": "system",
            "message": "Logs table initialized",
            "details": {"init": True}
        }
        await supabase.insert("app_logs", test_log)
        return {
            "success": True,
            "message": "Table already exists and is working",
            "method": "table_exists"
        }
    except Exception as e:
        error_str = str(e).lower()
        if "does not exist" not in error_str and "relation" not in error_str:
            # Some other error
            methods_tried.append({"method": "insert_test", "error": str(e)})
        else:
            methods_tried.append({"method": "insert_test", "result": "table does not exist"})

    # Method 2: Try SQL execution via RPC
    try:
        result = await supabase.execute_sql(create_table_sql)
        if result.get("success"):
            return {
                "success": True,
                "message": "Table created via SQL execution",
                "method": "execute_sql"
            }
        methods_tried.append({"method": "execute_sql", "result": result})
    except Exception as e:
        methods_tried.append({"method": "execute_sql", "error": str(e)})

    # If all methods failed, return instructions
    return {
        "success": False,
        "message": "Could not auto-create table. Please run SQL manually in Supabase.",
        "methods_tried": methods_tried,
        "sql_to_run": create_table_sql,
        "instructions": "Go to Supabase Dashboard → SQL Editor → New Query → Paste the SQL above → Run"
    }


@router.post("/payments/migrate-url")
async def migrate_payments_url():
    """
    Test that payments table has payment_url column.
    If not, need to add it via Supabase SQL Editor.
    """
    try:
        # Try to select with payment_url column
        payments = await supabase.select("payments", order="created_at.desc", limit=1)
        has_url_column = any("payment_url" in p for p in payments) if payments else True
        return {
            "success": True,
            "has_payment_url_column": has_url_column,
            "note": "If payment_url is missing, run: ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_url TEXT;"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "sql_to_run": "ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_url TEXT;"
        }


@router.post("/gems/migrate-description")
async def migrate_gems_description():
    """
    Add description column to gems table and populate default values.
    Call this once to add semantic descriptions to gems.
    """
    descriptions = {
        "ruby": "Символ страсти, энергии и любви. Привлекает удачу и защищает от негатива.",
        "sapphire": "Камень мудрости и ясности ума. Помогает сосредоточиться и принять верное решение.",
        "emerald": "Символ надежды и обновления. Приносит гармонию и душевный покой.",
    }

    results = []

    # Try to update each gem with description
    for name_en, description in descriptions.items():
        try:
            # Find gem by name_en
            gems = await supabase.select("gems", filters={"name_en": name_en})
            if gems:
                gem_id = gems[0]["id"]
                await supabase.update("gems", gem_id, {"description": description})
                results.append({"name_en": name_en, "status": "updated"})
            else:
                results.append({"name_en": name_en, "status": "not_found"})
        except Exception as e:
            results.append({"name_en": name_en, "status": "error", "error": str(e)})

    return {
        "success": True,
        "message": "Migration completed",
        "results": results,
        "note": "If 'description' column doesn't exist, run: ALTER TABLE gems ADD COLUMN IF NOT EXISTS description TEXT;"
    }
