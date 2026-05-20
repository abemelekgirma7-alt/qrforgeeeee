-- Profiles
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

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Saved QRs
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

-- Roles
CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;
CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(),'admin') OR auth.uid() = user_id);
CREATE POLICY "user_roles_insert_admin" ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "user_roles_delete_admin" ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(),'admin'));

-- Folders
CREATE TABLE public.folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#2563EB',
  parent_id uuid REFERENCES public.folders(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "folders_select_own" ON public.folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "folders_insert_own" ON public.folders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "folders_update_own" ON public.folders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "folders_delete_own" ON public.folders FOR DELETE USING (auth.uid() = user_id);

-- Dynamic QRs
CREATE TABLE public.dynamic_qrs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  short_code text NOT NULL UNIQUE,
  name text NOT NULL DEFAULT 'Untitled',
  qr_type text NOT NULL DEFAULT 'url',
  destination text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  password_hash text,
  scan_limit int,
  scan_count int NOT NULL DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz,
  folder_id uuid REFERENCES public.folders(id) ON DELETE SET NULL,
  tags text[] DEFAULT '{}',
  campaign text,
  notes text,
  style jsonb DEFAULT '{}',
  logo_data_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_dynamic_qrs_user ON public.dynamic_qrs(user_id);
CREATE INDEX idx_dynamic_qrs_short_code ON public.dynamic_qrs(short_code);
CREATE INDEX idx_dynamic_qrs_folder ON public.dynamic_qrs(folder_id);
ALTER TABLE public.dynamic_qrs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dynamic_qrs_select_own" ON public.dynamic_qrs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "dynamic_qrs_insert_own" ON public.dynamic_qrs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "dynamic_qrs_update_own" ON public.dynamic_qrs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "dynamic_qrs_delete_own" ON public.dynamic_qrs FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.validate_dynamic_qr_window()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.starts_at IS NOT NULL AND NEW.ends_at IS NOT NULL AND NEW.ends_at <= NEW.starts_at THEN
    RAISE EXCEPTION 'ends_at must be after starts_at';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_validate_dynamic_qr_window BEFORE INSERT OR UPDATE ON public.dynamic_qrs
  FOR EACH ROW EXECUTE FUNCTION public.validate_dynamic_qr_window();

-- Scan events
CREATE TABLE public.scan_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_id uuid NOT NULL REFERENCES public.dynamic_qrs(id) ON DELETE CASCADE,
  scanned_at timestamptz NOT NULL DEFAULT now(),
  country text, city text, device_type text, browser text, os text,
  referrer text, language text,
  utm_source text, utm_medium text, utm_campaign text,
  visitor_hash text, destination_used text
);
CREATE INDEX idx_scan_events_qr ON public.scan_events(qr_id);
CREATE INDEX idx_scan_events_scanned_at ON public.scan_events(scanned_at DESC);
ALTER TABLE public.scan_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scan_events_insert_any" ON public.scan_events FOR INSERT
  WITH CHECK (qr_id IS NOT NULL AND (country IS NULL OR length(country) <= 4) AND (city IS NULL OR length(city) <= 100));
CREATE POLICY "scan_events_select_own" ON public.scan_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.dynamic_qrs q WHERE q.id = scan_events.qr_id AND q.user_id = auth.uid()));

-- API keys
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  key_prefix text NOT NULL,
  scopes text[] NOT NULL DEFAULT '{read}',
  rate_limit int NOT NULL DEFAULT 100,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_api_keys_user ON public.api_keys(user_id);
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_keys_select_own" ON public.api_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "api_keys_insert_own" ON public.api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "api_keys_delete_own" ON public.api_keys FOR DELETE USING (auth.uid() = user_id);

-- Teams
CREATE TYPE public.team_role AS ENUM ('owner','admin','editor','viewer');
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.team_role NOT NULL DEFAULT 'viewer',
  invited_email text,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);
