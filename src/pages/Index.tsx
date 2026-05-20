import { useEffect, useState } from "react";
import { Layers, QrCode } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { QrGenerator, type GeneratorResult } from "@/components/qr/QrGenerator";
import { QrWizard } from "@/components/qr/QrWizard";
import { BulkGenerator } from "@/components/qr/BulkGenerator";
import { FeaturesSection } from "@/components/site/FeaturesSection";
import { SpecializedSection } from "@/components/site/SpecializedSection";
import { HowItWorks } from "@/components/site/HowItWorks";
import { PopularUseCases } from "@/components/site/PopularUseCases";
import { BRAND_CLICK_EVENT, type BrandClickDetail } from "@/components/site/BrandShowcase";
import { ReviewsSection } from "@/components/site/ReviewsSection";
import { FaqSection } from "@/components/site/FaqSection";
import { Footer, FeedbackSection } from "@/components/site/Footer";

import { StatsSection } from "@/components/site/StatsSection";
import { TrustedBy } from "@/components/site/TrustedBy";
import { cn } from "@/lib/utils";
import { defaultStyle } from "@/lib/qr/style";
import { defaultForm } from "@/lib/qr/payload";

type Mode = "single" | "bulk";

export default function Index() {
  const [mode, setMode] = useState<Mode>("single");
  const [step, setStep] = useState<"create" | "wizard">("create");
  const [result, setResult] = useState<GeneratorResult | null>(null);
  const [brandLogo, setBrandLogo] = useState<string | null>(null);
  const [brandPreset, setBrandPreset] = useState<{ blend: string; opacity: number; scale: number } | null>(null);

  const handleGenerate = (r: GeneratorResult) => {
    setResult(r);
    setStep("wizard");
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 30);
  };

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<BrandClickDetail>).detail;
      if (!detail) return;
      setBrandLogo(detail.logoUrl);
      setBrandPreset({ blend: detail.blend, opacity: detail.opacity, scale: detail.scale });
      const brandUrl = `https://www.${detail.name.toLowerCase().replace(/[^a-z]/g, "")}.com`;
      const brandStyle = {
        ...defaultStyle,
        fg: detail.color,
        cornerSquareColor: detail.accent,
        cornerDotColor: detail.color,
      };
      setResult({
        form: { ...defaultForm, type: "url" as const, url: brandUrl },
        style: brandStyle,
        payload: brandUrl,
      });
      setStep("wizard");
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 30);
    };
    window.addEventListener(BRAND_CLICK_EVENT, handler);
    return () => window.removeEventListener(BRAND_CLICK_EVENT, handler);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ mode: Mode }>).detail;
      if (!detail?.mode) return;
      setStep("create");
      setMode(detail.mode);
      setTimeout(() => {
        const el = document.getElementById("generator");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    };
    window.addEventListener("qr-set-mode", handler);
    return () => window.removeEventListener("qr-set-mode", handler);
  }, []);

  // Handle hash-based deep links from other pages (#generator, #generator-bulk, #faq)
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;
    setTimeout(() => {
      if (hash === "generator-bulk") {
        setStep("create");
        setMode("bulk");
        document.getElementById("generator")?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (hash === "generator") {
        setStep("create");
        document.getElementById("generator")?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 80);
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />

      {step === "create" ? (
        <>
          <Hero />

          {/* Single / Bulk toggle */}
          <section id="generator" className="container mt-12 sm:mt-16 scroll-mt-24">
            <div className="mx-auto mb-6 flex max-w-xl gap-3">
              <ModeButton
                active={mode === "single"}
                onClick={() => setMode("single")}
                icon={<QrCode className="h-4 w-4" />}
                label="Single QR"
              />
              <ModeButton
                active={mode === "bulk"}
                onClick={() => setMode("bulk")}
                icon={<Layers className="h-4 w-4" />}
                label="Bulk QR"
              />
            </div>

            {/* Generator with reserved blank space for a manually-inserted AdSense unit */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
              <aside
                className="hidden lg:block min-h-[600px]"
                aria-hidden="true"
                data-ad-slot="generator-sidebar"
              />

              <div className="min-w-0">
                {mode === "single" ? (
                  <QrGenerator onGenerate={handleGenerate} />
                ) : (
                  <BulkGenerator />
                )}
              </div>
            </div>
          </section>

          {/* Statistics — directly below the QR generator */}
          <StatsSection />

          {/* Trusted By brands */}
          <TrustedBy />

          {mode === "single" && (
            <>
              <HowItWorks />
              <PopularUseCases />
            </>
          )}

          <SpecializedSection />
          <FeaturesSection />
          <ReviewsSection />
          <FaqSection />
        </>
      ) : (
        <section className="container mt-10">
          <QrWizard
            data={result!.payload}
            initialStyle={result!.style}
            filenameHint={`qr-forge-${result!.form.type}`}
            onBack={() => { setStep("create"); setBrandLogo(null); setBrandPreset(null); }}
            initialLogoUrl={brandLogo}
            initialLogoPreset={brandPreset}
          />
        </section>
      )}

      <FeedbackSection />
      <Footer />
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-all",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-elev-md"
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
