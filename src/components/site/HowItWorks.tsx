import { ListChecks, MousePointerClick, Sparkles } from "lucide-react";

const STEPS = [
  {
    n: 1,
    icon: MousePointerClick,
    title: "Choose QR Type",
    text: "Pick from URL, WiFi, vCard, Menu, Ticket, and many more.",
  },
  {
    n: 2,
    icon: ListChecks,
    title: "Enter Details",
    text: "Fill in the required fields — everything is kept local and secure.",
  },
  {
    n: 3,
    icon: Sparkles,
    title: "Generate & Download",
    text: "Generate a clean, scannable QR code and download it in your preferred format.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="container mt-16 sm:mt-20 scroll-mt-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl lg:text-4xl">How It Works</h2>
        <p className="mt-3 text-muted-foreground">
          Three simple steps to a perfect QR code, no technical skills needed.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-5xl grid-cols-3 gap-2 sm:gap-4">
        {STEPS.map(({ n, icon: Icon, title, text }) => (
          <div key={n} className="surface-card glow-on-hover relative flex flex-col gap-2 p-3 sm:gap-3 sm:p-6">
            <div className="absolute right-2 top-2 text-[10px] font-bold text-primary/40 sm:right-4 sm:top-4 sm:text-xs">
              0{n}
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-soft text-primary sm:h-11 sm:w-11 sm:rounded-xl">
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <h3 className="text-xs font-semibold leading-tight sm:text-base">
              {n}. {title}
            </h3>
            <p className="hidden text-sm text-muted-foreground sm:block">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}