-- Orders table for production workflow management
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Order info
    order_number VARCHAR(50) UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'new',

    -- Customer info
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_telegram VARCHAR(255),

    -- Product details
    product_type VARCHAR(100) NOT NULL DEFAULT 'pendant',
    material VARCHAR(50) NOT NULL DEFAULT 'silver',
    size VARCHAR(50),
    form_factor VARCHAR(50),

    -- Images and files
    reference_images JSONB DEFAULT '[]'::jsonb,
    generated_images JSONB DEFAULT '[]'::jsonb,
    model_3d_url TEXT,
    final_photos JSONB DEFAULT '[]'::jsonb,

    -- Pricing
    quoted_price DECIMAL(10,2),
    final_price DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'RUB',

    -- Production details
    gems_config JSONB DEFAULT '[]'::jsonb,
    engraving_text TEXT,
    special_requirements TEXT,
    internal_notes TEXT,

    -- Linked entities
    application_id UUID,
    user_id UUID,

    -- Delivery
    delivery_address TEXT,
    delivery_service VARCHAR(100),
    tracking_number VARCHAR(255),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,

    -- Foreign keys
    CONSTRAINT fk_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE SET NULL,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Order status history table
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL,
    comment TEXT,
    changed_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);

-- Auto-generate order number trigger
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_generate_order_number ON orders;
CREATE TRIGGER trigger_generate_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION generate_order_number();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_orders_timestamp ON orders;
CREATE TRIGGER trigger_update_orders_timestamp
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_orders_updated_at();

-- Comments
COMMENT ON TABLE orders IS 'Production orders with workflow tracking';
COMMENT ON COLUMN orders.status IS 'new, design, modeling, production, ready, shipped, delivered, cancelled';
COMMENT ON TABLE order_status_history IS 'History of status changes for orders';
