// Public QR redirect endpoint. Handles dynamic QR short codes:
//   - Looks up the destination by short_code
//   - Enforces status (active/paused/expired), scan limits, schedule window
//   - Logs an anonymized scan_events row
//   - Redirects to the destination (or to a fallback HTML page)
// No JWT required — this is the public scan endpoint.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function fallbackPage(title: string, message: string, status = 410): Response {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>body{font-family:system-ui,-apple-system,sans-serif;background:#0f172a;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;text-align:center}
    .card{max-width:420px;background:#1e293b;border-radius:16px;padding:32px}
    h1{margin:0 0 12px;font-size:22px}p{margin:0;opacity:.8;line-height:1.5}</style>
    </head><body><div class="card"><h1>${title}</h1><p>${message}</p></div></body></html>`;
  return new Response(html, { status, headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } });
}

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function parseUA(ua: string) {
  const u = ua.toLowerCase();
  const device = /mobile|iphone|android.*mobile/.test(u) ? "mobile" : /ipad|tablet/.test(u) ? "tablet" : "desktop";
  const browser = /edg\//.test(u) ? "Edge" : /chrome\//.test(u) ? "Chrome" : /firefox\//.test(u) ? "Firefox" : /safari\//.test(u) ? "Safari" : "Other";
  const os = /windows/.test(u) ? "Windows" : /mac os/.test(u) ? "macOS" : /android/.test(u) ? "Android" : /iphone|ipad|ios/.test(u) ? "iOS" : /linux/.test(u) ? "Linux" : "Other";
  return { device, browser, os };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  // The Supabase function URL is .../qr-redirect/<code>. Extract the last segment.
  const parts = url.pathname.split("/").filter(Boolean);
  const code = parts[parts.length - 1];
  if (!code || code === "qr-redirect") {
    return fallbackPage("Invalid QR", "This link is missing a code.", 400);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  const { data: qr, error } = await supabase
    .from("dynamic_qrs")
    .select("id,user_id,destination,status,scan_limit,scan_count,starts_at,ends_at,password_hash")
    .eq("short_code", code)
    .maybeSingle();

  if (error || !qr) {
    return fallbackPage("QR not found", "This dynamic QR code does not exist or has been deleted.", 404);
  }

  // Status checks
  if (qr.status === "paused") {
    return fallbackPage("QR paused", "The owner has temporarily paused this QR code.");
  }
  if (qr.status === "expired") {
    return fallbackPage("QR expired", "This QR code is no longer active.");
  }

  const now = new Date();
  if (qr.starts_at && new Date(qr.starts_at) > now) {
    return fallbackPage("Not active yet", "This QR code is scheduled for a later time.");
  }
  if (qr.ends_at && new Date(qr.ends_at) < now) {
    return fallbackPage("QR expired", "This QR code's scheduled window has ended.");
  }

  if (qr.scan_limit && qr.scan_count >= qr.scan_limit) {
    return fallbackPage("Scan limit reached", "This QR has reached its maximum number of scans.");
  }

  // Validate destination scheme — only http/https allowed
  if (!/^https?:\/\//i.test(qr.destination)) {
    return fallbackPage("Invalid destination", "Only HTTP/HTTPS destinations are supported.", 400);
  }

  // Block-list check — fail closed on query error
  const { data: blocks, error: blocksError } = await supabase
    .from("blocked_urls")
    .select("domain");
  if (blocksError) {
    return fallbackPage("Safety check failed", "Unable to verify destination safety. Please try again later.", 503);
  }
  if (blocks?.some((b) => qr.destination.includes(b.domain))) {
    return fallbackPage("Blocked destination", "This destination is flagged as unsafe.", 403);
  }

  // Anonymized analytics
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "0.0.0.0";
  const ua = req.headers.get("user-agent") || "";
  const referer = req.headers.get("referer");
  const lang = req.headers.get("accept-language")?.split(",")[0] || null;
  const country = req.headers.get("cf-ipcountry") || req.headers.get("x-vercel-ip-country") || null;
  const city = req.headers.get("cf-ipcity") || req.headers.get("x-vercel-ip-city") || null;
  const { device, browser, os } = parseUA(ua);
  const visitorHash = await sha256(`${ip}|${ua}|${qr.id}`);

  const utm = {
    utm_source: url.searchParams.get("utm_source"),
    utm_medium: url.searchParams.get("utm_medium"),
    utm_campaign: url.searchParams.get("utm_campaign"),
  };

  // Fire-and-forget insert + scan_count increment
  await Promise.all([
    supabase.from("scan_events").insert({
      qr_id: qr.id,
      country: country?.slice(0, 4) ?? null,
      city: city?.slice(0, 100) ?? null,
      device_type: device,
      browser,
      os,
      referrer: referer?.slice(0, 500) ?? null,
      language: lang?.slice(0, 16) ?? null,
      utm_source: utm.utm_source?.slice(0, 100) ?? null,
      utm_medium: utm.utm_medium?.slice(0, 100) ?? null,
      utm_campaign: utm.utm_campaign?.slice(0, 100) ?? null,
      visitor_hash: visitorHash,
      destination_used: qr.destination.slice(0, 2000),
    }),
    supabase.rpc("increment_scan_count", { _qr_id: qr.id }).then(
      // ignore — will fall back to direct update if rpc missing
      undefined,
      async () => {
        await supabase
          .from("dynamic_qrs")
          .update({ scan_count: (qr.scan_count ?? 0) + 1 })
          .eq("id", qr.id);
      },
    ),
  ]);

  // Redirect
  return new Response(null, {
    status: 302,
    headers: { ...corsHeaders, Location: qr.destination },
  });
});