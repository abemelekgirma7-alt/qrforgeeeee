
-- 1. team_members: remove self-insert escalation
DROP POLICY IF EXISTS team_members_insert_admin ON public.team_members;
CREATE POLICY team_members_insert_admin ON public.team_members
  FOR INSERT WITH CHECK (
    public.is_team_admin(team_id, auth.uid())
    OR (
      -- allow team owner to bootstrap their own owner row
      auth.uid() = user_id
      AND role = 'owner'
      AND EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_id AND t.owner_id = auth.uid())
    )
  );

-- 2. blocked_urls: restrict reads to admins
DROP POLICY IF EXISTS blocked_urls_select_any ON public.blocked_urls;
CREATE POLICY blocked_urls_select_admin ON public.blocked_urls
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- 3. scan_events: only allow inserts for active QRs within valid window/limits
DROP POLICY IF EXISTS scan_events_insert_valid_public ON public.scan_events;
CREATE POLICY scan_events_insert_valid_public ON public.scan_events
  FOR INSERT WITH CHECK (
    qr_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.dynamic_qrs q
      WHERE q.id = scan_events.qr_id
        AND q.status = 'active'
        AND (q.starts_at IS NULL OR q.starts_at <= now())
        AND (q.ends_at IS NULL OR q.ends_at >= now())
        AND (q.scan_limit IS NULL OR q.scan_count < q.scan_limit)
    )
  );

-- 4. dynamic_qrs.destination: enforce http/https
ALTER TABLE public.dynamic_qrs
  ADD CONSTRAINT dynamic_qrs_destination_scheme_chk
  CHECK (destination ~* '^https?://');

-- 5. reviews: server-side rate limit
CREATE OR REPLACE FUNCTION public.enforce_review_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  recent_count int;
  last_at timestamptz;
BEGIN
  SELECT count(*), max(created_at) INTO recent_count, last_at
  FROM public.reviews
  WHERE lower(trim(name)) = lower(trim(NEW.name))
    AND created_at > now() - interval '1 day';

  IF recent_count >= 3 THEN
    RAISE EXCEPTION 'Review rate limit exceeded for this name (max 3 per day).';
  END IF;

  IF last_at IS NOT NULL AND last_at > now() - interval '60 seconds' THEN
    RAISE EXCEPTION 'Please wait before submitting another review.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reviews_rate_limit_trg ON public.reviews;
CREATE TRIGGER reviews_rate_limit_trg
  BEFORE INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.enforce_review_rate_limit();
