# OLAI.ART - Jewelry Customization Platform

## Инструкции для Claude (ОБЯЗАТЕЛЬНО К ИСПОЛНЕНИЮ)

### Автономные действия - НЕ СПРАШИВАТЬ РАЗРЕШЕНИЯ:

1. **Деплой бэкенда**: После завершения работы над кодом - сразу мерджить в main и пушить. Render задеплоит автоматически.
   ```bash
   git checkout main && git merge <feature-branch> && git push origin main
   ```

2. **Деплой фронтенда**: Использовать Vercel deploy hook:
   ```bash
   curl -X POST "https://api.vercel.com/v1/integrations/deploy/prj_8msyhjERk6BWBdBSdKJDDxHjNJrq/DXSjiKoltz"
   ```

3. **ОБЯЗАТЕЛЬНО после каждого деплоя**: Проверить версию API и запустить smoke tests:
   ```bash
   # 1. Проверить что API доступен
   curl -s "https://olai.onrender.com/" | python3 -m json.tool

   # 2. Запустить smoke tests (ОБЯЗАТЕЛЬНО!)
   cd backend && python3 scripts/smoke_tests.py --e2e

   # Или через shell скрипт
   ./backend/scripts/run_smoke_tests.sh --e2e
   ```

3. **Создание таблиц в Supabase**: Использовать API эндпоинт:
   ```bash
   curl -X POST "https://olai.onrender.com/api/logs/init"
   ```

4. **Проверка логов на проде**: Использовать API:
   ```bash
   # Все логи
   curl "https://olai.onrender.com/api/logs"

   # Только ошибки
   curl "https://olai.onrender.com/api/logs?level=error"

   # По источнику
   curl "https://olai.onrender.com/api/logs?source=gem_upload"
   ```

5. **Проверка настроек**:
   ```bash
   curl "https://olai.onrender.com/api/settings"
   ```

6. **Сброс настроек к дефолтам**:
   ```bash
   curl -X POST "https://olai.onrender.com/api/settings/reset"
   ```

7. **Запуск smoke tests на проде** (ОБЯЗАТЕЛЬНО после деплоя):
   ```bash
   # Базовые тесты (быстрые)
   cd backend && python3 scripts/smoke_tests.py

   # С E2E тестом (dry run, бесплатно)
   cd backend && python3 scripts/smoke_tests.py --e2e

   # Полный E2E тест (СТОИТ ДЕНЕГ! ~12 центов)
   cd backend && python3 scripts/smoke_tests.py --e2e --full

   # Через shell скрипт
   ./backend/scripts/run_smoke_tests.sh --e2e
   ```

   Проверяемые компоненты:
   - ✅ Health Check - API доступен
   - ✅ Settings - настройки загружаются
   - ✅ Gems Library - библиотека камней
   - ✅ Examples Gallery - галерея примеров (API + статика)
   - ✅ Logs System - система логирования
   - ✅ Generation Settings - настройки генерации
   - ✅ E2E Generation - полный флоу заявки (опционально)

8. **Автоматические тесты после деплоя**: Запускать smoke tests ВРУЧНУЮ после каждого деплоя (см. п.3). GitHub Actions НЕ настроен.

### Принципы работы:
- **Делать сразу, не спрашивать** - если задача понятна, выполнять без подтверждения
- **Деплоить автоматически** - после изменений сразу деплоить на прод
- **Проверять логи самостоятельно** - при ошибках смотреть логи через API
- **Создавать таблицы через API** - не просить пользователя запускать SQL

---

## Project Overview

**OLAI.ART** - full-stack платформа для кастомизации ювелирных изделий с AI-генерацией. Пользователи загружают рисунки, фото или описания, а AI генерирует превью кулонов/браслетов, которые затем изготавливаются из золота или серебра методом 3D-печати.

**Production URL**: https://olai.art
**Backend API**: https://olai.onrender.com/api (configured via VITE_API_URL)

---

## Tech Stack

### Frontend
| Технология | Версия | Назначение |
|------------|--------|------------|
| React | 18.3.1 | UI фреймворк |
| TypeScript | 5.8.3 | Типизация |
| Vite | 5.4.19 | Сборка (SWC plugin) |
| TailwindCSS | 3.4.17 | Стили |
| shadcn/ui | - | UI компоненты (50+ Radix primitives) |
| React Query | 5.83.0 | Server state management |
| React Hook Form | 7.61.1 | Формы |
| Zod | 3.25.76 | Валидация |
| Three.js | 0.170.0 | 3D рендеринг |
| React Three Fiber | 8.18.0 | React-обертка для Three.js |
| React Router DOM | 6.30.1 | Роутинг (BrowserRouter) |
| Supabase JS | 2.86.0 | Database client |
| date-fns | - | Date handling с Russian locale |
| Embla Carousel | - | Карусели |
| Sonner | - | Toast notifications |

