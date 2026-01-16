-- 1. Applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  session_id TEXT,
  current_step INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft',
  form_factor TEXT,
  material TEXT,
  size TEXT,
  input_image_url TEXT,
  user_comment TEXT,
  generated_preview TEXT,
  has_back_engraving BOOLEAN DEFAULT false,
  back_image_url TEXT,
  back_comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Pendant generations table
CREATE TABLE IF NOT EXISTS pendant_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id),
  session_id TEXT,
  input_image_url TEXT,
  user_comment TEXT,
  form_factor TEXT DEFAULT 'round',
  material TEXT DEFAULT 'silver',
  size TEXT DEFAULT 'pendant',
  output_images TEXT[] DEFAULT '{}',
  prompt_used TEXT NOT NULL,
  cost_cents INTEGER DEFAULT 0,
  model_used TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Generation settings table
CREATE TABLE IF NOT EXISTS generation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Examples table
CREATE TABLE IF NOT EXISTS examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  description TEXT,
  before_image_url TEXT,
  after_image_url TEXT,
  model_3d_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pendant_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE examples ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (for development)
DROP POLICY IF EXISTS "Allow all" ON applications;
DROP POLICY IF EXISTS "Allow all" ON pendant_generations;
DROP POLICY IF EXISTS "Allow all" ON generation_settings;
DROP POLICY IF EXISTS "Allow all" ON examples;

CREATE POLICY "Allow all" ON applications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON pendant_generations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON generation_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON examples FOR ALL USING (true) WITH CHECK (true);

-- Insert default settings (ignore if exists)
INSERT INTO generation_settings (key, value, description) VALUES
  ('num_images', '4', 'Number of images to generate'),
  ('main_prompt', '"Create a jewelry pendant from the reference image"', 'Main generation prompt')
ON CONFLICT (key) DO NOTHING;