CREATE INDEX idx_team_members_user ON public.team_members(user_id);
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.is_team_member(_team_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.team_members WHERE team_id = _team_id AND user_id = _user_id);
$$;
CREATE OR REPLACE FUNCTION public.is_team_admin(_team_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.team_members WHERE team_id = _team_id AND user_id = _user_id AND role IN ('owner','admin'));
$$;
CREATE POLICY "teams_select_member" ON public.teams FOR SELECT USING (public.is_team_member(id, auth.uid()));
CREATE POLICY "teams_insert_owner" ON public.teams FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "teams_update_admin" ON public.teams FOR UPDATE USING (public.is_team_admin(id, auth.uid()));
CREATE POLICY "teams_delete_owner" ON public.teams FOR DELETE USING (auth.uid() = owner_id);
CREATE POLICY "team_members_select_member" ON public.team_members FOR SELECT USING (public.is_team_member(team_id, auth.uid()));
CREATE POLICY "team_members_insert_admin" ON public.team_members FOR INSERT WITH CHECK (public.is_team_admin(team_id, auth.uid()) OR auth.uid() = user_id);
CREATE POLICY "team_members_delete_admin" ON public.team_members FOR DELETE USING (public.is_team_admin(team_id, auth.uid()));

-- Templates
CREATE TABLE public.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  qr_type text NOT NULL DEFAULT 'url',
  config jsonb NOT NULL DEFAULT '{}',
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "templates_select_public_or_own" ON public.templates FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "templates_insert_own" ON public.templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "templates_update_own" ON public.templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "templates_delete_own" ON public.templates FOR DELETE USING (auth.uid() = user_id);

-- Bulk jobs
CREATE TABLE public.bulk_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'Bulk job',
  total int NOT NULL DEFAULT 0,
  processed int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'queued',
  result_url text, error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bulk_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bulk_jobs_select_own" ON public.bulk_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bulk_jobs_insert_own" ON public.bulk_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bulk_jobs_update_own" ON public.bulk_jobs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "bulk_jobs_delete_own" ON public.bulk_jobs FOR DELETE USING (auth.uid() = user_id);

-- Abuse reports
CREATE TABLE public.abuse_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_id uuid REFERENCES public.dynamic_qrs(id) ON DELETE SET NULL,
  reporter_email text,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.abuse_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "abuse_reports_insert_any" ON public.abuse_reports FOR INSERT
  WITH CHECK (length(reason) BETWEEN 5 AND 2000 AND (reporter_email IS NULL OR length(reporter_email) <= 255));
CREATE POLICY "abuse_reports_select_admin" ON public.abuse_reports FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "abuse_reports_update_admin" ON public.abuse_reports FOR UPDATE USING (public.has_role(auth.uid(),'admin'));

-- Blocked URLs
CREATE TABLE public.blocked_urls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern text NOT NULL UNIQUE,
  reason text, added_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.blocked_urls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blocked_urls_select_any" ON public.blocked_urls FOR SELECT USING (true);
CREATE POLICY "blocked_urls_insert_admin" ON public.blocked_urls FOR INSERT WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "blocked_urls_delete_admin" ON public.blocked_urls FOR DELETE USING (public.has_role(auth.uid(),'admin'));

-- updated_at helper
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_folders_touch BEFORE UPDATE ON public.folders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_dynamic_qrs_touch BEFORE UPDATE ON public.dynamic_qrs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_templates_touch BEFORE UPDATE ON public.templates FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_bulk_jobs_touch BEFORE UPDATE ON public.bulk_jobs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_team_member(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_team_admin(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_dynamic_qr_window() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

-- Scan increment
CREATE OR REPLACE FUNCTION public.increment_scan_count(_qr_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.dynamic_qrs SET scan_count = scan_count + 1 WHERE id = _qr_id;
$$;
REVOKE EXECUTE ON FUNCTION public.increment_scan_count(uuid) FROM PUBLIC, anon, authenticated;

-- Reviews (new) — public testimonials with moderation
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  role text CHECK (role IS NULL OR char_length(role) <= 100),
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text text NOT NULL CHECK (char_length(review_text) BETWEEN 10 AND 1000),
  avatar_url text CHECK (avatar_url IS NULL OR char_length(avatar_url) <= 2048),
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_public_read_approved" ON public.reviews FOR SELECT USING (approved = true);
CREATE POLICY "reviews_author_read_own" ON public.reviews FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "reviews_admin_read_all" ON public.reviews FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "reviews_anyone_insert_pending" ON public.reviews FOR INSERT WITH CHECK (approved = false);
CREATE POLICY "reviews_admin_update" ON public.reviews FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "reviews_admin_delete" ON public.reviews FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX reviews_approved_created_idx ON public.reviews (approved, created_at DESC);