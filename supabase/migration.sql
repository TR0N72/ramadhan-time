-- =============================================
-- Ramadhan Time — Supabase Migration
-- Run this in Supabase SQL Editor
-- =============================================

-- profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  username TEXT,
  location_data JSONB
);

-- agendas table
CREATE TABLE IF NOT EXISTS agendas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  task_name TEXT NOT NULL,
  target_time TIMESTAMPTZ NOT NULL,
  is_notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendas ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Agendas RLS policies
CREATE POLICY "Users can view own agendas"
  ON agendas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agendas"
  ON agendas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agendas"
  ON agendas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own agendas"
  ON agendas FOR DELETE
  USING (auth.uid() = user_id);

-- Enable Realtime for agendas
ALTER PUBLICATION supabase_realtime ADD TABLE agendas;

-- Indexes for cron job queries
CREATE INDEX IF NOT EXISTS idx_agendas_notification_lookup
  ON agendas (is_notified, target_time)
  WHERE is_notified = FALSE;

CREATE INDEX IF NOT EXISTS idx_agendas_user_time
  ON agendas (user_id, target_time);

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, updated_at, username)
  VALUES (NEW.id, NOW(), NEW.raw_user_meta_data->>'username');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
