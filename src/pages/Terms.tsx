import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";

export default function Terms() {
  useEffect(() => { document.title = "terms of service"; }, []);
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container max-w-3xl py-12">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to QR Forge
        </Link>

        <article className="surface-card p-8 sm:p-10">
          <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: 2026-04-23</p>

          <p className="mt-6 text-sm text-muted-foreground">
            By using QR Forge you agree to these terms.
          </p>

          <Section title="1. Use">
            <p>Use for lawful purposes only. No malicious or illegal QR content.</p>
          </Section>
          <Section title="2. IP">
            <p>Our branding is ours; you own your encoded content.</p>
          </Section>
          <Section title="3. Responsibility">
            <p>You are fully responsible for your QR codes and any consequences.</p>
          </Section>
          <Section title="4. No Warranty">
            <p>Service provided as‑is. No guarantee of scannability or uptime.</p>
          </Section>
          <Section title="5. Liability">
            <p>We are not liable for damages arising from use.</p>
          </Section>
          <Section title="6. Ads & Links">
            <p>We show ads; not responsible for third‑party content.</p>
          </Section>
          <Section title="7. Indemnity">
            <p>You indemnify us against claims from your misuse.</p>
          </Section>
          <Section title="8. Changes">
            <p>Terms may change; continued use means acceptance.</p>
          </Section>
          <Section title="9. Governing Law">
            <p>Local laws apply.</p>
          </Section>
          <Section title="10. Contact">
            <p>
              <a href="mailto:support@qrforge.com" className="text-primary hover:underline">
                support@qrforge.com
              </a>
            </p>
          </Section>
        </article>
      </main>
      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}
