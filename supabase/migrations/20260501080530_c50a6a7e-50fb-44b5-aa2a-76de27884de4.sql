CREATE OR REPLACE FUNCTION public.increment_scan_count(_qr_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.dynamic_qrs SET scan_count = scan_count + 1 WHERE id = _qr_id;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_scan_count(uuid) FROM PUBLIC, anon, authenticated;