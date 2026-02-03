-- Update form factor labels to remove gender mentions

UPDATE generation_settings
SET value = jsonb_set(
  jsonb_set(
    value,
    '{round,description}',
    '"Круглый кулон"'
  ),
  '{oval,description}',
  '"Жетон"'
)
WHERE key = 'form_factors';

-- Verify the update
SELECT key, value->'round'->>'description' as round_desc, value->'oval'->>'description' as oval_desc
FROM generation_settings
WHERE key = 'form_factors';
