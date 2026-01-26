-- Create margin_configs table for storing user margin configurations
-- This allows users to customize global and per-model margin percentages

CREATE TABLE IF NOT EXISTS public.margin_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  global_margin_percent NUMERIC NOT NULL DEFAULT 60,
  model_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.margin_configs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own margin configs
CREATE POLICY "Users can read own margin configs"
  ON public.margin_configs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own margin configs
CREATE POLICY "Users can insert own margin configs"
  ON public.margin_configs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own margin configs
CREATE POLICY "Users can update own margin configs"
  ON public.margin_configs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own margin configs
CREATE POLICY "Users can delete own margin configs"
  ON public.margin_configs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_margin_configs_user_id ON public.margin_configs(user_id);

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on UPDATE
CREATE TRIGGER update_margin_configs_updated_at
  BEFORE UPDATE ON public.margin_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE public.margin_configs IS 'Stores user-specific margin configurations for credit calculation';
COMMENT ON COLUMN public.margin_configs.global_margin_percent IS 'Default margin percentage applied to all models (e.g., 60 for 60%)';
COMMENT ON COLUMN public.margin_configs.model_overrides IS 'Per-model margin overrides stored as JSON object with model_id as keys';
