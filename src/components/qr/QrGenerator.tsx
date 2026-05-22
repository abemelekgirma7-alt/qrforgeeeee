import { useEffect, useMemo, useRef, useState } from "react";
import {
  AtSign,
  CalendarCheck,
  CreditCard,
  FileText,
  Heart,
  IdCard,
  Instagram,
  Link2,
  Mail,
  MessageSquare,
  Phone,
  Sparkles,
  Ticket,
  Utensils,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Palette } from "lucide-react";
// Slider removed (dot-density control cut per spec)
import { QrPreview } from "./QrPreview";
import { QrTypeFields } from "./QrTypeFields";
import { buildQrPayload, defaultForm, type QrFormState, type QrType } from "@/lib/qr/payload";
import { defaultStyle, type QrStyle } from "@/lib/qr/style";
import { cn } from "@/lib/utils";
import { QR_SELECT_EVENT } from "@/components/site/SpecializedSection";

const URL_RE = /^(https?:\/\/)?[^\s.]+\.[^\s]{2,}/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s().-]{5,}$/;

function getFormError(form: QrFormState): string | null {
  switch (form.type) {
    case "url":
      if (!form.url.trim()) return "Enter a destination URL.";
      if (!URL_RE.test(form.url.trim())) return "Enter a valid URL.";
      return null;
    case "text":
      return form.text.trim() ? null : "Enter the text you want to encode.";
    case "wifi":
      return form.wifi.ssid.trim() ? null : "Enter the WiFi network name.";
    case "phone":
      if (!form.phone.number.trim()) return "Enter a phone number.";
      return PHONE_RE.test(form.phone.number.trim()) ? null : "Enter a valid phone number.";
    case "email":
      if (!form.email.to.trim()) return "Enter an email address.";
      return EMAIL_RE.test(form.email.to.trim()) ? null : "Enter a valid email address.";
    case "vcard":
      if (!form.vcard.name.trim()) return "Enter the contact name.";
      if (form.vcard.email.trim() && !EMAIL_RE.test(form.vcard.email.trim())) return "Enter a valid contact email.";
      if (form.vcard.website.trim() && !URL_RE.test(form.vcard.website.trim())) return "Enter a valid website URL.";
      return null;
    case "menu":
      if (!form.menu.trim()) return "Enter the menu URL.";
      return URL_RE.test(form.menu.trim()) ? null : "Enter a valid menu URL.";
    case "wedding":
      if (!form.wedding.partner1.trim() || !form.wedding.partner2.trim()) return "Enter both partner names.";
      return null;
    case "rsvp":
      if (!form.rsvp.event.trim()) return "Enter the event name.";
      if (!form.rsvp.link.trim()) return "Enter the RSVP link.";
      return URL_RE.test(form.rsvp.link.trim()) ? null : "Enter a valid RSVP link.";
    case "instagram":
      return form.instagram.trim() ? null : "Enter the Instagram username or profile URL.";
    case "payment":
      return form.payment.handle.trim() ? null : "Enter the payee username, ID, or link.";
    case "ticket":
      if (!form.ticket.event.trim()) return "Enter the event name.";
      if (!form.ticket.holder.trim()) return "Enter the ticket holder name.";
      if (!form.ticket.confirmation.trim()) return "Enter the ticket confirmation number.";
      return null;
    case "pdf":
      if (!form.pdf.trim()) return "Enter the PDF URL.";
      return URL_RE.test(form.pdf.trim()) ? null : "Enter a valid PDF URL.";
  }
}

/**
 * Smart default dot style + error-correction per content type.
 * Optimised for readability + scanability:
 *  - Short payloads (URL, phone, email-to) → can afford "dots" + Medium EC.
 *  - Dense payloads (vCard, menu, ticket, payment, wedding, pdf) → use
 *    "rounded" / "square" + High EC so phones lock on faster.
 *  - Email/wifi/instagram are mid-density → "rounded" + Quartile.
 */