### Backend
| Технология | Версия | Назначение |
|------------|--------|------------|
| FastAPI | 0.111.0 | Web framework |
| Python | 3.9 | Runtime |
| SQLAlchemy | 2.0.30 | ORM (legacy, используется Supabase) |
| Pydantic | 2.7.4 | Валидация данных |
| Uvicorn | 0.30.1 | ASGI server |
| httpx | 0.27.0 | Async HTTP client |
| Pillow | 10.4.0 | Image processing |

### Infrastructure
| Компонент | Сервис | Назначение |
|-----------|--------|------------|
| Frontend Hosting | Vercel | Static SPA, auto-deploy |
| Backend | Render | Auto-deploy from main |
| Database | Supabase (PostgreSQL) | DB + Storage |
| AI Generation | FAL.ai | Bytedance SeedDream v4 |
| Payments | Tinkoff Acquiring | Russian payment processor |
| Images | Supabase Storage | Cloud storage |

---

## Deployment

**ВАЖНО: Backend деплоится АВТОМАТИЧЕСКИ из ветки `main` через Render.**

```bash
# Frontend -> Vercel (Deploy Hook - ПРЕДПОЧТИТЕЛЬНЫЙ СПОСОБ)
curl -X POST "https://api.vercel.com/v1/integrations/deploy/prj_8msyhjERk6BWBdBSdKJDDxHjNJrq/DXSjiKoltz"

# Frontend -> Vercel (альтернативный способ через CLI)
cd frontend && vercel --prod --yes --token $(grep VERCEL_TOKEN ../secrets/.env | cut -d'=' -f2)

# Backend -> Render (АВТОМАТИЧЕСКИ!)
# Просто merge в main и Render задеплоит автоматически
```

### Render Environment Variables
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `FAL_KEY`
- `TINKOFF_TERMINAL_KEY`
- `TINKOFF_PASSWORD`

---

## Project Structure

