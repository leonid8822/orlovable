-- Add description field to gems table for semantic descriptions
ALTER TABLE gems ADD COLUMN IF NOT EXISTS description TEXT;

-- Update existing gems with descriptions
UPDATE gems SET description = 'Символ страсти, энергии и любви. Привлекает удачу и защищает от негатива.' WHERE name_en = 'ruby';
UPDATE gems SET description = 'Камень мудрости и ясности ума. Помогает сосредоточиться и принять верное решение.' WHERE name_en = 'sapphire';
UPDATE gems SET description = 'Символ надежды и обновления. Приносит гармонию и душевный покой.' WHERE name_en = 'emerald';
