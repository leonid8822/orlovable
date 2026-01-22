# OLAI.ART - Jewelry Customization Platform

## Project Overview

**OLAI.ART** (ArtisanJewel) - full-stack платформа для кастомизации ювелирных изделий. Пользователи загружают рисунки, фото или описания, а AI генерирует превью кулонов/браслетов, которые затем изготавливаются из золота или серебра методом 3D-печати.

**Production URL**: https://olai.art
**Backend API**: https://jewelry-backend-nqev4d2b4a-lm.a.run.app/api

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
| React Router DOM | 6.30.1 | Роутинг (HashRouter) |
| Supabase JS | 2.86.0 | Database client |

### Backend
| Технология | Версия | Назначение |
|------------|--------|------------|
| FastAPI | 0.111.0 | Web framework |
| Python | 3.9 | Runtime |
| SQLAlchemy | 2.0.30 | ORM |
| Pydantic | 2.7.4 | Валидация данных |
| Uvicorn | 0.30.1 | ASGI server |
| psycopg2 | 2.9.9 | PostgreSQL driver |
| httpx | 0.27.0 | HTTP client |

### Infrastructure
| Компонент | Сервис | URL |
|-----------|--------|-----|
| Frontend Hosting | Vercel (static) | https://olai.art |
| Backend | Render (auto-deploy from main) | https://olai.onrender.com |
| Database | Supabase (PostgreSQL) | https://vofigcbihwkmocrsfowt.supabase.co |
| AI Generation | FAL.ai (Bytedance SeedDream v4) | - |

### Deployment

**ВАЖНО: Backend деплоится АВТОМАТИЧЕСКИ из ветки `main` через Render.**

```bash
# Frontend -> Vercel (manual or via Vercel Dashboard)
cd frontend && vercel --prod --token $VERCEL_TOKEN

# Backend -> Render (АВТОМАТИЧЕСКИ из main!)
# НЕ НУЖНО деплоить вручную - просто merge в main и Render сам задеплоит
# Render Environment Variables (настроены в Dashboard):
#   - SUPABASE_URL
#   - SUPABASE_SERVICE_KEY
#   - FAL_KEY
```

---

## Project Structure

```
.
├── frontend/                           # React SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                    # shadcn/ui компоненты (~50 файлов)
│   │   │   │   ├── button.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── toast.tsx
│   │   │   │   └── ...
│   │   │   ├── steps/                 # 4-шаговый wizard (NEW ARCHITECTURE)
│   │   │   │   ├── StepUpload.tsx     # Загрузка + выбор размера S/M/L
│   │   │   │   ├── StepGenerating.tsx # Автоматическая генерация с лоадером
│   │   │   │   ├── StepSelection.tsx  # Выбор варианта + перегенерация
│   │   │   │   └── StepCheckout.tsx   # Материал + оплата
│   │   │   │   # Legacy (не используются):
│   │   │   │   ├── Step1Upload.tsx
│   │   │   │   ├── Step2Configure.tsx
│   │   │   │   ├── Step3BackSide.tsx
│   │   │   │   └── Step4Checkout.tsx
│   │   │   ├── admin/                 # Админ-панель
│   │   │   ├── Header.tsx
│   │   │   ├── StepIndicator.tsx      # Обновлён для AppStep enum
│   │   │   ├── MeasuringRuler.tsx     # NEW: Линейка реального размера
│   │   │   ├── PendantPreview.tsx
│   │   │   ├── Model3DViewer.tsx
│   │   │   ├── ImageUploader.tsx
│   │   │   └── GenerationHistory.tsx
│   │   ├── pages/
│   │   │   ├── Index.tsx              # Landing page (/)
│   │   │   ├── Application.tsx        # Workflow (/application/:id)
│   │   │   ├── Admin.tsx              # Админка (/admin)
│   │   │   ├── Examples.tsx           # Галерея (/examples)
│   │   │   ├── Auth.tsx               # Авторизация (/auth)
│   │   │   ├── Profile.tsx            # Профиль (/profile)
│   │   │   └── NotFound.tsx           # 404
│   │   ├── types/
│   │   │   └── pendant.ts             # TypeScript типы домена
│   │   ├── lib/
│   │   │   ├── api.ts                 # API client (fetch wrapper)
│   │   │   └── utils.ts               # cn() и утилиты
│   │   ├── hooks/
│   │   │   ├── use-toast.ts
│   │   │   └── use-mobile.tsx
│   │   ├── integrations/
│   │   │   └── supabase/              # Supabase setup
│   │   ├── App.tsx                    # Root + Routes
│   │   ├── main.tsx                   # Entry point
│   │   └── index.css                  # Global styles + CSS variables
│   ├── tailwind.config.ts             # Theme (gold/silver colors)
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── backend/                            # FastAPI Python
│   ├── main.py                        # App setup, CORS, routes mount
│   ├── api.py                         # API endpoints
│   ├── models.py                      # SQLAlchemy models
│   ├── database.py                    # DB connection
│   ├── Dockerfile                     # Python 3.9-slim image
│   ├── requirements.txt
│   ├── .env.example
│   └── scripts/
│       ├── deploy_backend.py          # Deployment script
│       ├── migrate_csv.py             # CSV import
│       └── migrate_to_postgres.py     # SQLite -> PostgreSQL
│
├── db_migration/                       # Migration CSV files
│   ├── applications-export-*.csv
│   ├── pendant_generations-export-*.csv
│   ├── generation_settings-export-*.csv
│   └── examples-export-*.csv
│
└── CLAUDE.md                          # This file
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
python main.py                                    # Uvicorn с auto-reload

# Production
uvicorn main:app --host 0.0.0.0 --port 8080

# Docker
docker build -t jewelry-backend .
docker run -p 8080:8080 -e FAL_KEY=xxx -e DATABASE_URL=xxx jewelry-backend
```