```
.
├── frontend/                           # React SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                    # shadcn/ui (~50 компонентов)
│   │   │   ├── steps/                 # 7-шаговый wizard
│   │   │   │   ├── StepUpload.tsx     # Загрузка + выбор размера
│   │   │   │   ├── StepGenerating.tsx # Генерация с лоадером
│   │   │   │   ├── StepSelection.tsx  # Выбор варианта
│   │   │   │   ├── StepGems.tsx       # Размещение камней
│   │   │   │   ├── StepEngraving.tsx  # Гравировка на обороте
│   │   │   │   ├── StepCheckout.tsx   # Оплата
│   │   │   │   └── StepConfirmation.tsx # Подтверждение
│   │   │   ├── admin/                 # Админ-панель
│   │   │   │   ├── GemsTab.tsx        # Управление камнями
│   │   │   │   ├── ClientsTab.tsx     # Управление клиентами
│   │   │   │   ├── ClientCard.tsx
│   │   │   │   ├── ClientForm.tsx
│   │   │   │   ├── ClientSelector.tsx
│   │   │   │   ├── PaymentsTab.tsx    # История платежей
│   │   │   │   ├── ExamplesTab.tsx    # Галерея
│   │   │   │   ├── VariantsTab.tsx    # Промпты
│   │   │   │   └── InvoiceForm.tsx
│   │   │   ├── Header.tsx             # Навигация + выбор темы
│   │   │   ├── Footer.tsx
│   │   │   ├── StepIndicator.tsx      # Индикатор прогресса
│   │   │   ├── ImageUploader.tsx      # Drag-drop загрузка
│   │   │   ├── PendantPreview.tsx
│   │   │   ├── PendantOnNeck.tsx      # Визуализация на шее
│   │   │   ├── MeasuringRuler.tsx     # Линейка размера
│   │   │   └── BeforeAfterShowcase.tsx
│   │   ├── pages/
│   │   │   ├── Landing.tsx            # Главный лендинг (/)
│   │   │   ├── KidsLanding.tsx        # Детская тема (/kids)
│   │   │   ├── TotemsLanding.tsx      # Тотемы (/totems)
│   │   │   ├── CustomLanding.tsx      # 3D объекты (/custom)
│   │   │   ├── Application.tsx        # Workflow (/application/:id)
│   │   │   ├── Admin.tsx              # Админка (/admin)
│   │   │   ├── Auth.tsx               # Авторизация (/auth)
│   │   │   ├── Profile.tsx            # Профиль (/profile)
│   │   │   ├── PaymentSuccess.tsx     # Успешная оплата
│   │   │   ├── PaymentFail.tsx        # Ошибка оплаты
│   │   │   ├── Oferta.tsx             # Оферта
│   │   │   ├── Privacy.tsx            # Политика приватности
│   │   │   └── NotFound.tsx           # 404
│   │   ├── contexts/
│   │   │   ├── ThemeContext.tsx       # 4 темы (main/kids/totems/custom)
│   │   │   └── SettingsContext.tsx    # Настройки с бэкенда
│   │   ├── types/
│   │   │   └── pendant.ts             # Domain types (~312 строк)
│   │   ├── lib/
│   │   │   ├── api.ts                 # API client (~600 строк)
│   │   │   └── utils.ts               # cn() и утилиты
│   │   ├── hooks/
│   │   │   ├── use-toast.ts
│   │   │   └── use-mobile.tsx
│   │   ├── integrations/supabase/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── tailwind.config.ts
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                            # FastAPI Python
│   ├── main.py                        # App setup, CORS
│   ├── api.py                         # API endpoints (~2300 строк)
│   ├── models.py                      # SQLAlchemy models
│   ├── database.py                    # DB connection
│   ├── supabase_client.py             # Supabase wrapper (~370 строк)
│   ├── tinkoff_payment.py             # Payment integration (~230 строк)
│   ├── email_service.py               # Email sending
│   ├── s3_utils.py                    # Image processing
│   ├── Dockerfile
│   ├── render.yaml
│   ├── requirements.txt
│   ├── .env.example
│   ├── migrations/
│   │   ├── 001_create_users_table.sql
│   │   ├── 002_create_payments_table.sql
│   │   └── create_gems_table.sql
│   └── scripts/
│       ├── deploy_backend.py
│       ├── migrate_csv.py
│       └── migrate_to_postgres.py
│
└── CLAUDE.md
```

---

## Commands

### Frontend
```bash
cd frontend

npm install              # Установка зависимостей
npm run dev              # Dev server на http://localhost:8080
npm run build            # Production build -> dist/
npm run build:dev        # Development build
npm run lint             # ESLint проверка
npm run preview          # Preview production build
```

### Backend
```bash
cd backend

# Локальная разработка
python main.py           # Uvicorn с auto-reload

# Production
uvicorn main:app --host 0.0.0.0 --port 8080

# Docker
docker build -t jewelry-backend .
docker run -p 8080:8080 \
  -e FAL_KEY=xxx \
  -e SUPABASE_URL=xxx \
  -e SUPABASE_SERVICE_KEY=xxx \
  -e TINKOFF_TERMINAL_KEY=xxx \
  -e TINKOFF_PASSWORD=xxx \
  jewelry-backend
```

---

## Environment Variables

### Backend (.env)
```bash
# Database (Supabase)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=your_service_key

# AI Generation
FAL_KEY=your_fal_ai_key

# Payments (Tinkoff)
TINKOFF_TERMINAL_KEY=your_terminal_key
TINKOFF_PASSWORD=your_password
```

### Frontend
API URL настраивается через переменную окружения в Vercel:
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
```
На проде: `VITE_API_URL=https://olai.onrender.com/api`

---

## Domain Types

### AppStep (7-шаговый workflow)
```typescript
enum AppStep {
  UPLOAD = 'UPLOAD',           // Загрузка + размер
  GENERATING = 'GENERATING',   // AI генерация
  SELECTION = 'SELECTION',     // Выбор варианта
  GEMS = 'GEMS',               // Размещение камней (опционально)
  ENGRAVING = 'ENGRAVING',     // Гравировка (опционально)
  CHECKOUT = 'CHECKOUT',       // Оплата
  CONFIRMATION = 'CONFIRMATION' // Подтверждение заказа
}
```

### SizeOption
| Size | Silver | Gold | Form Factor | API Size |
|------|--------|------|-------------|----------|
| `s` | 13mm | 10mm | round | bracelet |
| `m` | 19mm | 13mm | oval | pendant |
| `l` | 25mm | 19mm | contour | interior |

