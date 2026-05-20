import { Edit3, Shield, Sparkles, Wand2 } from "lucide-react";

const FEATURES = [
  {
    icon: Wand2,
    title: "AI Auto-Detect (Bulk)",
    text: "Smart detection of business, event, link, or contact.",
  },
  {
    icon: Sparkles,
    title: "Premium Styled Codes",
    text: "Rounded dots, gradients, and auto-color from your logo.",
  },
  {
    icon: Shield,
    title: "Your data stays private",
    text: "All processing happens locally in your browser.",
  },
  {
    icon: Edit3,
    title: "Edit QR codes Anytime",
    text: "Change the destination URL even after printing.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="container mt-20 sm:mt-28">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          Why QR Forge
        </span>
        <h2 className="mt-4 text-xl font-bold tracking-tight sm:text-2xl md:text-3xl lg:text-4xl">
          Why Choose QR Forge
        </h2>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2.5 sm:mt-10 sm:grid-cols-4 sm:gap-4">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <div
            key={title}
            className="surface-card glow-on-hover flex flex-col gap-1.5 p-3 transition-transform sm:gap-3 sm:p-6"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-soft text-primary sm:h-11 sm:w-11 sm:rounded-xl">
              <Icon className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
            </div>
            <h3 className="text-xs font-semibold leading-tight sm:text-base">{title}</h3>
            <p className="text-[11px] leading-snug text-muted-foreground sm:text-sm">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
