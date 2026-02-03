# Periodic Static Examples Updates

## Проблема

Когда примеры грузятся напрямую из Supabase API на каждый визит лендинга:
- Медленная загрузка (API запрос + обработка)
- Нагрузка на базу данных
- Может зависнуть если база недоступна

## Решение

Статические файлы: примеры кешируются локально в `frontend/public/examples/*.json` и обновляются периодически.

## Использование

### Ручное обновление

```bash
# Полный цикл: синк + коммит + деплой
./scripts/update-static-and-deploy.sh

# Только синхронизация (без деплоя)
python3 scripts/sync-examples.py
```

### Автоматическое обновление (опционально)

Настроить cron job для ежедневного обновления:

```bash
# Открыть crontab
crontab -e

# Добавить строку (обновление каждый день в 3:00 AM)
0 3 * * * cd /path/to/orlovable && ./scripts/update-static-and-deploy.sh >> /var/log/olai-static-update.log 2>&1
```

Или через GitHub Actions (создать `.github/workflows/update-static.yml`):

```yaml
name: Update Static Examples
on:
  schedule:
    - cron: '0 3 * * *'  # Daily at 3 AM UTC
  workflow_dispatch:  # Manual trigger

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.9'
      - name: Install dependencies
        run: pip install requests Pillow
      - name: Sync examples
        run: python3 scripts/sync-examples.py
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
      - name: Commit changes
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add frontend/public/examples/
          git diff --cached --quiet || git commit -m "Update static examples $(date)"
          git push
      - name: Deploy to Vercel
        run: curl -X POST "${{ secrets.VERCEL_DEPLOY_HOOK }}"
```

## Когда запускать

- **После добавления новых примеров** в админке
- **После изменения существующих примеров**
- **Ежедневно** (если контент часто обновляется)
- **Еженедельно** (если контент статичный)

## Проверка

После обновления проверьте:

```bash
# Проверить что файлы обновились
ls -lah frontend/public/examples/

# Проверить содержимое
cat frontend/public/examples/main.json | python3 -m json.tool

# После деплоя проверить на проде
curl "https://olai.art/examples/main.json" | python3 -c "import sys, json; print(f'Loaded {len(json.load(sys.stdin))} examples')"
```

## Файлы

- `scripts/sync-examples.py` - синхронизация из БД в JSON + оптимизация изображений
- `scripts/update-static-and-deploy.sh` - полный цикл обновления + деплой
- `frontend/public/examples/` - статические файлы (main.json, kids.json, totems.json + изображения)
