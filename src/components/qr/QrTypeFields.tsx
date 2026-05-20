import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { QrFormState, QrType } from "@/lib/qr/payload";

type Props = {
  type: QrType;
  form: QrFormState;
  setForm: (updater: (prev: QrFormState) => QrFormState) => void;
};

/* ── Typing-animation placeholder hook ──────────────────── */
function useTypingPlaceholder(phrases: string[], deps: unknown[] = []) {
  const [text, setText] = useState("");
  useEffect(() => {
    if (phrases.length === 0) return;
    let phraseIdx = 0;
    let charIdx = 0;
    let forward = true;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const cur = phrases[phraseIdx];
      if (forward) {
        charIdx++;
        setText(cur.slice(0, charIdx));
        if (charIdx >= cur.length) {
          forward = false;
          timer = setTimeout(tick, 1600);
          return;
        }
      } else {
        charIdx--;
        setText(cur.slice(0, charIdx));
        if (charIdx <= 0) {
          forward = true;
          phraseIdx = (phraseIdx + 1) % phrases.length;
        }
      }
      timer = setTimeout(tick, forward ? 55 : 30);
    };
    timer = setTimeout(tick, 200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return text;
}

const Field = ({ children }: { children: React.ReactNode }) => (
  <div className="space-y-1.5 animate-fade-in-up">{children}</div>
);

/** Animated <Input> with rotating typing placeholders. */
function TypedInput({
  phrases,
  ...props
}: { phrases: string[] } & React.InputHTMLAttributes<HTMLInputElement>) {
  const ph = useTypingPlaceholder(phrases, [phrases.join("|")]);
  return <Input {...props} placeholder={ph || " "} />;
}

function TypedTextarea({
  phrases,
  ...props
}: { phrases: string[] } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ph = useTypingPlaceholder(phrases, [phrases.join("|")]);
  return <Textarea {...props} placeholder={ph || " "} />;
}

export function QrTypeFields({ type, form, setForm }: Props) {
  switch (type) {
    case "url":
      return (
        <Field>
          <Label htmlFor="qr-url">Destination URL</Label>
          <TypedInput
            id="qr-url"
            inputMode="url"
            value={form.url}
            onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
            phrases={["Type your URL…", "Paste your website link…", "https://example.com"]}
          />
        </Field>
      );
    case "text":
      return (
        <Field>
          <Label htmlFor="qr-text">Your text</Label>
          <TypedTextarea
            id="qr-text"
            rows={5}
            value={form.text}
            onChange={(e) => setForm((p) => ({ ...p, text: e.target.value }))}
            phrases={["Type your text…", "Paste any message — multiline supported"]}
          />
        </Field>
      );
    case "wifi":
      return (
        <div className="space-y-3">
          <Field>
            <Label>Network name (SSID)</Label>
            <TypedInput
              value={form.wifi.ssid}
              onChange={(e) =>
                setForm((p) => ({ ...p, wifi: { ...p.wifi, ssid: e.target.value } }))
              }
              phrases={["Type network name…", "MyHomeWiFi"]}
            />
          </Field>
          <Field>
            <Label>Password</Label>
            <TypedInput
              type="password"
              value={form.wifi.password}
              onChange={(e) =>
                setForm((p) => ({ ...p, wifi: { ...p.wifi, password: e.target.value } }))
              }
              phrases={["Type password…"]}
            />
          </Field>
          <Field>
            <Label>Security type</Label>
            <Select
              value={form.wifi.encryption}
              onValueChange={(v) =>
                setForm((p) => ({ ...p, wifi: { ...p.wifi, encryption: v as never } }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WPA">WPA / WPA2 / WPA3</SelectItem>
                <SelectItem value="WEP">WEP</SelectItem>
                <SelectItem value="nopass">None</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      );
    case "phone":
      return (
        <div className="space-y-3">
          <Field>
            <Label>Phone number (with country code)</Label>
            <TypedInput
              inputMode="tel"
              value={form.phone.number}
              onChange={(e) => setForm((p) => ({ ...p, phone: { ...p.phone, number: e.target.value } }))}
              phrases={["Type the phone number…", "+1 555 123 4567"]}
            />
          </Field>
          <Field>
            <Label>Contact name (optional)</Label>
            <TypedInput
              value={form.phone.name}
              onChange={(e) => setForm((p) => ({ ...p, phone: { ...p.phone, name: e.target.value } }))}
              phrases={["Whose number is this?", "Jane Doe", "Mom 💛"]}
            />
          </Field>
        </div>
      );
    case "email":
      return (
        <div className="space-y-3">
          <Field>
            <Label>Email address</Label>
            <TypedInput
              type="email"
              value={form.email.to}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: { ...p.email, to: e.target.value } }))
              }
              phrases={["Type the email address…", "hello@example.com"]}
            />
          </Field>
          <Field>
            <Label>Subject (optional)</Label>
            <TypedInput
              value={form.email.subject}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: { ...p.email, subject: e.target.value } }))
              }
              phrases={["Type a subject…", "Hello from QR Forge"]}
            />
          </Field>
          <Field>
            <Label>Message (optional)</Label>
            <TypedTextarea
              rows={3}
              value={form.email.body}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: { ...p.email, body: e.target.value } }))
              }
              phrases={["Type your message…"]}
            />
          </Field>
        </div>
      );
    case "vcard": {
      const v = form.vcard;
      const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((p) => ({ ...p, vcard: { ...p.vcard, [k]: e.target.value } }));
      const T = (val: string, ph: string[], on: (e: React.ChangeEvent<HTMLInputElement>) => void) => (
        <TypedInput value={val} onChange={on} phrases={ph} />
      );
      return (
        <div className="space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Digital business card
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field><Label>Full name</Label>{T(v.name, ["Type full name…", "Jane Doe"], set("name"))}</Field>
            <Field><Label>Phone number</Label>{T(v.phone, ["Type phone…"], set("phone"))}</Field>
            <Field><Label>Email address</Label>{T(v.email, ["Type email…"], set("email"))}</Field>
            <Field><Label>Company name</Label>{T(v.company, ["Type company…"], set("company"))}</Field>
            <Field><Label>Work title</Label>{T(v.title, ["Type job title…"], set("title"))}</Field>
            <Field><Label>Work phone</Label>{T(v.workPhone, ["Type work phone…"], set("workPhone"))}</Field>
            <Field><Label>Fax</Label>{T(v.fax, ["Type fax number…"], set("fax"))}</Field>
            <Field><Label>Website</Label>{T(v.website, ["Type your website…"], set("website"))}</Field>
            <Field><Label>Street</Label>{T(v.street, ["Type street address…"], set("street"))}</Field>
            <Field><Label>City</Label>{T(v.city, ["Type city…"], set("city"))}</Field>
            <Field><Label>State</Label>{T(v.state, ["Type state…"], set("state"))}</Field>
            <Field><Label>Zip</Label>{T(v.zip, ["Type zip…"], set("zip"))}</Field>
            <Field><Label>Country</Label>{T(v.country, ["Type country…"], set("country"))}</Field>
          </div>
        </div>
      );
    }
    case "menu":
      return (
        <Field>
          <Label>Menu URL</Label>
          <TypedInput
            value={form.menu}
            onChange={(e) => setForm((p) => ({ ...p, menu: e.target.value }))}
            phrases={["Type your menu URL…", "Paste your menu link…"]}
          />
        </Field>
      );
    case "wedding": {
      const w = form.wedding;
      const set =
        (k: keyof typeof w) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
          setForm((p) => ({ ...p, wedding: { ...p.wedding, [k]: e.target.value } }));
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field><Label>Partner 1 name</Label><TypedInput value={w.partner1} onChange={set("partner1")} phrases={["Type partner 1 name…"]} /></Field>
          <Field><Label>Partner 2 name</Label><TypedInput value={w.partner2} onChange={set("partner2")} phrases={["Type partner 2 name…"]} /></Field>
          <Field><Label>Wedding date</Label><Input type="date" value={w.date} onChange={set("date")} /></Field>
          <Field><Label>Wedding time</Label><Input type="time" value={w.time} onChange={set("time")} /></Field>
          <Field><Label>Venue name</Label><TypedInput value={w.venue} onChange={set("venue")} phrases={["Type venue name…"]} /></Field>
          <Field><Label>Venue address</Label><TypedInput value={w.venueAddress} onChange={set("venueAddress")} phrases={["Type venue address…"]} /></Field>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Additional info (optional)</Label>
            <TypedTextarea rows={2} value={w.note} onChange={set("note")} phrases={["Type a note for guests…"]} />
          </div>
        </div>
      );
    }
    case "rsvp": {
      const r = form.rsvp;
      const set =
        (k: keyof typeof r) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
          setForm((p) => ({ ...p, rsvp: { ...p.rsvp, [k]: e.target.value } }));
      return (
        <div className="space-y-3">
          <Field><Label>Event name</Label><TypedInput value={r.event} onChange={set("event")} phrases={["Type event name…"]} /></Field>
          <Field><Label>RSVP link</Label><TypedInput value={r.link} onChange={set("link")} phrases={["Paste RSVP link…"]} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field><Label>Reply-by date</Label><Input type="date" value={r.deadline} onChange={set("deadline")} /></Field>
            <Field><Label>Host name (optional)</Label><TypedInput value={r.host} onChange={set("host")} phrases={["Type host name…"]} /></Field>
          </div>
          <Field><Label>Personal message (optional)</Label><TypedTextarea rows={2} value={r.message} onChange={set("message")} phrases={["Type a personal note…"]} /></Field>
        </div>
      );
    }
    case "instagram":
      return (
        <Field>
          <Label>Instagram username or profile URL</Label>
          <TypedInput
            value={form.instagram}
            onChange={(e) => setForm((p) => ({ ...p, instagram: e.target.value }))}
            phrases={["Type your handle…", "@qrforge", "qrforge"]}
          />
        </Field>
      );
    case "payment": {
      const pay = form.payment;
      const set = (k: keyof typeof pay) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((p) => ({ ...p, payment: { ...p.payment, [k]: e.target.value } }));
      return (
        <div className="space-y-3">
          <Field>
            <Label>Payment platform</Label>
            <Select
              value={pay.provider}
              onValueChange={(v) =>
                setForm((p) => ({ ...p, payment: { ...p.payment, provider: v as never } }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="venmo">Venmo</SelectItem>
                <SelectItem value="cashapp">Cash App</SelectItem>
                <SelectItem value="url">Custom URL</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field><Label>Payee username / ID / link</Label><TypedInput value={pay.handle} onChange={set("handle")} phrases={["Type username or link…"]} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field><Label>Amount (optional)</Label><TypedInput inputMode="decimal" value={pay.amount} onChange={set("amount")} phrases={["Type amount…", "25.00"]} /></Field>
            <Field><Label>Currency (optional)</Label><TypedInput value={pay.currency} onChange={set("currency")} phrases={["USD", "EUR", "GBP"]} /></Field>
          </div>
          <Field><Label>Note (optional)</Label><TypedInput value={pay.note} onChange={set("note")} phrases={["Type a note…"]} /></Field>
        </div>
      );
    }
    case "ticket": {
      const t = form.ticket;
      const set = (k: keyof typeof t) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((p) => ({ ...p, ticket: { ...p.ticket, [k]: e.target.value } }));
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Event name</Label>
            <TypedInput value={t.event} onChange={set("event")} phrases={["Type event name…", "Summer Festival 2026"]} />
          </div>
          <Field><Label>Date</Label><Input type="date" value={t.date} onChange={set("date")} /></Field>
          <Field><Label>Time</Label><Input type="time" value={t.time} onChange={set("time")} /></Field>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Venue / location</Label>
            <TypedInput value={t.venue} onChange={set("venue")} phrases={["Type venue name…"]} />
          </div>
          <Field><Label>Section / area</Label><TypedInput value={t.section} onChange={set("section")} phrases={["Section A"]} /></Field>
          <Field><Label>Row</Label><TypedInput value={t.row} onChange={set("row")} phrases={["Row 12"]} /></Field>
          <Field><Label>Seat</Label><TypedInput value={t.seat} onChange={set("seat")} phrases={["Seat 7"]} /></Field>
          <Field><Label>Ticket holder name</Label><TypedInput value={t.holder} onChange={set("holder")} phrases={["Type attendee name…"]} /></Field>
          <Field><Label>Order / confirmation number</Label><TypedInput value={t.confirmation} onChange={set("confirmation")} phrases={["TKT-00042"]} /></Field>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Ticket link (optional)</Label>
            <TypedInput value={t.link} onChange={set("link")} phrases={["Paste ticket link…"]} />
          </div>
        </div>
      );
    }
    case "pdf":
      return (
        <Field>
          <Label>PDF URL</Label>
          <TypedInput
            value={form.pdf}
            onChange={(e) => setForm((p) => ({ ...p, pdf: e.target.value }))}
            phrases={["Paste PDF link…", "https://drive.google.com/file/d/…"]}
          />
        </Field>
      );
  }
}
