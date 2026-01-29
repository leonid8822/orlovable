-- Create gems table for gem library
CREATE TABLE IF NOT EXISTS gems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    shape VARCHAR(50) DEFAULT 'round', -- round, oval, square, marquise, pear, heart
    size_mm DECIMAL(4,2) DEFAULT 1.5,  -- Size in millimeters
    color VARCHAR(20) NOT NULL,         -- Hex color for fallback, e.g., "#E31C25"
    image_url TEXT,                     -- URL to gem image with transparent background
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_gems_active ON gems(is_active);
CREATE INDEX IF NOT EXISTS idx_gems_sort ON gems(sort_order, name);

-- Insert default gems
INSERT INTO gems (id, name, name_en, shape, size_mm, color, is_active, sort_order) VALUES
    (gen_random_uuid(), 'Рубин', 'ruby', 'round', 1.5, '#E31C25', true, 1),
    (gen_random_uuid(), 'Сапфир', 'sapphire', 'round', 1.5, '#0F52BA', true, 2),
    (gen_random_uuid(), 'Изумруд', 'emerald', 'round', 1.5, '#50C878', true, 3)
ON CONFLICT DO NOTHING;

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_gems_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_gems_updated_at ON gems;
CREATE TRIGGER trigger_gems_updated_at
    BEFORE UPDATE ON gems
    FOR EACH ROW
    EXECUTE FUNCTION update_gems_updated_at();
