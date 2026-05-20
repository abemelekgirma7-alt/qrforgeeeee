DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typname = 'team_role') THEN
    CREATE TYPE public.team_role AS ENUM ('owner', 'admin', 'editor', 'viewer');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  display_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE TABLE IF NOT EXISTS public.saved_qrs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'Untitled QR',
  qr_type text NOT NULL DEFAULT 'url',
  payload text NOT NULL,
  style jsonb NOT NULL DEFAULT '{}'::jsonb,
  logo_data_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.saved_qrs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS saved_qrs_user_idx ON public.saved_qrs(user_id, created_at DESC);
DROP POLICY IF EXISTS "saved_qrs_select_own" ON public.saved_qrs;
DROP POLICY IF EXISTS "saved_qrs_insert_own" ON public.saved_qrs;
DROP POLICY IF EXISTS "saved_qrs_update_own" ON public.saved_qrs;
DROP POLICY IF EXISTS "saved_qrs_delete_own" ON public.saved_qrs;
CREATE POLICY "saved_qrs_select_own" ON public.saved_qrs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "saved_qrs_insert_own" ON public.saved_qrs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saved_qrs_update_own" ON public.saved_qrs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "saved_qrs_delete_own" ON public.saved_qrs FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
DROP POLICY IF EXISTS "user_roles_select" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete_admin" ON public.user_roles;
CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles_insert_admin" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles_delete_admin" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#2563EB',
  parent_id uuid REFERENCES public.folders(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "folders_select_own" ON public.folders;
DROP POLICY IF EXISTS "folders_insert_own" ON public.folders;
DROP POLICY IF EXISTS "folders_update_own" ON public.folders;
DROP POLICY IF EXISTS "folders_delete_own" ON public.folders;
CREATE POLICY "folders_select_own" ON public.folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "folders_insert_own" ON public.folders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "folders_update_own" ON public.folders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "folders_delete_own" ON public.folders FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.dynamic_qrs (
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
CREATE INDEX IF NOT EXISTS idx_dynamic_qrs_user ON public.dynamic_qrs(user_id);
CREATE INDEX IF NOT EXISTS idx_dynamic_qrs_short_code ON public.dynamic_qrs(short_code);
CREATE INDEX IF NOT EXISTS idx_dynamic_qrs_folder ON public.dynamic_qrs(folder_id);
ALTER TABLE public.dynamic_qrs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dynamic_qrs_select_own" ON public.dynamic_qrs;
DROP POLICY IF EXISTS "dynamic_qrs_insert_own" ON public.dynamic_qrs;
DROP POLICY IF EXISTS "dynamic_qrs_update_own" ON public.dynamic_qrs;
DROP POLICY IF EXISTS "dynamic_qrs_delete_own" ON public.dynamic_qrs;
CREATE POLICY "dynamic_qrs_select_own" ON public.dynamic_qrs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "dynamic_qrs_insert_own" ON public.dynamic_qrs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "dynamic_qrs_update_own" ON public.dynamic_qrs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "dynamic_qrs_delete_own" ON public.dynamic_qrs FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.validate_dynamic_qr_window()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.starts_at IS NOT NULL AND NEW.ends_at IS NOT NULL AND NEW.ends_at <= NEW.starts_at THEN
    RAISE EXCEPTION 'ends_at must be after starts_at';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_validate_dynamic_qr_window ON public.dynamic_qrs;
CREATE TRIGGER trg_validate_dynamic_qr_window
  BEFORE INSERT OR UPDATE ON public.dynamic_qrs
  FOR EACH ROW EXECUTE FUNCTION public.validate_dynamic_qr_window();

CREATE TABLE IF NOT EXISTS public.scan_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_id uuid NOT NULL REFERENCES public.dynamic_qrs(id) ON DELETE CASCADE,
  scanned_at timestamptz NOT NULL DEFAULT now(),
  country text,
  city text,
  device_type text,
  browser text,
  os text,
  referrer text,
  language text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  visitor_hash text,
  destination_used text
);
CREATE INDEX IF NOT EXISTS idx_scan_events_qr ON public.scan_events(qr_id);
CREATE INDEX IF NOT EXISTS idx_scan_events_scanned_at ON public.scan_events(scanned_at DESC);
ALTER TABLE public.scan_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "scan_events_insert_any" ON public.scan_events;
DROP POLICY IF EXISTS "scan_events_select_own" ON public.scan_events;
CREATE POLICY "scan_events_insert_any" ON public.scan_events FOR INSERT WITH CHECK (true);
CREATE POLICY "scan_events_select_own" ON public.scan_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.dynamic_qrs q WHERE q.id = scan_events.qr_id AND q.user_id = auth.uid())
);