---

## Environment Variables

### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname  # Production (Supabase)
DATABASE_URL=sqlite:///./jewelry.db                    # Development

# AI Generation
FAL_KEY=your_fal_ai_key
```

### Frontend
Конфигурация захардкожена в `frontend/src/lib/api.ts`:
```typescript
const API_URL = 'https://jewelry-backend-nqev4d2b4a-lm.a.run.app/api';
```

---

## Domain Types

### AppStep (enum для state machine)
```typescript
enum AppStep {
  UPLOAD = 'UPLOAD',       // Загрузка картинки + выбор размера
  GENERATING = 'GENERATING', // Автоматическая генерация
  SELECTION = 'SELECTION',  // Выбор варианта
  CHECKOUT = 'CHECKOUT'     // Оформление и оплата
}
```

### SizeOption (новая система размеров S/M/L)
| Size | Dimensions | FormFactor | Gender | API Size |
|------|------------|------------|--------|----------|
| `s` | 11мм | round (круглый) | женский | bracelet |
| `m` | 25мм | oval (жетон) | мужской | pendant |
| `l` | 40мм | contour (контурный) | универсальный | interior |

### FormFactor (форм-фактор)
| Value | Label (RU) | Description |
|-------|------------|-------------|
| `round` | Круглый | Женский круглый кулон |
| `oval` | Жетон | Мужской жетон |
| `contour` | Контурный | Универсальный по контуру |

### Material (материал)
| Value | Label (RU) | Status |
|-------|------------|--------|
| `silver` | Серебро 925 | Active |
| `gold` | Золото 585 | Soon (disabled) |

### Application Status
| Status | Description |
|--------|-------------|
| `draft` | Черновик |
| `generating` | Генерация в процессе |
| `generated` | Превью сгенерировано |

---

## Database Models

### PendantGeneration
Хранит результаты генерации изображений.

```python
class PendantGeneration(Base):
    __tablename__ = 'pendant_generations'

    id: str                    # UUID
    created_at: datetime

    # Input
    input_image_url: str       # Base64 или URL исходника
    user_comment: str          # Комментарий пользователя
    form_factor: str           # 'round' | 'contour'
    material: str              # 'silver' | 'gold'
    size: str                  # 'bracelet' | 'pendant' | 'interior'

    # Output
    output_images: JSON        # Array of image URLs
    prompt_used: str           # Финальный промпт для FAL.ai

    # Tracking
    cost_cents: int            # Стоимость генерации (3 цента/изображение)
    model_used: str            # 'seedream-v4-edit' | 'seedream-v4-text-to-image'
    execution_time_ms: int
    session_id: str
    application_id: str        # FK to Application
