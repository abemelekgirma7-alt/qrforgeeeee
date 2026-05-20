DROP POLICY IF EXISTS "reviews_insert_any" ON public.reviews;
CREATE POLICY "reviews_insert_valid_public" ON public.reviews
FOR INSERT
WITH CHECK (
  length(trim(name)) BETWEEN 1 AND 60
  AND rating BETWEEN 1 AND 5
  AND length(trim(review_text)) BETWEEN 20 AND 800
  AND approved = false
);

DROP POLICY IF EXISTS "scan_events_insert_any" ON public.scan_events;
CREATE POLICY "scan_events_insert_valid_public" ON public.scan_events
FOR INSERT
WITH CHECK (
  qr_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.dynamic_qrs q WHERE q.id = qr_id)
);

DROP POLICY IF EXISTS "abuse_reports_insert_any" ON public.abuse_reports;
CREATE POLICY "abuse_reports_insert_valid_public" ON public.abuse_reports
FOR INSERT
WITH CHECK (
  length(trim(short_code)) > 0
  AND length(trim(reason)) > 0
  AND status = 'open'
);

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_team_member(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_team_admin(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_scan_count(uuid) FROM PUBLIC, anon, authenticated;