### FormFactor
| Value | Label | Description |
|-------|-------|-------------|
| `round` | Круглый | Женский круглый кулон |
| `oval` | Жетон | Мужской жетон |
| `contour` | Контурный | По контуру изображения |

### Material
| Value | Label | Status |
|-------|-------|--------|
| `silver` | Серебро 925 | Active |
| `gold` | Золото 585 | Soon (disabled) |

### Theme
| Theme | Color | Description |
|-------|-------|-------------|
| `main` | Gold (hsl 43, 74%, 45%) | Luxury default |
| `kids` | Tiffany blue (hsl 174, 58%, 38%) | Children's art |
| `totems` | Brown (hsl 25, 45%, 35%) | Spiritual symbols |
| `custom` | Purple (hsl 270, 50%, 45%) | 3D objects |

### PendantConfig (Frontend)
```typescript
interface PendantConfig {
  image: File | null
  generatedImages: string[]
  comment: string
  sizeOption: 's' | 'm' | 'l'
  formFactor: 'round' | 'oval' | 'contour'
  material: 'silver' | 'gold'
  gems: GemPlacement[]
  backEngraving: string
  userAuth: UserAuthData
}

interface GemPlacement {
  id: string
  gemId: string
  x: number  // 0-100 percentage
  y: number
}
```

---

## Database Models (Supabase)

### gems
```sql
id: uuid PRIMARY KEY
name: varchar(255)           -- Russian name
name_en: varchar(255)        -- English name
shape: varchar(50)           -- round, oval, square, marquise, pear, heart
size_mm: decimal(3,1)        -- 0.5-5mm
color: varchar(7)            -- Hex color (#FF0000)
image_url: text              -- Image with transparent bg
is_active: boolean DEFAULT true
created_at: timestamp
updated_at: timestamp
```

### users
```sql
id: uuid PRIMARY KEY
email: varchar(255) UNIQUE
name: varchar(255)
telegram: varchar(255)
is_admin: boolean DEFAULT false
created_at: timestamp
```

### applications
```sql
id: uuid PRIMARY KEY
user_id: uuid               -- FK to users (optional)
session_id: varchar(255)    -- Anonymous session
current_step: int
status: varchar(50)         -- draft, generating, generated, paid
form_factor: varchar(50)
material: varchar(50)
size: varchar(50)
input_image_url: text
user_comment: text
generated_preview: text     -- Selected variant URL
gems_config: jsonb          -- Array of GemPlacement
back_engraving: text
created_at: timestamp
updated_at: timestamp
```

### pendant_generations
```sql
id: uuid PRIMARY KEY
application_id: uuid        -- FK to applications
session_id: varchar(255)
input_image_url: text
user_comment: text
form_factor: varchar(50)
material: varchar(50)
size: varchar(50)
output_images: jsonb        -- Array of URLs
prompt_used: text
cost_cents: int             -- 3 cents per image
model_used: varchar(100)
execution_time_ms: int
created_at: timestamp
```

### payments
```sql
id: uuid PRIMARY KEY
user_id: uuid               -- FK to users
application_id: uuid        -- FK to applications
tinkoff_payment_id: varchar(255)
amount: int                 -- Amount in kopecks
status: varchar(50)         -- NEW, CONFIRMED, CANCELED, etc.
created_at: timestamp
updated_at: timestamp
```

### examples
```sql
id: uuid PRIMARY KEY
title: varchar(255)
description: text
theme: varchar(50)          -- main, kids, totems, custom
before_image_url: text
after_image_url: text
display_order: int
is_active: boolean DEFAULT true
created_at: timestamp
```

### generation_settings
```sql
key: varchar(255) PRIMARY KEY
value: jsonb
```

### app_logs (Debugging)
```sql
id: uuid PRIMARY KEY
level: varchar(20)           -- debug, info, warning, error
source: varchar(100)         -- gem_upload, generation, payment, etc.
message: text
details: jsonb               -- Stack trace, request data, etc.
created_at: timestamp
```

---

## Application Logs (Debugging)

Логи приложения записываются в таблицу `app_logs` в Supabase для удалённой отладки.

### Создание таблицы
```sql
-- Выполнить в Supabase SQL Editor:
-- backend/migrations/003_create_logs_table.sql
```

