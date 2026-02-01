-- Add customer contact fields to applications table
ALTER TABLE applications ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS customer_telegram VARCHAR(100);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS size_option VARCHAR(10);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE;

-- Create index for submitted orders
CREATE INDEX IF NOT EXISTS idx_applications_submitted ON applications(status) WHERE status = 'submitted';
CREATE INDEX IF NOT EXISTS idx_applications_customer_email ON applications(customer_email);
