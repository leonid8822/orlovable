-- Create payments table for Tinkoff acquiring integration
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES applications(id),
    order_id VARCHAR(64) UNIQUE NOT NULL,  -- OLAI-{app_id}-{timestamp}
    tinkoff_payment_id VARCHAR(64),
    amount INTEGER NOT NULL,  -- Amount in rubles
    status VARCHAR(32) DEFAULT 'NEW',  -- Tinkoff payment status
    customer_email VARCHAR(255),
    customer_name VARCHAR(255),
    order_comment TEXT,
    card_pan VARCHAR(20),  -- Masked card number
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_application_id ON payments(application_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Add order_comment and paid_at to applications if not exists
ALTER TABLE applications ADD COLUMN IF NOT EXISTS order_comment TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