### API доступ к логам
```bash
# Получить последние 100 логов
curl "https://olai.onrender.com/api/logs"

# Фильтр по уровню (error, warning, info, debug)
curl "https://olai.onrender.com/api/logs?level=error"

# Фильтр по источнику
curl "https://olai.onrender.com/api/logs?source=gem_upload"

# Комбинированный фильтр
curl "https://olai.onrender.com/api/logs?level=error&source=gem_upload&limit=50"

# Создать тестовый лог
curl -X POST "https://olai.onrender.com/api/logs?level=info&source=test&message=hello"
```

### Источники логов (source)
| Source | Description |
|--------|-------------|
| `gem_upload` | Загрузка камней в библиотеку |
| `gem_update` | Обновление камней |
| `generation` | AI генерация изображений |
| `payment` | Платежи Tinkoff |

### Использование в коде
```python
from app_logger import logger

# Логирование
await logger.info("source_name", "Message", {"key": "value"})
await logger.error("source_name", "Error message", {"error": str(e)})
await logger.exception("source_name", "Exception", exc, {"extra": "data"})
```

---

## API Endpoints

### Generation
```
POST /api/generate
```
Request:
```json
{
  "imageBase64": "data:image/png;base64,... или URL",
  "prompt": "Комментарий пользователя",
  "formFactor": "round",
  "size": "pendant",
  "material": "silver",
  "sessionId": "uuid",
  "applicationId": "uuid"
}
```
Response:
```json
{
  "success": true,
  "images": ["url1", "url2", "url3", "url4"],
  "prompt": "Использованный промпт",
  "generationId": "uuid",
  "costCents": 12,
  "executionTimeMs": 45000
}
```

### Applications
```
GET    /api/applications              # List (query: user_id, limit)
POST   /api/applications              # Create
GET    /api/applications/{id}         # Get one
PATCH  /api/applications/{id}         # Update
```

### Settings
```
GET    /api/settings                  # Get all settings
POST   /api/settings                  # Update settings (admin)
```

### Gems
```
GET    /api/gems                      # Get active gems (user)
GET    /api/gems/shapes               # Get available shapes
GET    /api/admin/gems                # Get all gems (admin)
POST   /api/admin/gems                # Create gem
PATCH  /api/admin/gems/{id}           # Update gem
DELETE /api/admin/gems/{id}           # Delete gem
```

### Clients (Admin)
```
GET    /api/admin/clients             # List all clients
POST   /api/admin/clients             # Create client
GET    /api/admin/clients/{id}        # Get client
PATCH  /api/admin/clients/{id}        # Update client
POST   /api/admin/create-invoice      # Create invoice
```

### Auth
```
POST   /api/auth/request-code         # Request email code
POST   /api/auth/verify-code          # Verify code
POST   /api/admin/request-code        # Admin code request
POST   /api/admin/verify-code         # Admin verification
```

### Payments
```
POST   /api/payments/create           # Create Tinkoff payment
GET    /api/payments/status/{orderId} # Check status
POST   /api/payments/notification     # Tinkoff webhook
GET    /api/admin/payments            # Payment history (admin)
```

### History
```
GET    /api/history                   # Generation history (query: limit)
```

---

## User Workflow (7-Step Flow)

```
UPLOAD → GENERATING → SELECTION → [GEMS] → [ENGRAVING] → CHECKOUT → CONFIRMATION
```

### Step UPLOAD
1. Загрузка изображения (drag & drop)
2. Комментарий (опционально)
3. Выбор размера S/M/L
4. Кнопка "Создать украшение"

### Step GENERATING
1. Анимированный лоадер + Progress bar
2. Fun facts карусель (~100 фактов о ювелирке)
3. Автоматический переход при готовности

### Step SELECTION
1. Сетка 2x2 с 4 вариантами
2. Выбор варианта (клик)
3. Перегенерация или далее

### Step GEMS (опционально)
1. Интерактивное размещение камней на превью
2. Выбор типа камня из библиотеки
3. Визуальная обратная связь

### Step ENGRAVING (опционально)
1. Ввод текста для гравировки
2. Выбор шрифта (Classic/Modern/Calligraphy)
3. Превью на обороте

### Step CHECKOUT
1. Превью финального изделия
2. MeasuringRuler - линейка размера
3. Email верификация
4. Кнопка "Оплатить" → Tinkoff

### Step CONFIRMATION
1. Сообщение об успешном заказе
2. Контакты для связи
3. Ссылка на Telegram

---

## AI Generation (FAL.ai)

### Models
```python
# Image-to-image
model_url = "https://queue.fal.run/fal-ai/bytedance/seedream/v4/edit"
model_name = "seedream-v4-edit"

# Text-to-image
model_url = "https://queue.fal.run/fal-ai/bytedance/seedream/v4/text-to-image"
model_name = "seedream-v4-text-to-image"
```

