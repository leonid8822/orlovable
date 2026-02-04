-- Performance indexes for fast admin queries
-- All tables should have indexes on commonly filtered/sorted columns

-- Applications table indexes
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_session_id ON applications(session_id);
CREATE INDEX IF NOT EXISTS idx_applications_form_factor ON applications(form_factor);
CREATE INDEX IF NOT EXISTS idx_applications_material ON applications(material);
-- Composite index for common admin query
CREATE INDEX IF NOT EXISTS idx_applications_status_created ON applications(status, created_at DESC);

-- Pendant generations table indexes
CREATE INDEX IF NOT EXISTS idx_pendant_generations_created_at ON pendant_generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pendant_generations_application_id ON pendant_generations(application_id);
CREATE INDEX IF NOT EXISTS idx_pendant_generations_session_id ON pendant_generations(session_id);

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);

-- Payments table indexes
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_application_id ON payments(application_id);

-- Examples table indexes
CREATE INDEX IF NOT EXISTS idx_examples_theme ON examples(theme);
CREATE INDEX IF NOT EXISTS idx_examples_is_active ON examples(is_active);
CREATE INDEX IF NOT EXISTS idx_examples_display_order ON examples(display_order);
-- Composite for gallery query
CREATE INDEX IF NOT EXISTS idx_examples_active_theme ON examples(is_active, theme, display_order);

-- Gems table indexes
CREATE INDEX IF NOT EXISTS idx_gems_is_active ON gems(is_active);
CREATE INDEX IF NOT EXISTS idx_gems_shape ON gems(shape);

-- Products table indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_products_display_order ON products(display_order);

-- App logs table indexes (for debugging)
CREATE INDEX IF NOT EXISTS idx_app_logs_created_at ON app_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_logs_level ON app_logs(level);
CREATE INDEX IF NOT EXISTS idx_app_logs_source ON app_logs(source);
CREATE INDEX IF NOT EXISTS idx_app_logs_level_source ON app_logs(level, source, created_at DESC);

-- Analyze tables to update statistics for query planner
ANALYZE applications;
ANALYZE pendant_generations;
ANALYZE users;
ANALYZE payments;
ANALYZE examples;
ANALYZE gems;
ANALYZE products;
ANALYZE app_logs;
