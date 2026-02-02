-- Migration: Create products table for shop (ready-made totems collection)

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Basic info
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Category/type
    category VARCHAR(100) DEFAULT 'totem',  -- totem, pendant, bracelet, etc.

    -- Images
    image_url TEXT NOT NULL,
    gallery_urls JSONB DEFAULT '[]',  -- Additional images

    -- Pricing
    price_silver INTEGER NOT NULL,  -- Price in rubles for silver
    price_gold INTEGER,  -- Price in rubles for gold (optional)

    -- Sizes available
    sizes_available JSONB DEFAULT '["s", "m", "l"]',

    -- Stock/availability
    is_available BOOLEAN DEFAULT TRUE,
    stock_count INTEGER DEFAULT -1,  -- -1 means unlimited (made to order)

    -- Display
    display_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,

    -- SEO
    slug VARCHAR(255) UNIQUE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_display_order ON products(display_order);
