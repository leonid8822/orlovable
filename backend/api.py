from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from sqlalchemy.orm import Session
from database import SessionLocal
import models
from pydantic import BaseModel
import os
import requests
import json
import time
import uuid

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class GenerateRequest(BaseModel):
    imageBase64: Optional[str] = None
    prompt: Optional[str] = None
    formFactor: str = 'round'
    size: str = 'pendant'
    material: str = 'silver'
    sessionId: Optional[str] = None
    applicationId: Optional[str] = None

class ApplicationCreate(BaseModel):
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    form_factor: str = 'round'
    material: str = 'gold'
    size: str = 'pendant'
    input_image_url: Optional[str] = None
    user_comment: Optional[str] = None

class ApplicationUpdate(BaseModel):
    status: Optional[str] = None
    generated_preview: Optional[str] = None
    input_image_url: Optional[str] = None
    user_comment: Optional[str] = None
    form_factor: Optional[str] = None
    size: Optional[str] = None

class SettingsUpdate(BaseModel):
    num_images: Optional[int] = None
    main_prompt: Optional[str] = None
    main_prompt_no_image: Optional[str] = None
    form_factors: Optional[dict] = None
    sizes: Optional[dict] = None

@router.get("/settings")
async def get_settings(db: Session = Depends(get_db)):
    # Try to fetch from DB
    settings_kv = db.query(models.GenerationSettings).all()
    
    defaults = {
        "num_images": 4, 
        "main_prompt": "",
        "main_prompt_no_image": "",
        "form_factors": {
            "round": {"label": "Круглый кулон", "addition": "Объект вписан в круглую рамку-медальон."},
            "contour": {"label": "Контурный кулон", "addition": ""}
        },
        "sizes": {
            "bracelet": {"label": "В браслет", "dimensions": "11мм, толщина 2мм"},
            "pendant": {"label": "В кулон", "dimensions": "25мм, толщина 3мм"},
            "interior": {"label": "В интерьер", "dimensions": "40мм, толщина 3мм"}
        }
    }

    if not settings_kv:
        return defaults

    result = defaults.copy()
    for item in settings_kv:
        if item.key == 'num_images':
            try:
                 result['num_images'] = int(item.value)
            except:
                 pass
        elif item.key == 'form_factors' and isinstance(item.value, dict):
            result['form_factors'] = item.value
        elif item.key == 'sizes' and isinstance(item.value, dict):
            result['sizes'] = item.value
        elif item.key in ['main_prompt', 'main_prompt_no_image']:
            result[item.key] = str(item.value)
            
    return result

@router.post("/settings")
async def update_settings(updates: SettingsUpdate, db: Session = Depends(get_db)):
    # Helper to update or create setting
    def set_val(key, val):
        if val is None: return
        setting = db.query(models.GenerationSettings).filter(models.GenerationSettings.key == key).first()
        if not setting:
            setting = models.GenerationSettings(key=key, value=val)
            db.add(setting)
        else:
            setting.value = val
    
    set_val('num_images', updates.num_images)
    set_val('main_prompt', updates.main_prompt)
    set_val('main_prompt_no_image', updates.main_prompt_no_image)
    if updates.form_factors:
        set_val('form_factors', updates.form_factors)
    if updates.sizes:
        set_val('sizes', updates.sizes)
        
    db.commit()
    return {"success": True}

@router.get("/applications")
async def list_applications(user_id: Optional[str] = None, limit: int = 20, db: Session = Depends(get_db)):
    query = db.query(models.Application)
    if user_id:
        query = query.filter(models.Application.user_id == user_id)
    
    apps = query.order_by(models.Application.created_at.desc()).limit(limit).all()
    return apps

@router.post("/applications")
async def create_application(app: ApplicationCreate, db: Session = Depends(get_db)):
    db_app = models.Application(
        id=str(uuid.uuid4()),
        session_id=app.session_id,
        user_id=app.user_id,
        form_factor=app.form_factor,
        material=app.material,
        size=app.size,
        input_image_url=app.input_image_url,
        user_comment=app.user_comment,
        status='pending_generation'
    )
    db.add(db_app)
    db.commit()
    db.refresh(db_app)
    return db_app

