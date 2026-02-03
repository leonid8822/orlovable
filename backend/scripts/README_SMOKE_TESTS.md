# Smoke Tests для OLAI.ART

Автоматические тесты критичных функций после деплоя на PROD.

## Что проверяется

### Python скрипт (`smoke_tests.py`)
1. **Health Check** - доступность сервера
2. **API Root** - базовый эндпоинт
3. **Settings** - конфигурация приложения
4. **Gems List** - библиотека камней
5. **Gem Shapes** - доступные формы камней
6. **Examples Gallery** - галерея работ
7. **Logs** - система логирования
8. **Generation Settings** - настройки генерации
9. **History** - история генераций

### Backend endpoint (`/api/health/smoke-tests`)
1. **Settings Database** - проверка настроек
2. **Gems Database** - проверка БД камней
3. **Logs Database** - проверка логов
4. **Examples Gallery** - проверка галереи
5. **Generation Settings** - проверка настроек AI

## Использование

### 1. Автоматический запуск через GitHub Actions

После каждого пуша в `main` с изменениями в `backend/**`:
- ✅ Автоматически запускается workflow
- ⏳ Ждет 2 минуты для деплоя Render
- 🔍 Проверяет доступность backend
- 🧪 Запускает smoke tests
- 📊 Сохраняет результаты как artifacts
- ❌ Уведомляет при ошибках

### 2. Ручной запуск через GitHub Actions

```bash
# Перейти в GitHub -> Actions -> "Smoke Tests on Production" -> Run workflow
```

### 3. Локальный запуск Python скрипта

```bash
cd backend/scripts
python smoke_tests.py
```

### 4. Запрос к backend endpoint

```bash
# Получить результаты тестов
curl "https://olai.onrender.com/api/health/smoke-tests"
```

## Результаты тестов

### Успешный запуск
```json
{
  "timestamp": "2026-02-03T10:30:00Z",
  "success": true,
  "total": 9,
  "passed": 9,
  "failed": 0,
  "tests": [
    {
      "name": "Health Check",
      "endpoint": "/",
      "passed": true,
      "response_time": 0.34
    }
  ]
}
```

### Ошибка в тестах
```json
{
  "success": false,
  "failed": 2,
  "tests": [
    {
      "name": "Gems List",
      "passed": false,
      "error": "Connection timeout"
    }
  ]
}
```

## Логирование

Результаты автоматически логируются в `app_logs`:
- **Source**: `smoke_tests`
- **Level**: `info` (success) или `error` (failure)
- **Details**: Полные результаты тестов

Просмотр логов:
```bash
curl "https://olai.onrender.com/api/logs?source=smoke_tests&limit=10"
```

## Настройка уведомлений

### GitHub Actions (будущее)
Можно добавить:
- Slack notifications
- Email alerts
- Telegram bot messages

### Пример Telegram notification
```yaml
- name: Send Telegram notification
  if: failure()
  uses: appleboy/telegram-action@master
  with:
    to: ${{ secrets.TELEGRAM_CHAT_ID }}
    token: ${{ secrets.TELEGRAM_BOT_TOKEN }}
    message: |
      ❌ Smoke tests failed on PROD
      Commit: ${{ github.sha }}
      Author: ${{ github.actor }}
```

## Добавление новых тестов

### В Python скрипте

```python
runner.add_test(SmokeTest(
    name="New Feature Test",
    endpoint="/api/new-feature",
    method="GET",
    expected_status=200,
    validate_response=lambda data: "required_field" in data
))
```

### В backend endpoint

```python
# Test N: New feature
try:
    result = await test_new_feature()
    test_results["tests"].append({
        "name": "New Feature",
        "status": "passed"
    })
    test_results["passed"] += 1
except Exception as e:
    test_results["tests"].append({
        "name": "New Feature",
        "status": "failed",
        "error": str(e)
    })
    test_results["failed"] += 1
```

## Troubleshooting

### Тесты падают сразу после деплоя
- Увеличить время ожидания в workflow (sleep 120 → 180)
- Render может деплоиться медленнее обычного

### Timeout ошибки
- Проверить доступность PROD: `curl https://olai.onrender.com/api/settings`
- Проверить логи Render в Dashboard

### Ложные срабатывания
- Проверить формат ответов API (могла измениться структура)
- Обновить валидаторы в smoke_tests.py

## CI/CD Pipeline

```
Push to main (backend changes)
         ↓
GitHub Actions triggered
         ↓
Wait 2 min for Render deploy
         ↓
Check backend availability
         ↓
Run smoke tests
         ↓
Log results to Supabase
         ↓
Notify if failed
```

## Дальнейшие улучшения

- [ ] Добавить performance benchmarks (response time thresholds)
- [ ] Интеграция с monitoring (Sentry, Datadog)
- [ ] Тесты payment flow (mock transactions)
- [ ] Тесты AI generation (mock FAL.ai)
- [ ] Visual regression tests для frontend
- [ ] Load testing после деплоя
