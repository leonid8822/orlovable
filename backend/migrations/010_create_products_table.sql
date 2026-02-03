-- Create products table for shop
-- Stores jewelry products (totems, custom items, etc.)

CREATE TABLE IF NOT EXISTS products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(255) NOT NULL,
    slug varchar(255) UNIQUE,
    description text,
    category varchar(50) NOT NULL DEFAULT 'totem',
    image_url text NOT NULL,
    gallery_urls jsonb DEFAULT '[]'::jsonb,
    price_silver int NOT NULL,
    price_gold int,
    sizes_available jsonb DEFAULT '["s", "m", "l"]'::jsonb,
    is_available boolean DEFAULT true,
    stock_count int DEFAULT -1,
    display_order int DEFAULT 0,
    is_featured boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Add comments
COMMENT ON TABLE products IS 'Shop products (totems, custom jewelry, ready-made items)';
COMMENT ON COLUMN products.slug IS 'URL-friendly product identifier';
COMMENT ON COLUMN products.category IS 'Product category: totem, custom, pendant, bracelet';
COMMENT ON COLUMN products.gallery_urls IS 'Additional product images';
COMMENT ON COLUMN products.stock_count IS '-1 = unlimited stock, 0+ = limited quantity';
COMMENT ON COLUMN products.is_featured IS 'Show in featured products section';

-- Create index for fast queries
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_display_order ON products(display_order);

-- Insert sample totem products
INSERT INTO products (name, slug, description, category, image_url, price_silver, price_gold, is_featured, display_order) VALUES
('Волк', 'volk', 'Символ верности, храбрости и свободы', 'totem', 'https://vofigcbihwkmocrsfowt.supabase.co/storage/v1/object/public/pendants/totems/wolf.jpg', 4500, 12000, true, 1),
('Медведь', 'medved', 'Символ силы, мудрости и защиты', 'totem', 'https://vofigcbihwkmocrsfowt.supabase.co/storage/v1/object/public/pendants/totems/bear.jpg', 4500, 12000, true, 2),
('Орел', 'orel', 'Символ свободы, дальновидности и победы', 'totem', 'https://vofigcbihwkmocrsfowt.supabase.co/storage/v1/object/public/pendants/totems/eagle.jpg', 4500, 12000, true, 3),
('Дракон', 'drakon', 'Символ могущества, мудрости и удачи', 'totem', 'https://vofigcbihwkmocrsfowt.supabase.co/storage/v1/object/public/pendants/totems/dragon.jpg', 5000, 13000, true, 4),
('Лев', 'lev', 'Символ храбрости, силы и лидерства', 'totem', 'https://vofigcbihwkmocrsfowt.supabase.co/storage/v1/object/public/pendants/totems/lion.jpg', 4500, 12000, false, 5),
('Сова', 'sova', 'Символ мудрости, интуиции и тайных знаний', 'totem', 'https://vofigcbihwkmocrsfowt.supabase.co/storage/v1/object/public/pendants/totems/owl.jpg', 4000, 11000, false, 6)
ON CONFLICT (slug) DO NOTHING;

-- Verify
SELECT
    id,
    name,
    slug,
    category,
    price_silver,
    is_available,
    is_featured,
    display_order
FROM products
ORDER BY display_order, created_at;