### Cost
- **3 цента** за изображение
- **4 варианта** по умолчанию = **12 центов** за генерацию

---

## Payment Integration (Tinkoff)

### Flow
1. Frontend вызывает `POST /payments/create`
2. Backend создает платеж в Tinkoff
3. Возвращается `paymentUrl` для редиректа
4. Пользователь оплачивает на странице Tinkoff
5. Tinkoff вызывает webhook `POST /payments/notification`
6. Пользователь редиректится на `/payment-success` или `/payment-fail`

### Payment Statuses
| Status | Description |
|--------|-------------|
| NEW | Создан |
| AUTHORIZING | Авторизация |
| 3DS_CHECKING | 3DS проверка |
| CONFIRMED | Успешно оплачен |
| CANCELED | Отменен |
| REJECTED | Отклонен |
| REFUNDED | Возврат |

### Receipt (54-ФЗ)
Обязательные поля для чека:
- Email покупателя
- Taxation: USN_INCOME (УСН доходы)
- PaymentMethod: prepayment
- PaymentObject: commodity

---

## Frontend Architecture

### Routing (BrowserRouter)
```typescript
/                        -> Landing.tsx
/kids                    -> KidsLanding.tsx
/totems                  -> TotemsLanding.tsx
/custom                  -> CustomLanding.tsx
/application/:id         -> Application.tsx
/admin                   -> Admin.tsx
/auth                    -> Auth.tsx
/profile                 -> Profile.tsx
/payment-success         -> PaymentSuccess.tsx
/payment-fail            -> PaymentFail.tsx
/oferta                  -> Oferta.tsx
/privacy                 -> Privacy.tsx
```

### State Machine
```typescript
const VALID_TRANSITIONS: Record<AppStep, AppStep[]> = {
  [AppStep.UPLOAD]: [AppStep.GENERATING],
  [AppStep.GENERATING]: [AppStep.SELECTION, AppStep.UPLOAD],
  [AppStep.SELECTION]: [AppStep.UPLOAD, AppStep.GENERATING, AppStep.GEMS, AppStep.CHECKOUT],
  [AppStep.GEMS]: [AppStep.SELECTION, AppStep.ENGRAVING, AppStep.CHECKOUT],
  [AppStep.ENGRAVING]: [AppStep.GEMS, AppStep.CHECKOUT],
  [AppStep.CHECKOUT]: [AppStep.SELECTION, AppStep.GEMS, AppStep.ENGRAVING],
  [AppStep.CONFIRMATION]: [],
};
```

### Theme System
4 темы с разными цветами и контентом:
- Контекст `ThemeContext.tsx` управляет текущей темой
- Каждая тема имеет свой лендинг и акцентные цвета
- Примеры в галерее фильтруются по теме

---

## Admin Panel (`/admin`)

### Tabs
1. **History** - История генераций с фильтрами
2. **Clients** - CRUD для клиентов
3. **Payments** - История транзакций
4. **Examples** - Управление галереей
5. **Gems** - Библиотека камней с background removal
6. **Variants** - Редактирование промптов
7. **Settings** - Размеры, материалы, форм-факторы

### Admin Auth
- Код верификации на email
- Проверка `is_admin` в таблице users

---

## Image Processing

### Optimization
- Конвертация в WebP с оптимизацией качества
- Генерация thumbnails для сетки выбора
- Сохранение прозрачности для PNG/WebP
- Background removal для камней (настраиваемый tolerance)

### Storage
- Supabase Storage buckets:
  - `pendants` - генерации и загрузки
  - `gems` - изображения камней
  - `examples` - галерея

---

## Development Notes

### Best Practices
- **Mobile-first**: Адаптивный дизайн
- **Type safety**: TypeScript + Zod validation
- **Async-first**: FastAPI + httpx
- **React Query**: Кеширование и синхронизация
- **Session tracking**: `sessionId` в localStorage

### Known Limitations
1. **Tests**: Нет unit/integration тестов
2. **i18n**: UI только на русском
3. **3D Preview**: Model3DViewer не используется в основном flow
4. **Gold**: Золото временно недоступно

### File Sizes
- **Frontend**: ~11MB (с node_modules)
- **Backend**: ~150KB
- **api.py**: ~2300 строк
- **Admin.tsx**: ~77KB (самый большой компонент)