```

### Application
Заявка пользователя - отслеживает весь workflow.

```python
class Application(Base):
    __tablename__ = 'applications'

    id: str                    # UUID
    user_id: str               # (опционально) ID пользователя
    session_id: str            # Анонимная сессия

    # Workflow state
    current_step: int          # 1-4
    status: str                # draft|pending_generation|generating|generated

    # Configuration
    form_factor: str           # 'round' | 'contour'
    material: str              # 'silver' | 'gold'
    size: str                  # 'bracelet' | 'pendant' | 'interior'

    # Front side
    input_image_url: str       # Загруженное изображение
    user_comment: str          # Комментарий
    generated_preview: str     # Выбранный вариант превью

    # Back side (optional)
    has_back_engraving: bool
    back_image_url: str
    back_comment: str

    created_at: datetime
    updated_at: datetime
```

### GenerationSettings
Key-value хранилище настроек генерации.

```python
class GenerationSettings(Base):
    __tablename__ = 'generation_settings'

    key: str                   # 'num_images', 'main_prompt', 'form_factors', 'sizes'
    value: JSON                # Любое JSON-значение
```

### Example
Элементы галереи примеров работ.

```python
class Example(Base):
    __tablename__ = 'examples'

    id: str
    title: str
    description: str
    before_image_url: str      # До (рисунок)
    after_image_url: str       # После (кулон)
    model_3d_url: str          # 3D модель
    display_order: int
    is_active: bool
    created_at: datetime
```

---

## API Endpoints

### Generation
```
POST /api/generate
```
Запускает AI-генерацию изображений кулона.

**Request:**
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

**Response:**
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
GET    /api/applications              # Список заявок (query: user_id, limit)
POST   /api/applications              # Создать заявку
GET    /api/applications/{id}         # Получить заявку
PATCH  /api/applications/{id}         # Обновить заявку
```

### Settings
```
GET    /api/settings                  # Получить настройки
POST   /api/settings                  # Обновить настройки
```

### History
```
GET    /api/history                   # История генераций (query: limit)
```

---

## User Workflow (Simplified 4-Step Flow)

```
UPLOAD → GENERATING → SELECTION → CHECKOUT
  │          │            │           │
Ручной   Автоматич.    Ручной      Ручной
```

### Step UPLOAD (`StepUpload.tsx`)
1. Загрузка изображения (drag & drop + кнопка)
2. Комментарий к изображению (опционально)
3. **Выбор размера S/M/L** (определяет форм-фактор автоматически)
4. Кнопка "Создать украшение" → переход к GENERATING

### Step GENERATING (`StepGenerating.tsx`)
1. Показ загруженной картинки (с opacity)
2. Анимированный лоадер + Progress bar
3. Текст "Создаём варианты вашего украшения..."
4. Fun facts карусель (~60 сек ожидания)
5. **Автоматический переход** к SELECTION когда готово

### Step SELECTION (`StepSelection.tsx`)
1. Сетка 2x2 с 4 вариантами
2. Клик для выбора варианта (чекмарк)
3. Большой превью выбранного справа
4. Кнопка "Перегенерировать" → возврат к GENERATING
5. Кнопка "Далее" → переход к CHECKOUT
6. Кнопка "Назад" → возврат к UPLOAD

### Step CHECKOUT (`StepCheckout.tsx`)
1. Превью выбранного варианта
2. Информация о размере (readonly, из UPLOAD)
3. **MeasuringRuler** - линейка реального размера
4. Выбор материала: Серебро (active), Золото "Soon" (disabled)
5. Итоговая цена (доставка включена)
6. Комментарий к заказу (камни, гравировка, пожелания)
7. Ссылка на Telegram для вопросов
8. Кнопка "Оплатить"
9. Кнопка "Назад" → возврат к SELECTION

---

## AI Generation Flow

### FAL.ai Integration
```python
# With image (image-to-image editing)
model_url = "https://queue.fal.run/fal-ai/bytedance/seedream/v4/edit"
model_name = "seedream-v4-edit"

# Without image (text-to-image)
model_url = "https://queue.fal.run/fal-ai/bytedance/seedream/v4/text-to-image"
model_name = "seedream-v4-text-to-image"
```

