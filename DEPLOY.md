# Деплой OLAI.ART

## Архитектура

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Vercel    │    │   Render    │    │  Supabase   │
│  (Frontend) │───▶│  (Backend)  │───▶│ (Database)  │
│  olai.art   │    │ onrender.com│    │  PostgreSQL │
└─────────────┘    └─────────────┘    └─────────────┘
```

| Компонент | Сервис | URL |
|-----------|--------|-----|
| Frontend | Vercel | https://olai.art |
| Backend | Render | https://olai.onrender.com |
| Database | Supabase | PostgreSQL |

---

## Быстрый деплой

```bash
# Frontend
./deploy-frontend.sh

# Backend (автоматически из main)
git push origin main
```

---

## Frontend (Vercel)

**Скрипт:** `./deploy-frontend.sh`

Или вручную:
```bash
cd frontend
npm run build
source ../secrets/.env
vercel --prod --token $VERCEL_TOKEN
```

---

## Backend (Render)

**Автодеплой** из ветки `main` - просто пушь в main и Render сам задеплоит.

```bash
git push origin main
# Render задеплоит через 2-3 минуты
```

Dashboard: https://dashboard.render.com

---

## Проверка

- Frontend: https://olai.art
- Backend: https://olai.onrender.com/health
- API: https://olai.onrender.com/api/settings

---

## Секреты

Файл `secrets/.env` (НЕ коммитить!):

```bash
# Vercel
VERCEL_TOKEN=xxx

# Supabase
SUPABASE_URL=https://vofigcbihwkmocrsfowt.supabase.co
SUPABASE_SERVICE_KEY=xxx  # Взять из Supabase Dashboard → Settings → API

# FAL.ai
FAL_KEY=xxx

# S3 (Timeweb)
S3_BUCKET_NAME=xxx
S3_ACCESS_KEY=xxx
S3_SECRET_KEY=xxx
```

### Где взять ключи

| Ключ | Где взять |
|------|-----------|
| VERCEL_TOKEN | https://vercel.com/account/tokens |
| SUPABASE_SERVICE_KEY | Supabase Dashboard → Settings → API → service_role |
| FAL_KEY | https://fal.ai/dashboard |
