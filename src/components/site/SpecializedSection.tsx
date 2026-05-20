import {
  FileText,
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
  Heart,
  CreditCard,
  CalendarCheck,
} from "lucide-react";
import type { QrType } from "@/lib/qr/payload";

type Item = {
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  note: string;
  type: QrType;
  /** Some items (WhatsApp, YouTube, Map…) don't have a unique form yet — they route to URL. */
  badge?: "Static" | "Dynamic" | "Both";
};
const ITEMS: Item[] = [
  { icon: Link2,           name: "Link",          note: "Any web address",          type: "url",       badge: "Both" },
  { icon: MessageSquare,   name: "Text",          note: "Plain text & notes",       type: "text",      badge: "Static" },
  { icon: Wifi,            name: "Wi-Fi",         note: "One-tap connect",          type: "wifi",      badge: "Static" },
  { icon: Phone,           name: "Phone",         note: "Tap-to-call number",       type: "phone",     badge: "Static" },
  { icon: FileText,        name: "PDF",           note: "Hosted document",          type: "pdf",       badge: "Dynamic" },
  { icon: Mail,            name: "Email",         note: "Pre-filled message",       type: "email",     badge: "Static" },
  { icon: Instagram,       name: "Instagram",     note: "Grow followers",           type: "instagram", badge: "Dynamic" },
  { icon: IdCard,          name: "vCard",         note: "Digital business card",    type: "vcard",     badge: "Both" },
  { icon: Utensils,        name: "Menu",          note: "Restaurant / café menu",   type: "menu",      badge: "Dynamic" },
  { icon: Heart,           name: "Wedding",       note: "Save the date & details",  type: "wedding",   badge: "Static" },
  { icon: CalendarCheck,   name: "RSVP",          note: "Event reply link",         type: "rsvp",      badge: "Dynamic" },
  { icon: CreditCard,      name: "Payment",       note: "PayPal, Venmo, Cash App",  type: "payment",   badge: "Dynamic" },
  { icon: Ticket,          name: "Ticket",        note: "Event entry pass",         type: "ticket",    badge: "Static" },
];

const SELECT_TYPE_EVENT = "qrforge:select-type";

/** Fired by template cards / used cases to switch the generator to a content type and scroll to it. */
export function selectQrType(type: QrType) {
  window.dispatchEvent(new CustomEvent<QrType>(SELECT_TYPE_EVENT, { detail: type }));
}

export const QR_SELECT_EVENT = SELECT_TYPE_EVENT;

export function SpecializedSection() {
  const onPick = (type: QrType) => {
    selectQrType(type);
    const el = document.getElementById("generator");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <section id="templates" className="container mt-20 sm:mt-28">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3 w-3" /> 18 QR types
        </span>
        <h2 className="mt-4 text-xl font-bold tracking-tight sm:text-2xl md:text-3xl lg:text-4xl">
          Pick a QR type to get started
        </h2>
        <p className="mt-3 text-muted-foreground">
          Tap any tile — the generator below jumps straight to that type with the right form
          fields pre-loaded. Static, dynamic, or both, your choice.
        </p>
      </div>

      {/* 3-up on mobile, denser on tablet/desktop. */}
      <div className="mx-auto mt-10 grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-6">
        {ITEMS.map(({ icon: Icon, name, note, type, badge }) => (
          <button
            key={name}
            type="button"
            onClick={() => onPick(type)}
            className="group surface-card glow-on-hover relative flex flex-col items-center gap-1.5 p-2.5 text-center transition-transform hover:-translate-y-0.5 sm:gap-2 sm:p-4"
            aria-label={`Use ${name} template`}
          >
            {badge && (
              <span className="absolute right-1.5 top-1.5 rounded-full bg-primary/10 px-1.5 py-[1px] text-[8px] font-semibold uppercase tracking-wider text-primary sm:text-[9px]">
                {badge}
              </span>
            )}
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground sm:h-12 sm:w-12 sm:rounded-xl">
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="text-[10px] font-semibold leading-tight sm:text-sm">{name}</div>
            <div className="hidden text-[11px] text-muted-foreground sm:block">{note}</div>
          </button>
        ))}
      </div>
    </section>
  );
}
