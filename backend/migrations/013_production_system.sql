-- Migration: Production System - Time Tracking & Stage Photos
-- Run this in Supabase SQL Editor

-- 1. Таймтрекинг заказов
-- status_durations хранит накопленное время (в секундах) в каждом статусе
-- Формат: {"new": 3600, "design": 7200, "modeling": 1800, ...}
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status_durations JSONB DEFAULT '{}';

-- status_entered_at - когда заказ вошёл в текущий статус
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status_entered_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Фото по этапам производства
-- Формат: {"design": ["url1", "url2"], "casting": ["url3"], "polishing": ["url4", "url5"]}
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stage_photos JSONB DEFAULT '{}';

-- 3. Расширяем историю статусов (если таблица существует)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'order_status_history') THEN
        ALTER TABLE order_status_history ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;
        ALTER TABLE order_status_history ADD COLUMN IF NOT EXISTS previous_status VARCHAR(50);
    END IF;
END $$;

-- 4. Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_orders_status_entered ON orders(status_entered_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- 5. Обновить существующие заказы - установить status_entered_at
UPDATE orders
SET status_entered_at = COALESCE(updated_at, created_at)
WHERE status_entered_at IS NULL;

-- Комментарии
COMMENT ON COLUMN orders.status_durations IS 'Accumulated time in seconds for each status: {"new": 3600, "design": 7200, ...}';
COMMENT ON COLUMN orders.status_entered_at IS 'Timestamp when order entered current status';
COMMENT ON COLUMN orders.stage_photos IS 'Photos for each production stage: {"design": ["url1"], "casting": ["url2"], ...}';
