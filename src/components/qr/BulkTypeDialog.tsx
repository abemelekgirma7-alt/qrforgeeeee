import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type BulkType =
  | "url"
  | "text"
  | "wifi"
  | "phone"
  | "email"
  | "vcard"
  | "menu"
  | "wedding"
  | "rsvp"
  | "instagram"
  | "payment"
  | "ticket"
  | "pdf";

export type BulkDialogResult = {
  type: BulkType;
  label: string;
  payload: string;
};

const TYPE_LABELS: Record<BulkType, string> = {
  url: "Website / URL",
  text: "Plain text",
  wifi: "WiFi network",
  phone: "Phone number",
  email: "Email address",
  vcard: "Contact (vCard)",
  menu: "Restaurant menu",
  wedding: "Wedding invite",
  rsvp: "RSVP",
  instagram: "Instagram handle",
  payment: "Payment link",
  ticket: "Event ticket",
  pdf: "PDF link",
};

type Props = {
  open: boolean;
  initialValue: string;
  initialType: BulkType;
  onClose: () => void;
  onSubmit: (result: BulkDialogResult) => void;
};

export function BulkTypeDialog({ open, initialValue, initialType, onClose, onSubmit }: Props) {
  const [type, setType] = useState<BulkType>(initialType);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setType(initialType);
    setFields(seedFields(initialType, initialValue));
    setTouched({});
    setSubmitAttempted(false);
  }, [open, initialType, initialValue]);

  const changeType = (next: BulkType) => {
    setType(next);
    setFields(seedFields(next, ""));
    setTouched({});
    setSubmitAttempted(false);
  };

  const update = (k: string, v: string) =>
    setFields((p) => ({ ...p, [k]: v }));

  const errors = useMemo(() => validate(type, fields), [type, fields]);
  const isValid = Object.keys(errors).length === 0;

  const submit = () => {
    setSubmitAttempted(true);
    if (!isValid) return;
    const built = buildPayload(type, fields);
    if (!built) return;
    // analytics: bulk dialog submit
    try {
      window.dispatchEvent(new CustomEvent("qrforge:bulk-dialog-submit", { detail: { type } }));
    } catch { /* ignore */ }
    onSubmit({ type, ...built });
  };

  // analytics: bulk dialog open
  useEffect(() => {
    if (!open) return;
    try {
      window.dispatchEvent(new CustomEvent("qrforge:bulk-dialog-open", { detail: { type: initialType } }));
    } catch { /* ignore */ }
  }, [open, initialType]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="sm:max-w-md max-h-[85vh] overflow-y-auto"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && (e.target as HTMLElement).tagName !== "TEXTAREA") {
            e.preventDefault();
            submit();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Add a bulk entry</DialogTitle>
          <DialogDescription>
            Pick a content type and fill in the required details. Switching the type clears the fields.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Content type
            </Label>
            <Select value={type} onValueChange={(v) => changeType(v as BulkType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(TYPE_LABELS) as BulkType[]).map((t) => (
                  <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <TypeFields
            type={type}
            values={fields}
            onChange={update}
            errors={errors}
            touched={touched}
            submitAttempted={submitAttempted}
            onBlur={(k) => setTouched((p) => ({ ...p, [k]: true }))}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!isValid}>Add entry</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Per-type field schema ───────────────────────────────── */

type FieldProps = {
  type: BulkType;
  values: Record<string, string>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  submitAttempted: boolean;
  onChange: (k: string, v: string) => void;
  onBlur: (k: string) => void;
};

function TypeFields({ type, values, onChange, errors, touched, submitAttempted, onBlur }: FieldProps) {
  const showErr = (k: string) => (touched[k] || submitAttempted) && errors[k];

  const F = (
    k: string,
    label: string,
    placeholder = "",
    textarea = false,
  ) => {
    const err = showErr(k);
    return (
      <div className="space-y-1.5" key={k}>
        <Label className="text-xs font-medium">{label}</Label>
        {textarea ? (
          <Textarea
            value={values[k] || ""}
            onChange={(e) => onChange(k, e.target.value)}
            onBlur={() => onBlur(k)}
            placeholder={placeholder}
            rows={3}
            className={cn(err && "border-destructive focus-visible:ring-destructive")}
            aria-invalid={!!err}
          />
        ) : (
          <Input
            value={values[k] || ""}
            onChange={(e) => onChange(k, e.target.value)}
            onBlur={() => onBlur(k)}
            placeholder={placeholder}
            className={cn(err && "border-destructive focus-visible:ring-destructive")}
            aria-invalid={!!err}
          />
        )}
        {err && <p className="text-[11px] text-destructive">{err}</p>}
      </div>
    );
  };

  switch (type) {
    case "url":
      return <>{F("url", "Website URL *", "https://example.com")}</>;
    case "text":
      return <>{F("text", "Plain text *", "Anything you want encoded…", true)}</>;
    case "wifi":
      return (
        <>
          {F("ssid", "Network name (SSID) *", "MyWiFi")}
          {F("password", "Password", "••••••••")}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Encryption</Label>
            <Select value={values.encryption || "WPA"} onValueChange={(v) => onChange("encryption", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="WPA">WPA / WPA2 / WPA3</SelectItem>
                <SelectItem value="WEP">WEP</SelectItem>
                <SelectItem value="nopass">Open (no password)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      );
    case "phone":
      return (
        <>
          {F("phone", "Phone number *", "+1 555 123 4567")}
          {F("name", "Contact name (optional)", "Whose number is this?")}
        </>
      );
    case "email":
      return (
        <>
          {F("email", "Email address *", "hello@example.com")}
          {F("subject", "Subject (optional)", "Hello")}
          {F("body", "Message (optional)", "Your message…", true)}
        </>
      );
    case "vcard":
      return (
        <>
          {F("firstName", "First name *", "Jane")}
          {F("lastName", "Last name", "Doe")}
          {F("org", "Organization", "Acme Inc.")}
          {F("title", "Job title", "Designer")}
          {F("phone", "Phone", "+1 555 123 4567")}
          {F("email", "Email", "jane@acme.com")}
          {F("website", "Website", "https://acme.com")}
        </>
      );
    case "menu":
      return (
        <>
          {F("url", "Menu URL *", "https://menu.example.com")}
          {F("restaurant", "Restaurant name (optional)", "Acme Café")}
        </>
      );
    case "wedding":
      return (
        <>
          {F("partner1", "Partner 1 name *", "Alice")}
          {F("partner2", "Partner 2 name *", "Bob")}
          {F("date", "Date", "2026-06-15")}
          {F("venue", "Venue", "The Grand Ballroom")}
          {F("note", "Note (optional)", "Reception to follow", true)}
        </>
      );
    case "rsvp":
      return (
        <>
          {F("event", "Event name *", "Summer Gala 2026")}
          {F("link", "RSVP link *", "https://rsvp.example.com")}
          {F("deadline", "Reply by", "2026-08-01")}
          {F("host", "Host (optional)", "The Team")}
        </>
      );
    case "instagram":
      return <>{F("handle", "Instagram handle *", "@yourbrand")}</>;
    case "payment":
      return (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Provider</Label>
            <Select value={values.provider || "paypal"} onValueChange={(v) => onChange("provider", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="venmo">Venmo</SelectItem>
                <SelectItem value="cashapp">Cash App</SelectItem>
                <SelectItem value="url">Custom URL</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {F("handle", "Payee handle / URL *", "@yourname")}
          {F("amount", "Amount (optional)", "25.00")}
        </>
      );
    case "ticket":
      return (
        <>
          {F("eventName", "Event name *", "Summer Festival 2026")}
          {F("attendee", "Attendee name *", "Jane Doe")}
          {F("seat", "Seat / section", "A-12")}
          {F("date", "Date & time", "2026-07-04 19:00")}
          {F("ticketId", "Ticket ID *", "TKT-00042")}
          {F("venue", "Venue", "Madison Square Garden")}
        </>
      );
    case "pdf":
      return (
        <>
          {F("url", "PDF link *", "https://drive.google.com/file/d/…")}
          {F("title", "Document title (optional)", "2026 brochure")}
        </>
      );
  }
}

/* ── Validation ──────────────────────────────────────────── */

function validate(type: BulkType, f: Record<string, string>): Record<string, string> {
  const e: Record<string, string> = {};
  const v = (k: string) => (f[k] || "").trim();
  const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  const isUrlish = (s: string) => /^(https?:\/\/)?[^\s.]+\.[^\s]{2,}/i.test(s);
  const isPhone = (s: string) => /^[+\d][\d\s().-]{5,}$/.test(s);

  switch (type) {
    case "url":
      if (!v("url")) e.url = "Required";
      else if (!isUrlish(v("url"))) e.url = "Looks like an invalid URL";
      break;
    case "text":
      if (!v("text")) e.text = "Required";
      break;
    case "wifi":
      if (!v("ssid")) e.ssid = "Network name is required";
      break;
    case "phone":
      if (!v("phone")) e.phone = "Phone number is required";
      else if (!isPhone(v("phone"))) e.phone = "Invalid phone format";
      break;
    case "email":
      if (!v("email")) e.email = "Email is required";
      else if (!isEmail(v("email"))) e.email = "Invalid email address";
      break;
    case "vcard":
      if (!v("firstName")) e.firstName = "First name is required";
      if (v("email") && !isEmail(v("email"))) e.email = "Invalid email address";
      if (v("website") && !isUrlish(v("website"))) e.website = "Invalid website URL";
      break;
    case "menu":
      if (!v("url")) e.url = "Menu URL is required";
      else if (!isUrlish(v("url"))) e.url = "Invalid URL";
      break;
    case "wedding":
      if (!v("partner1")) e.partner1 = "Required";
      if (!v("partner2")) e.partner2 = "Required";
      break;
    case "rsvp":
      if (!v("event")) e.event = "Event name is required";
      if (!v("link")) e.link = "RSVP link is required";
      else if (!isUrlish(v("link"))) e.link = "Invalid URL";
      break;
    case "instagram":
      if (!v("handle")) e.handle = "Handle is required";
      break;
    case "payment":
      if (!v("handle")) e.handle = "Required";
      break;
    case "ticket":
      if (!v("eventName")) e.eventName = "Event name is required";
      if (!v("attendee")) e.attendee = "Attendee name is required";
      if (!v("ticketId")) e.ticketId = "Ticket ID is required";
      break;
    case "pdf":
      if (!v("url")) e.url = "PDF link is required";
      else if (!isUrlish(v("url"))) e.url = "Invalid URL";
      break;
  }
  return e;
}

/* ── Seed fields when opening dialog from a raw string ─── */

function seedFields(type: BulkType, raw: string): Record<string, string> {
  const s = raw.trim();
  switch (type) {
    case "url": return { url: s };
    case "text": return { text: s };
    case "email": return { email: s.replace(/^mailto:/, "") };
    case "phone": return { phone: s.replace(/^tel:/, ""), name: "" };
    case "instagram": return { handle: s.replace(/^https?:\/\/(www\.)?instagram\.com\//, "@").replace(/^@?/, "@") };
    case "wifi": {
      const ssid = /S:([^;]+)/i.exec(s)?.[1] || "";
      const pass = /P:([^;]+)/i.exec(s)?.[1] || "";
      const enc = /T:([^;]+)/i.exec(s)?.[1] || "WPA";
      return { ssid, password: pass, encryption: enc };
    }
    case "vcard": return { firstName: "", lastName: "", org: "", title: "", phone: "", email: "", website: "" };
    case "menu": return { url: s, restaurant: "" };
    case "wedding": return { partner1: "", partner2: "", date: "", venue: "", note: "" };
    case "rsvp": return { event: "", link: s, deadline: "", host: "" };
    case "payment": return { provider: "paypal", handle: s, amount: "" };
    case "ticket": return { eventName: "", attendee: "", seat: "", date: "", ticketId: "", venue: "" };
    case "pdf": return { url: s, title: "" };
  }
}

/* ── Build payload + label from fields ─────────────────── */

function buildPayload(type: BulkType, f: Record<string, string>): { label: string; payload: string } | null {
  const v = (k: string) => (f[k] || "").trim();
  switch (type) {
    case "url": {
      const u = v("url");
      if (!u) return null;
      const payload = u.startsWith("http") ? u : `https://${u}`;
      return { payload, label: u };
    }
    case "text": {
      const t = v("text");
      if (!t) return null;
      return { payload: t, label: t.length > 40 ? `${t.slice(0, 40)}…` : t };
    }
    case "email": {
      const e = v("email");
      if (!e) return null;
      const params = new URLSearchParams();
      if (v("subject")) params.set("subject", v("subject"));
      if (v("body")) params.set("body", v("body"));
      const qs = params.toString();
      return { payload: `mailto:${e}${qs ? `?${qs}` : ""}`, label: e };
    }
    case "phone": {
      const p = v("phone");
      if (!p) return null;
      const label = v("name") ? `${v("name")} · ${p}` : p;
      return { payload: `tel:${p.replace(/[\s().-]/g, "")}`, label };
    }
    case "instagram": {
      const h = v("handle").replace(/^@/, "");
      if (!h) return null;
      return { payload: `https://instagram.com/${h}`, label: `@${h}` };
    }
    case "wifi": {
      const ssid = v("ssid");
      if (!ssid) return null;
      const enc = v("encryption") || "WPA";
      const pass = v("password");
      const payload =
        enc === "nopass"
          ? `WIFI:T:nopass;S:${ssid};;`
          : `WIFI:T:${enc};S:${ssid};P:${pass};;`;
      return { payload, label: `WiFi: ${ssid}` };
    }
    case "vcard": {
      const first = v("firstName");
      if (!first) return null;
      const last = v("lastName");
      const payload = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `N:${last};${first}`,
        `FN:${first}${last ? ` ${last}` : ""}`,
        v("org") && `ORG:${v("org")}`,
        v("title") && `TITLE:${v("title")}`,
        v("phone") && `TEL:${v("phone")}`,
        v("email") && `EMAIL:${v("email")}`,
        v("website") && `URL:${v("website")}`,
        "END:VCARD",
      ].filter(Boolean).join("\n");
      return { payload, label: `${first}${last ? ` ${last}` : ""}` };
    }
    case "menu": {
      const u = v("url");
      if (!u) return null;
      const payload = u.startsWith("http") ? u : `https://${u}`;
      return { payload, label: v("restaurant") ? `Menu · ${v("restaurant")}` : `Menu · ${u}` };
    }
    case "wedding": {
      if (!v("partner1") || !v("partner2")) return null;
      const payload = [
        `${v("partner1")} & ${v("partner2")}`,
        v("date"),
        v("venue"),
        v("note"),
      ].filter(Boolean).join("\n");
      return { payload, label: `${v("partner1")} & ${v("partner2")}` };
    }
    case "rsvp": {
      if (!v("event") || !v("link")) return null;
      const link = v("link").startsWith("http") ? v("link") : `https://${v("link")}`;
      const payload = [
        v("event"),
        v("host") && `Host: ${v("host")}`,
        v("deadline") && `RSVP by ${v("deadline")}`,
        link,
      ].filter(Boolean).join("\n");
      return { payload, label: `RSVP · ${v("event")}` };
    }
    case "payment": {
      const provider = v("provider") || "paypal";
      const h = v("handle").replace(/^@/, "");
      if (!h) return null;
      const amt = v("amount");
      let url: string;
      switch (provider) {
        case "venmo": url = `https://venmo.com/${h}${amt ? `?txn=pay&amount=${amt}` : ""}`; break;
        case "cashapp": url = `https://cash.app/$${h}${amt ? `/${amt}` : ""}`; break;
        case "url": url = h.startsWith("http") ? h : `https://${h}`; break;
        default: url = `https://paypal.me/${h}${amt ? `/${amt}` : ""}`;
      }
      return { payload: url, label: `Pay · ${provider} · ${h}` };
    }
    case "ticket": {
      const event = v("eventName");
      const attendee = v("attendee");
      const ticketId = v("ticketId");
      if (!event || !attendee || !ticketId) return null;
      const payload = [
        `TICKET:${ticketId}`,
        `EVENT:${event}`,
        `NAME:${attendee}`,
        v("seat") && `SEAT:${v("seat")}`,
        v("date") && `DATE:${v("date")}`,
        v("venue") && `VENUE:${v("venue")}`,
      ].filter(Boolean).join("\n");
      return { payload, label: `${event} · ${attendee}` };
    }
    case "pdf": {
      const u = v("url");
      if (!u) return null;
      const payload = u.startsWith("http") ? u : `https://${u}`;
      return { payload, label: v("title") || `PDF · ${u}` };
    }
  }
}