const TYPE_DEFAULTS: Record<QrType, { dotStyle: QrStyle["dotStyle"]; errorCorrection: QrStyle["errorCorrection"] }> = {
  url:       { dotStyle: "dots",            errorCorrection: "M" },
  text:      { dotStyle: "rounded",         errorCorrection: "Q" },
  wifi:      { dotStyle: "rounded",         errorCorrection: "Q" },
  phone:     { dotStyle: "dots",            errorCorrection: "M" },
  email:     { dotStyle: "rounded",         errorCorrection: "Q" },
  vcard:     { dotStyle: "square",          errorCorrection: "H" },
  menu:      { dotStyle: "rounded",         errorCorrection: "H" },
  wedding:   { dotStyle: "classy-rounded",  errorCorrection: "H" },
  rsvp:      { dotStyle: "rounded",         errorCorrection: "Q" },
  instagram: { dotStyle: "dots",            errorCorrection: "Q" },
  payment:   { dotStyle: "square",          errorCorrection: "H" },
  ticket:    { dotStyle: "square",          errorCorrection: "H" },
  pdf:       { dotStyle: "rounded",         errorCorrection: "H" },
};

/**
 * Each dot style is paired with a distinct corner-square shape so the five
 * dot-style buttons actually look meaningfully different from one another.
 */
const DOT_TO_CORNER: Record<QrStyle["dotStyle"], QrStyle["cornerSquareStyle"]> = {
  square: "square",
  rounded: "extra-rounded",
  dots: "dot",
  "classy-rounded": "classy-rounded",
  "extra-rounded": "extra-rounded",
  classy: "classy",
};

export type GeneratorResult = { form: QrFormState; style: QrStyle; payload: string };

const TYPES: { id: QrType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "url", label: "URL", icon: Link2 },
  { id: "text", label: "Text", icon: MessageSquare },
  { id: "wifi", label: "WiFi", icon: Wifi },
  { id: "phone", label: "Phone", icon: Phone },
  { id: "email", label: "Email", icon: Mail },
  { id: "vcard", label: "vCard", icon: IdCard },
  { id: "menu", label: "Menu", icon: Utensils },
  { id: "wedding", label: "Wedding", icon: Heart },
  { id: "rsvp", label: "RSVP", icon: CalendarCheck },
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "payment", label: "Payment", icon: CreditCard },
  { id: "ticket", label: "Ticket", icon: Ticket },
  { id: "pdf", label: "PDF", icon: FileText },
];

