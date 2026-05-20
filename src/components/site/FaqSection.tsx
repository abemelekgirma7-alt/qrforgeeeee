import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = [
  {
    q: "Is QR Forge really free?",
    a: "Yes. Unlimited static QR codes, no sign-up, no watermark, no expiration. Only ad placements help us pay the bills.",
  },
  {
    q: "Will my QR codes ever expire?",
    a: "Never. QR Forge produces static QR codes — the destination is encoded directly into the pattern, so it works forever, even if our website goes offline.",
  },
  {
    q: "Can I add my own logo?",
    a: "Yes. After clicking Generate you go to the wizard step where you can upload a PNG, JPG, or SVG logo and place it in the centre, above, or below the code.",
  },
  {
    q: "What's the max download resolution?",
    a: "4096 × 4096 pixels for raster formats (PNG, JPG, WebP), or true vector with SVG.",
  },
  {
    q: "Why default to High error correction?",
    a: "High lets up to 30% of the QR pattern be obscured (by your logo, for example) without affecting scannability.",
  },
  {
    q: "Is my data sent to a server?",
    a: "No. The entire generator — including logo embedding and download — runs in your browser. Nothing is uploaded.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="container mt-12 sm:mt-20">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="text-base font-bold tracking-tight text-shadow-soft sm:text-xl md:text-2xl lg:text-3xl">
          Frequently asked questions
        </h2>
        <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
          Everything you need to know before generating your first code.
        </p>
      </div>

      <Accordion type="single" collapsible className="mx-auto mt-4 max-w-xl sm:mt-6">
        {FAQ.map((item, i) => (
          <AccordionItem key={i} value={`q${i}`} className="border-b">
            <AccordionTrigger className="text-left text-xs font-medium sm:text-sm">{item.q}</AccordionTrigger>
            <AccordionContent className="text-[11px] text-muted-foreground sm:text-sm">{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