### Prompt Template (with image)
```
Создай ювелирный кулон из референса на картинке.
{Дополнительные пожелания заказчика: {user_comment}}
ВАЖНО: Максимально точно следуй референсу. Сохрани все детали и пропорции оригинального изображения.
Ушко для цепочки — простое, классическое ювелирное.
Строго один вид спереди.
Черный фон, изделие из серебра (silver metal). Без красок, без дополнительных текстур.
Объект должен быть ЦЕЛОСТНЫМ, МОНОЛИТНЫМ, готовым к 3D-печати — никаких отдельных частей, всё соединено.
{form_addition}
Форма — {form_shape}.
Максимальная детализация поверхности, ювелирное качество.
```

### Cost Tracking
- **3 цента** за каждое сгенерированное изображение
- По умолчанию генерируется **4 варианта** = **12 центов** за генерацию
- Стоимость сохраняется в `PendantGeneration.cost_cents`

---

## Frontend Architecture

### Routing (HashRouter)
```typescript
/                        -> Index.tsx (Landing + Step1)
/application/:id         -> Application.tsx (Full wizard)
/admin                   -> Admin.tsx
/examples                -> Examples.tsx
/auth                    -> Auth.tsx
/profile                 -> Profile.tsx
```

**Почему HashRouter?**
Для совместимости со статическим хостингом без server-side routing.

### State Management
- **Local state**: React hooks (`useState`, `useEffect`, `useCallback`)
- **Server state**: React Query для кеширования API-ответов
- **Step state**: `AppStep` enum с явной state machine
- **Config state**: `PendantConfig` объект передается через props между Step-компонентами

### State Machine (Application.tsx)
```typescript
const VALID_TRANSITIONS: Record<AppStep, AppStep[]> = {
  [AppStep.UPLOAD]: [AppStep.GENERATING],
  [AppStep.GENERATING]: [AppStep.SELECTION, AppStep.UPLOAD],
  [AppStep.SELECTION]: [AppStep.UPLOAD, AppStep.GENERATING, AppStep.CHECKOUT],
  [AppStep.CHECKOUT]: [AppStep.SELECTION],
};

const transitionTo = (nextStep: AppStep) => {
  if (VALID_TRANSITIONS[currentStep].includes(nextStep)) {
    setCurrentStep(nextStep);
  }
};
```

### API Client (`lib/api.ts`)
```typescript
export const api = {
  generate: async (payload) => fetch(...),
  getSettings: async () => fetch(...),
  createApplication: async (payload) => fetch(...),
  getApplication: async (id) => fetch(...),
  updateApplication: async (id, updates) => fetch(...),
  listApplications: async (userId?) => fetch(...),
  getHistory: async () => fetch(...),
  updateSettings: async (settings) => fetch(...),
};
```

### Theme & Styling
- **Color scheme**: Luxury gold/silver palette
- **CSS Variables**: Определены в `index.css`
- **Custom colors**: `gold`, `gold-light`, `gold-dark`, `silver`, `silver-light`
- **Fonts**: Cormorant Garamond (display), Inter (body), Montserrat (sans)
- **Animations**: fade-in, scale-in, slide-up (tailwindcss-animate)

---

## Admin Panel (`/admin`)

Функции:
- Просмотр истории генераций
- Настройка количества генерируемых изображений
- Редактирование промптов
- Управление форм-факторами и размерами
- Управление галереей примеров

---

## Deployment

### Frontend -> Vercel
```bash
cd frontend
npm run build
# Deploy via Vercel CLI or GitHub integration
vercel deploy
```

### Backend -> Render
Deploy via Render Dashboard or render.yaml configuration.
Environment variables: `FAL_KEY`, `DATABASE_URL` (Supabase connection string).

---

## Known Limitations & TODOs

1. **Auth**: Supabase auth подготовлен, но не активен (guest mode)
2. **Payments**: Checkout step без интеграции с платежной системой
3. **Tests**: Нет unit/integration тестов
4. **i18n**: UI только на русском языке
5. **3D Preview**: Model3DViewer компонент существует, но не используется в основном flow

---

## Development Notes

- **lovable-tagger**: Используется для отслеживания компонентов в dev
- **Responsive**: Mobile-first дизайн
- **Dark mode**: Поддерживается через `next-themes`
- **Progress tracking**: Fun facts карусель во время генерации для UX
- **Session tracking**: `sessionId` в localStorage для анонимных пользователей