export function QrGenerator({
  onGenerate,
  initialType,
}: {
  onGenerate: (r: GeneratorResult) => void;
  initialType?: QrType;
}) {
  const [form, setForm] = useState<QrFormState>(() => ({
    ...defaultForm,
    type: initialType ?? defaultForm.type,
  }));
  const [style, setStyle] = useState<QrStyle>(defaultStyle);
  const [colorsOpen, setColorsOpen] = useState(false);
  const [patternOpen, setPatternOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const previewTestMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("qrPreviewTest");
  const generateBtnRef = useRef<HTMLButtonElement>(null);

  // React to template clicks elsewhere on the page
  useEffect(() => {
    const handler = (e: Event) => {
      const t = (e as CustomEvent<QrType>).detail;
      if (t) {
        setForm((p) => ({ ...p, type: t }));
        const d = TYPE_DEFAULTS[t];
        if (d) setStyle((s) => ({ ...s, dotStyle: d.dotStyle, errorCorrection: d.errorCorrection }));
      }
    };
    window.addEventListener(QR_SELECT_EVENT, handler);
    return () => window.removeEventListener(QR_SELECT_EVENT, handler);
  }, []);

  // When the type changes via prop or external event, scroll the type fields into view smoothly.
  useEffect(() => {
    const el = document.getElementById("qr-type-fields");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [form.type]);

  const payload = useMemo(() => buildQrPayload(form), [form]);
  const formError = useMemo(() => getFormError(form), [form]);
  const styleWarning = useMemo(() => {
    const fg = style.fg.toLowerCase();
    const bg = style.bg.toLowerCase();
    if (fg === bg) return "Foreground and background are identical — your QR will be invisible.";
    // crude contrast check on hex colors
    const toRgb = (h: string) => {
      const m = h.replace("#", "");
      if (m.length !== 6) return null;
      return [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)];
    };
    const a = toRgb(fg);
    const b = toRgb(bg);
    if (a && b) {
      const lum = (c: number[]) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
      if (Math.abs(lum(a) - lum(b)) < 60) return "Low contrast — scanners may struggle. Pick a darker foreground or lighter background.";
    }
    if (style.logoDataUrl && style.logoSize > 0.3 && style.errorCorrection !== "H") {
      return "Large logo with low error-correction. Switch error correction to High for reliable scanning.";
    }
    return null;
  }, [style]);

  const setType = (type: QrType) => {
    setForm((p) => ({ ...p, type }));
    setSubmitError(null);
    const d = TYPE_DEFAULTS[type];
    if (d) setStyle((s) => ({ ...s, dotStyle: d.dotStyle, errorCorrection: d.errorCorrection }));
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_380px]">
      {/* FORM card */}
      <div className="surface-card w-full p-6 sm:p-8 animate-fade-in-up min-w-0">
        <div className="mb-6 flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Create your QR code</h2>
            <p className="text-sm text-muted-foreground">
              Pick a type, fill in the details, then continue to add a logo.
            </p>
          </div>
        </div>

        {/* Type chips — centered */}
        <div className="mb-6">
          <Label className="mb-2 block text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-left">
            Content type
          </Label>
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2.5 sm:justify-start">
            {TYPES.map(({ id, label, icon: Icon }) => {
              const active = form.type === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setType(id)}
                  className={cn(
                    "inline-flex items-center gap-1 sm:gap-2 rounded-full border px-3 py-2 text-xs sm:px-5 sm:py-3 sm:text-sm font-semibold transition-all",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Type-specific fields — re-key on type so each box gets a fresh entrance animation, matching Bulk's "Add entries" feel */}
        <div id="qr-type-fields" key={form.type} className="animate-fade-in-up">
          <QrTypeFields type={form.type} form={form} setForm={setForm} />
        </div>

        {submitError && (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {submitError}
          </div>
        )}

        {/* Style — all four color controls collapsed under one button */}
        <Collapsible open={colorsOpen} onOpenChange={setColorsOpen} className="mt-8">
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl border bg-card px-4 py-3 text-left shadow-elev-sm transition-all hover:border-primary/50">
            <span className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Palette className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold">Colors</span>
                <span className="block text-[11px] text-muted-foreground">
                  Foreground · Background · Corner ring · Corner dot
                </span>
              </span>
            </span>
            <span className="flex items-center gap-2">
              {/* Live swatches preview the current 4 colors */}
              <span className="hidden items-center gap-1 sm:flex">
                <Swatch color={style.fg} title="Foreground" />
                <Swatch color={style.bg} title="Background" />
                <Swatch color={style.cornerSquareColor || style.fg} title="Corner ring" />
                <Swatch color={style.cornerDotColor || style.fg} title="Corner dot" />
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  colorsOpen && "rotate-180",
                )}
              />
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 rounded-xl border bg-secondary/30 p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ColorField
                id="fg"
                label="Foreground (dots)"
                value={style.fg}
                onChange={(v) => setStyle((s) => ({ ...s, fg: v, gradient: null }))}
              />
              <ColorField
                id="bg"
                label="Background"
                value={style.bg}
                onChange={(v) => setStyle((s) => ({ ...s, bg: v }))}
              />
              <ColorField
                id="csq"
                label="Corner ring (outer)"
                value={style.cornerSquareColor || style.fg}
                onChange={(v) => setStyle((s) => ({ ...s, cornerSquareColor: v }))}
              />
              <ColorField
                id="cdot"
                label="Corner dot (inner)"
                value={style.cornerDotColor || style.fg}
                onChange={(v) => setStyle((s) => ({ ...s, cornerDotColor: v }))}
              />
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Tip: pair a bold ring color with a contrasting dot to make the three finder
              corners pop.
            </p>
          </CollapsibleContent>
        </Collapsible>

        {/* Pattern & corners — Dot / Error / Corner collapsed into a single group */}
        <Collapsible open={patternOpen} onOpenChange={setPatternOpen} className="mt-4">
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl border bg-card px-4 py-3 text-left shadow-elev-sm transition-all hover:border-primary/50">
            <span className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold">Pattern & corners</span>
                <span className="block text-[11px] text-muted-foreground">
                  Dot style · Error correction · Corner shape
                </span>
              </span>
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                patternOpen && "rotate-180",
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-5 rounded-xl border bg-secondary/30 p-4">
            <div>
              <Label className="mb-2 block">Dot style</Label>
              <Tabs
                value={style.dotStyle as string}
                onValueChange={(v) =>
                  setStyle((s) => ({ ...s, dotStyle: v as QrStyle["dotStyle"] }))
                }
              >
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="square">Square</TabsTrigger>
                  <TabsTrigger value="rounded">Rounded</TabsTrigger>
                  <TabsTrigger value="dots">Dots</TabsTrigger>
                  <TabsTrigger value="classy-rounded">Classy</TabsTrigger>
                  <TabsTrigger value="extra-rounded">Extra</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div>
              <Label className="mb-2 block">Corner shape (outer ring)</Label>
              <Tabs
                value={style.cornerSquareStyle as string}
                onValueChange={(v) =>
                  setStyle((s) => ({ ...s, cornerSquareStyle: v as QrStyle["cornerSquareStyle"] }))
                }
              >
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="square">Square</TabsTrigger>
                  <TabsTrigger value="dot">Dot</TabsTrigger>
                  <TabsTrigger value="extra-rounded">Rounded</TabsTrigger>
                  <TabsTrigger value="classy-rounded">Classy</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div>
              <Label className="mb-2 block">Corner dot (inner)</Label>
              <Tabs
                value={style.cornerDotStyle as string}
                onValueChange={(v) =>
                  setStyle((s) => ({ ...s, cornerDotStyle: v as QrStyle["cornerDotStyle"] }))
                }
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="square">Square</TabsTrigger>
                  <TabsTrigger value="dot">Dot</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Error correction</Label>
                <span className="text-xs text-muted-foreground">
                  Higher = more logo room
                </span>
              </div>
              <Tabs
                value={style.errorCorrection}
                onValueChange={(v) => setStyle((s) => ({ ...s, errorCorrection: v as never }))}
              >
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="L">Low</TabsTrigger>
                  <TabsTrigger value="M">Medium</TabsTrigger>
                  <TabsTrigger value="Q">Quartile</TabsTrigger>
                  <TabsTrigger value="H">High</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

          </CollapsibleContent>
        </Collapsible>

        <div className="mt-8 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <Button
            size="lg"
            ref={generateBtnRef}
            className="flex-1 h-14 text-base font-semibold bg-gradient-hero text-primary-foreground hover:opacity-95"
            onClick={() => {
              if (formError) {
                setSubmitError(formError);
                return;
              }
              setSubmitError(null);
              onGenerate({ form, style, payload });
            }}
          >
            Generate QR code
            <Sparkles className="ml-2 h-5 w-5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            type="button"
            className="sm:w-auto"
            onClick={() => {
              setForm({ ...defaultForm, type: initialType ?? defaultForm.type });
              setStyle(defaultStyle);
              setSubmitError(null);
              setColorsOpen(false);
              setPatternOpen(false);
            }}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* LIVE PREVIEW — sticky on the right, premium scan card */}
      <div className="surface-card w-full p-4 sm:p-6 animate-fade-in-up lg:sticky lg:top-24">
        <h3 className="mb-3 text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Live preview
        </h3>
        <div data-qr-preview-box className="mx-auto flex aspect-square w-full max-w-[min(100%,200px)] items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-elev-md sm:max-w-[260px] sm:p-3 lg:max-w-[320px]">
          <QrPreview data={payload} style={style} frame={false} className="h-full w-full" />
        </div>
        {previewTestMode && <QrPreviewContainmentCheck />}
        {styleWarning && (
          <p className="mx-auto mt-3 max-w-[260px] rounded-lg border border-amber-300/40 bg-amber-50 px-2.5 py-1.5 text-center text-[11px] font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            ⚠ {styleWarning}
          </p>
        )}
        <p className="mx-auto mt-3 max-w-md break-all text-center text-xs text-muted-foreground">
          {payload.slice(0, 140)}
          {payload.length > 140 ? "…" : ""}
        </p>
      </div>
    </div>
  );
}

function QrPreviewContainmentCheck() {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    const box = document.querySelector<HTMLElement>("[data-qr-preview-box]");
    if (!box) return;
    const check = () => {
      const qr = box.querySelector<HTMLElement>("[role='img']");
      setOk(Boolean(qr && qr.scrollWidth <= box.clientWidth && qr.scrollHeight <= box.clientHeight));
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  return (
    <p className="mx-auto mt-3 max-w-[260px] rounded-lg border border-primary/30 bg-primary/5 px-2.5 py-1.5 text-center text-[11px] font-medium text-primary">
      Responsive preview test: {ok === null ? "checking…" : ok ? "contained at this width" : "overflow detected"}
    </p>
  );
}

function Swatch({ color, title }: { color: string; title: string }) {
  return (
    <span
      title={title}
      aria-label={title}
      className="inline-block h-4 w-4 rounded-full border border-border shadow-sm"
      style={{ background: color }}
    />
  );
}

function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded-md border border-border bg-transparent"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}
