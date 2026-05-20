
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Auto create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Saved QR codes
CREATE TABLE public.saved_qrs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled QR',
  qr_type TEXT NOT NULL DEFAULT 'url',
  payload TEXT NOT NULL,
  style JSONB NOT NULL DEFAULT '{}'::jsonb,
  logo_data_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.saved_qrs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved_qrs_select_own" ON public.saved_qrs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "saved_qrs_insert_own" ON public.saved_qrs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saved_qrs_update_own" ON public.saved_qrs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "saved_qrs_delete_own" ON public.saved_qrs FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX saved_qrs_user_idx ON public.saved_qrs(user_id, created_at DESC);
