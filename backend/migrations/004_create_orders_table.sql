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
    production_artifacts JSONB DEFAULT '[]'::jsonb,

    -- ==========================================
    -- PRODUCTION WORKSPACE - Manufacturing Data
    -- ==========================================

    -- 3D Printing costs
    printing_cost DECIMAL(10,2) DEFAULT 0,           -- Cost of 3D printing (wax/resin)
    printing_weight_g DECIMAL(10,3),                 -- Weight of 3D print in grams
    printing_notes TEXT,                             -- Notes about printing

    -- Metal casting
    metal_weight_g DECIMAL(10,3),                    -- Final metal weight in grams
    metal_price_per_g DECIMAL(10,2),                 -- Price per gram of metal
    metal_cost DECIMAL(10,2) DEFAULT 0,              -- Total metal cost
    casting_cost DECIMAL(10,2) DEFAULT 0,            -- Cost of casting service
    casting_notes TEXT,                              -- Notes about casting

    -- Finishing & polishing
    polishing_cost DECIMAL(10,2) DEFAULT 0,          -- Polishing/finishing cost
    plating_cost DECIMAL(10,2) DEFAULT 0,            -- Gold plating cost (if applicable)
    plating_type VARCHAR(50),                        -- Type of plating (gold, rhodium, etc.)

    -- Gems & stones
    gems_cost DECIMAL(10,2) DEFAULT 0,               -- Total cost of gems
    gems_setting_cost DECIMAL(10,2) DEFAULT 0,       -- Cost of setting gems
    gems_details JSONB DEFAULT '[]'::jsonb,          -- Detailed gem breakdown [{name, count, price_each}]

    -- Chain/cord
    chain_type VARCHAR(100),                         -- Type of chain/cord
    chain_length_cm DECIMAL(5,1),                    -- Chain length in cm
    chain_cost DECIMAL(10,2) DEFAULT 0,              -- Cost of chain

    -- Packaging & extras
    packaging_cost DECIMAL(10,2) DEFAULT 0,          -- Box, pouch, etc.
    engraving_cost DECIMAL(10,2) DEFAULT 0,          -- Cost of engraving
    other_costs DECIMAL(10,2) DEFAULT 0,             -- Any other costs
    other_costs_notes TEXT,                          -- Description of other costs

    -- Labor & time tracking
    labor_hours DECIMAL(5,2),                        -- Total labor hours
    labor_rate_per_hour DECIMAL(10,2),               -- Hourly rate
    labor_cost DECIMAL(10,2) DEFAULT 0,              -- Total labor cost

    -- Cost summary (auto-calculated or manual)
    total_cost DECIMAL(10,2) DEFAULT 0,              -- Total production cost (sum of all costs)
    margin_percent DECIMAL(5,2),                     -- Profit margin percentage
    calculated_price DECIMAL(10,2),                  -- Price calculated from cost + margin

    -- ==========================================
    -- END PRODUCTION WORKSPACE
    -- ==========================================

    -- Client pricing
    quoted_price DECIMAL(10,2),                      -- Price quoted to customer
    deposit_amount DECIMAL(10,2),                    -- Deposit paid
    deposit_paid_at TIMESTAMPTZ,                     -- When deposit was paid
    final_price DECIMAL(10,2),                       -- Final agreed price
    final_paid_at TIMESTAMPTZ,                       -- When final payment was made
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
    delivery_cost DECIMAL(10,2) DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,

    -- Foreign keys (commented out - may not exist in all installations)
    -- CONSTRAINT fk_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE SET NULL,
    -- CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
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
COMMENT ON TABLE orders IS 'Production orders with full manufacturing cost tracking';
COMMENT ON COLUMN orders.status IS 'new, design, modeling, production, ready, shipped, delivered, cancelled';
COMMENT ON COLUMN orders.total_cost IS 'Sum of all production costs';
COMMENT ON COLUMN orders.margin_percent IS 'Profit margin as percentage';
COMMENT ON TABLE order_status_history IS 'History of status changes for orders';
