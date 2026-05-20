import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";

export default function Privacy() {
  useEffect(() => { document.title = "privacy"; }, []);
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

        <article className="surface-card p-8 sm:p-10 prose-content">
          <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: 2026-04-23</p>

          <p className="mt-6">
            QR Forge ("we", "our", "us") operates the website (the "Service"). This page informs
            you of our policies regarding the collection, use, and disclosure of personal data
            when you use our Service.
          </p>

          <Section title="1. Information We Collect">
            <p>
              We do not collect, store, or transmit any of the content you enter. All QR
              generation happens entirely in your browser. Your data never leaves your device.
            </p>
            <p>
              We may collect non‑personal usage data (browser type, device, pages visited)
              through analytics and advertising networks (like Google AdSense).
            </p>
          </Section>

          <Section title="2. Advertising & Cookies">
            <p>
              Ads are served by third‑party vendors who may use cookies. You can opt out via
              Google Ads Settings or disable cookies in your browser.
            </p>
          </Section>

          <Section title="3. How We Use Information">
            <p>
              Usage data helps us improve the Service and deliver relevant ads. We do not sell
              or share personal data.
            </p>
          </Section>

          <Section title="4. Data Retention">
            <p>No QR content is stored. Anonymized analytics are kept for necessary periods.</p>
          </Section>

          <Section title="5. Third‑Party Services">
            <p>
              We use trusted libraries (Google Fonts, Font Awesome) that may collect technical
              data.
            </p>
          </Section>

          <Section title="6. Children's Privacy">
            <p>Not directed at under‑13s. We do not knowingly collect their data.</p>
          </Section>

          <Section title="7. Your Rights">
            <p>
              You may access and request deletion of any personal data we might hold (we hold
              none beyond analytics).
            </p>
          </Section>

          <Section title="8. Changes">
            <p>Updates will be posted here.</p>
          </Section>

          <Section title="9. Contact">
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