@router.get("/applications/{app_id}")
async def get_application(app_id: str, db: Session = Depends(get_db)):
    app = db.query(models.Application).filter(models.Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app

@router.patch("/applications/{app_id}")
async def update_application(app_id: str, updates: ApplicationUpdate, db: Session = Depends(get_db)):
    app = db.query(models.Application).filter(models.Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    update_data = updates.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(app, key, value)
    
    db.commit()
    db.refresh(app)
    return app

@router.get("/history")
async def get_history(limit: int = 20, db: Session = Depends(get_db)):
    generations = db.query(models.PendantGeneration).order_by(models.PendantGeneration.created_at.desc()).limit(limit).all()
    # Ensure generated images are list
    return generations



# Cost constants (fal.ai seedream v4 pricing)
COST_PER_IMAGE_CENTS = 3

@router.post("/generate")
async def generate_pendant(req: GenerateRequest, db: Session = Depends(get_db)):
    start_time = time.time()
    
    fal_key = os.environ.get("FAL_KEY")
    if not fal_key:
        raise HTTPException(status_code=500, detail="FAL_KEY is not configured")

    # Load settings from DB or defaults
    # For simplicity, we'll use defaults if DB is empty, effectively hardcoding the logic from the TS file
    # In a full prod app, we'd query models.GenerationSettings
    
    defaults = {
        "num_images": 4,
        "main_prompt": "",
        "main_prompt_no_image": "",
        "form_factors": {
            "round": {"label": "Круглый кулон", "addition": "Объект вписан в круглую рамку-медальон."},
            "contour": {"label": "Контурный кулон", "addition": ""}
        },
        "sizes": {
            "bracelet": {"label": "В браслет", "dimensions": "11мм, толщина 2мм"},
            "pendant": {"label": "В кулон", "dimensions": "25мм, толщина 3мм"},
            "interior": {"label": "В интерьер", "dimensions": "40мм, толщина 3мм"}
        }
    }
    
    # Merge DB settings if they existed (skipped for MVP speed, can be added later)
    settings = defaults

    num_images = settings["num_images"]
    
    has_image = req.imageBase64 and len(req.imageBase64) > 0
    print(f"Starting pendant generation. Has image: {has_image}, Form: {req.formFactor}")

    # Logic to build prompt
    size_config = settings["sizes"].get(req.size, settings["sizes"]["pendant"])
    size_dimensions = size_config.get("dimensions", "25мм, толщина 3мм")
    
    form_config = settings["form_factors"].get(req.formFactor, settings["form_factors"]["round"])
    form_addition = form_config.get("addition", "")
    
    if req.formFactor == 'round':
        form_shape = f"круглая форма, объект вписан в круг, размер {size_dimensions}"
    else:
        form_shape = f"по контуру выбранного объекта, размер {size_dimensions}"

    # Build prompt
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
        response = requests.post(model_url, json=request_body, headers=headers)
        response.raise_for_status()
        result = response.json()
        
        image_urls = []
        
        # Poll for results
        if "request_id" in result and "status_url" in result:
            attempts = 0
            max_attempts = 120
            
            while attempts < max_attempts:
                time.sleep(2)
                status_res = requests.get(result["status_url"], headers={"Authorization": f"Key {fal_key}"})
                status_data = status_res.json()
                
                print(f"Status: {status_data.get('status')}, attempt: {attempts}")
                
                if status_data.get("status") == "COMPLETED":
                    result_res = requests.get(result["response_url"], headers={"Authorization": f"Key {fal_key}"})
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
            
        execution_time_ms = int((time.time() - start_time) * 1000)
        cost_cents = len(image_urls) * COST_PER_IMAGE_CENTS
        
        # Save to DB
        db_gen = models.PendantGeneration(
            id=str(uuid.uuid4()),
            input_image_url=req.imageBase64[:500] + "..." if has_image and req.imageBase64 else None,
            user_comment=req.prompt,
            form_factor=req.formFactor,
            material=req.material,
            size=req.size,
            output_images=image_urls,
            prompt_used=pendant_prompt,
            cost_cents=cost_cents,
            model_used=model_name,
            session_id=req.sessionId,
            application_id=req.applicationId,
            execution_time_ms=execution_time_ms
        )
        db.add(db_gen)
        
        # Update application if exists
        if req.applicationId:
             app = db.query(models.Application).filter(models.Application.id == req.applicationId).first()
             if app:
                 app.status = 'generated'
                 app.generated_preview = image_urls[0]
                 db.add(app)
        
        db.commit()
        db.refresh(db_gen)
        
        return {
            "success": True,
            "images": image_urls,
            "prompt": pendant_prompt,
            "generationId": db_gen.id,
            "costCents": cost_cents,
            "executionTimeMs": execution_time_ms
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
