-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits INTEGER NOT NULL DEFAULT 100,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Models table (admin-configured)
CREATE TABLE models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  model_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('agnes', 'sensenova')),
  api_key TEXT,
  api_endpoint TEXT NOT NULL,
  credits_per_use INTEGER NOT NULL DEFAULT 2,
  is_active BOOLEAN NOT NULL DEFAULT true,
  supports_img2img BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Generations table (user-created images)
CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  model_id TEXT NOT NULL,
  model_name TEXT,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  reference_image_url TEXT,
  width INTEGER NOT NULL DEFAULT 1024,
  height INTEGER NOT NULL DEFAULT 1024,
  credits_used INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Credit recharges table
CREATE TABLE credit_recharges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_generations_user_id ON generations(user_id);
CREATE INDEX idx_generations_created_at ON generations(created_at DESC);
CREATE INDEX idx_credit_recharges_user_id ON credit_recharges(user_id);
CREATE INDEX idx_credit_recharges_status ON credit_recharges(status);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_recharges ENABLE ROW LEVEL SECURITY;

-- Admin check helper: SECURITY DEFINER runs as owner and bypasses RLS on
-- profiles, so policies can call it without re-triggering profiles' own
-- policies (which would recurse infinitely: error 42P17).
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND is_admin = true
  );
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    public.is_admin()
  );

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    public.is_admin()
  );

-- Models policies (everyone can read active models, only admins can modify)
CREATE POLICY "Anyone can view active models" ON models
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can view all models" ON models
  FOR SELECT USING (
    public.is_admin()
  );

CREATE POLICY "Admins can insert models" ON models
  FOR INSERT WITH CHECK (
    public.is_admin()
  );

CREATE POLICY "Admins can update models" ON models
  FOR UPDATE USING (
    public.is_admin()
  );

CREATE POLICY "Admins can delete models" ON models
  FOR DELETE USING (
    public.is_admin()
  );

-- Generations policies
CREATE POLICY "Users can view own generations" ON generations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generations" ON generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own generations" ON generations
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view all generations (for gallery)" ON generations
  FOR SELECT USING (true);

CREATE POLICY "Admins can view all generations" ON generations
  FOR SELECT USING (
    public.is_admin()
  );

-- Credit recharges policies
CREATE POLICY "Users can view own recharges" ON credit_recharges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recharges" ON credit_recharges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all recharges" ON credit_recharges
  FOR SELECT USING (
    public.is_admin()
  );

CREATE POLICY "Admins can update all recharges" ON credit_recharges
  FOR UPDATE USING (
    public.is_admin()
  );

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, credits, is_admin)
  VALUES (new.id, 100, false);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default models
INSERT INTO models (name, model_id, provider, api_endpoint, credits_per_use, is_active, supports_img2img) VALUES
  ('Agnes Image 2.1 Flash', 'agnes-image-2.1-flash', 'agnes', 'https://apihub.agnes-ai.com/v1/images/generations', 2, true, true),
  ('Agnes Image 2.0 Flash', 'agnes-image-2.0-flash', 'agnes', 'https://apihub.agnes-ai.com/v1/images/generations', 2, true, true),
  ('Sensenova u1-fast', 'sensenova-u1-fast', 'sensenova', 'https://api.sensenova.cn/v1/images/generations', 3, true, true);
