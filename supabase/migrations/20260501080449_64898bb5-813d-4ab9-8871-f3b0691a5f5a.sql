-- Restrict EXECUTE on the helper functions to only postgres + service role.
-- They are only ever called from inside RLS policies, so anon/auth never need
-- to call them directly.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_team_member(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_team_admin(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_dynamic_qr_window() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

-- The two intentionally-public INSERT policies (scan_events + abuse_reports)
-- need to stay open because the redirect endpoint and the public report form
-- run unauthenticated. Add a small length sanity check to discourage spam.
DROP POLICY "scan_events_insert_any" ON public.scan_events;
CREATE POLICY "scan_events_insert_any" ON public.scan_events FOR INSERT
  WITH CHECK (
    qr_id IS NOT NULL
    AND (country IS NULL OR length(country) <= 4)
    AND (city IS NULL OR length(city) <= 100)
  );

DROP POLICY "abuse_reports_insert_any" ON public.abuse_reports;
CREATE POLICY "abuse_reports_insert_any" ON public.abuse_reports FOR INSERT
  WITH CHECK (
    length(reason) BETWEEN 5 AND 2000
    AND (reporter_email IS NULL OR length(reporter_email) <= 255)
  );