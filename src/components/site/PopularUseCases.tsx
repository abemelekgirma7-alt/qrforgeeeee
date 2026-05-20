import {
  CalendarCheck,
  CreditCard,
  Heart,
  IdCard,
  Utensils,
  Wifi,
} from "lucide-react";

const ITEMS = [
  { icon: Utensils, title: "Menus", text: "Digital menus." },
  { icon: Wifi, title: "WiFi", text: "Share access." },
  { icon: IdCard, title: "Cards", text: "Save contacts." },
  { icon: Heart, title: "Weddings", text: "Invite guests." },
  { icon: CalendarCheck, title: "Tickets", text: "Event entry." },
  { icon: CreditCard, title: "Payments", text: "Link payouts." },
];

export function PopularUseCases() {
  return (
    <section className="container mt-16 sm:mt-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-xl font-bold tracking-tight text-shadow-soft sm:text-2xl md:text-3xl lg:text-4xl">Popular Use Cases</h2>
        <p className="mt-2 text-sm text-muted-foreground text-shadow-soft sm:text-base">From menus to weddings.</p>
      </div>

      <div className="mx-auto mt-8 grid max-w-5xl gap-3 grid-cols-3 sm:gap-4 [&>*]:text-sm">
        {ITEMS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="surface-card glow-on-hover flex flex-col gap-2 p-3 sm:gap-3 sm:p-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-soft text-primary sm:h-11 sm:w-11">
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <h3 className="text-sm font-semibold sm:text-base">{title}</h3>
            <p className="text-xs text-muted-foreground sm:text-sm">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}