CREATE TABLE IF NOT EXISTS public.api_keys (
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
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON public.api_keys(user_id);
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "api_keys_select_own" ON public.api_keys;
DROP POLICY IF EXISTS "api_keys_insert_own" ON public.api_keys;
DROP POLICY IF EXISTS "api_keys_delete_own" ON public.api_keys;
CREATE POLICY "api_keys_select_own" ON public.api_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "api_keys_insert_own" ON public.api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "api_keys_delete_own" ON public.api_keys FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text,
  rating int NOT NULL DEFAULT 5,
  review_text text NOT NULL,
  avatar_url text,
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reviews_insert_any" ON public.reviews;
DROP POLICY IF EXISTS "reviews_select_approved_or_admin" ON public.reviews;
DROP POLICY IF EXISTS "reviews_update_admin" ON public.reviews;
DROP POLICY IF EXISTS "reviews_delete_admin" ON public.reviews;
CREATE POLICY "reviews_insert_any" ON public.reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "reviews_select_approved_or_admin" ON public.reviews FOR SELECT USING (approved = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "reviews_update_admin" ON public.reviews FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "reviews_delete_admin" ON public.reviews FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.team_role NOT NULL DEFAULT 'viewer',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);
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
DROP POLICY IF EXISTS "teams_select_member" ON public.teams;
DROP POLICY IF EXISTS "teams_insert_owner" ON public.teams;
DROP POLICY IF EXISTS "teams_update_admin" ON public.teams;
DROP POLICY IF EXISTS "teams_delete_owner" ON public.teams;
DROP POLICY IF EXISTS "team_members_select_member" ON public.team_members;
DROP POLICY IF EXISTS "team_members_insert_admin" ON public.team_members;
DROP POLICY IF EXISTS "team_members_delete_admin" ON public.team_members;
CREATE POLICY "teams_select_member" ON public.teams FOR SELECT USING (public.is_team_member(id, auth.uid()));
CREATE POLICY "teams_insert_owner" ON public.teams FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "teams_update_admin" ON public.teams FOR UPDATE USING (public.is_team_admin(id, auth.uid()));
CREATE POLICY "teams_delete_owner" ON public.teams FOR DELETE USING (auth.uid() = owner_id);
CREATE POLICY "team_members_select_member" ON public.team_members FOR SELECT USING (public.is_team_member(team_id, auth.uid()));
CREATE POLICY "team_members_insert_admin" ON public.team_members FOR INSERT WITH CHECK (public.is_team_admin(team_id, auth.uid()) OR auth.uid() = user_id);
CREATE POLICY "team_members_delete_admin" ON public.team_members FOR DELETE USING (public.is_team_admin(team_id, auth.uid()));

CREATE TABLE IF NOT EXISTS public.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  qr_type text NOT NULL DEFAULT 'url',
  payload text NOT NULL,
  style jsonb NOT NULL DEFAULT '{}'::jsonb,
  logo_data_url text,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "templates_select_public_or_own" ON public.templates;
DROP POLICY IF EXISTS "templates_insert_own" ON public.templates;
DROP POLICY IF EXISTS "templates_update_own" ON public.templates;
DROP POLICY IF EXISTS "templates_delete_own" ON public.templates;
CREATE POLICY "templates_select_public_or_own" ON public.templates FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "templates_insert_own" ON public.templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "templates_update_own" ON public.templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "templates_delete_own" ON public.templates FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.bulk_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  qr_type text NOT NULL DEFAULT 'url',
  rows jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  created_count int NOT NULL DEFAULT 0,
  failed_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bulk_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bulk_jobs_select_own" ON public.bulk_jobs;
DROP POLICY IF EXISTS "bulk_jobs_insert_own" ON public.bulk_jobs;
DROP POLICY IF EXISTS "bulk_jobs_update_own" ON public.bulk_jobs;
DROP POLICY IF EXISTS "bulk_jobs_delete_own" ON public.bulk_jobs;
CREATE POLICY "bulk_jobs_select_own" ON public.bulk_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bulk_jobs_insert_own" ON public.bulk_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bulk_jobs_update_own" ON public.bulk_jobs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "bulk_jobs_delete_own" ON public.bulk_jobs FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.abuse_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  short_code text NOT NULL,
  reason text NOT NULL,
  details text,
  reporter_email text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.abuse_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "abuse_reports_insert_any" ON public.abuse_reports;
DROP POLICY IF EXISTS "abuse_reports_select_admin" ON public.abuse_reports;
DROP POLICY IF EXISTS "abuse_reports_update_admin" ON public.abuse_reports;
CREATE POLICY "abuse_reports_insert_any" ON public.abuse_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "abuse_reports_select_admin" ON public.abuse_reports FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "abuse_reports_update_admin" ON public.abuse_reports FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.blocked_urls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL UNIQUE,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.blocked_urls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "blocked_urls_select_any" ON public.blocked_urls;
DROP POLICY IF EXISTS "blocked_urls_insert_admin" ON public.blocked_urls;
DROP POLICY IF EXISTS "blocked_urls_delete_admin" ON public.blocked_urls;
CREATE POLICY "blocked_urls_select_any" ON public.blocked_urls FOR SELECT USING (true);
CREATE POLICY "blocked_urls_insert_admin" ON public.blocked_urls FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "blocked_urls_delete_admin" ON public.blocked_urls FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','saved_qrs','folders','dynamic_qrs','bulk_jobs'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()', t, t);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.increment_scan_count(_qr_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.dynamic_qrs
  SET scan_count = scan_count + 1
  WHERE id = _qr_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.increment_scan_count(uuid) FROM PUBLIC, anon, authenticated;