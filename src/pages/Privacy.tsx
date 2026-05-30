import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";

export default function Privacy() {
  useEffect(() => {
    document.title = "Privacy Policy";
    const meta = document.querySelector('meta[name="description"]');
    if (meta)
      meta.setAttribute(
        "content",
        "QR Forge privacy policy: what we collect, why we collect it, and the choices you have.",
      );
  }, []);

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
          <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: May 28, 2026</p>

          <p className="mt-6 text-sm text-muted-foreground">
            This policy explains what information QR Forge collects, how we use it, and the
            choices you have. We try to collect as little as possible.
          </p>

          <Section title="1. What We Collect">
            <ul className="list-disc space-y-1 pl-5">
              <li><strong>Account info</strong> — email and name if you create an account.</li>
              <li><strong>Usage data</strong> — basic analytics like pages visited, device type, and approximate location.</li>
              <li><strong>Cookies</strong> — small files used for sign-in, preferences, analytics, and ads.</li>
            </ul>
            <p>QR codes you generate are created in your browser and are not stored on our servers.</p>
          </Section>

          <Section title="2. How We Use It">
            <ul className="list-disc space-y-1 pl-5">
              <li>To provide and improve the service.</li>
              <li>To keep accounts secure and prevent abuse.</li>
              <li>To understand which features are useful.</li>
              <li>To show relevant advertising.</li>
            </ul>
          </Section>

          <Section title="3. Third‑Party Services">
            <p>
              We use trusted providers to help run QR Forge, including Google Analytics, Google
              AdSense, and our backend infrastructure. Each has its own privacy policy.
            </p>
          </Section>

          <Section title="4. Your Rights">
            <p>
              Depending on where you live (e.g. EEA under GDPR or California under CCPA), you may
              have the right to access, correct, delete, or export your personal data, and to opt
              out of certain processing. To exercise these rights, contact us.
            </p>
          </Section>

          <Section title="5. Data Retention &amp; Security">
            <p>
              We keep personal data only as long as needed to provide the service or meet legal
              obligations. We use reasonable safeguards, but no system is 100% secure.
            </p>
          </Section>

          <Section title="6. Children">
            <p>QR Forge is not intended for children under 13. We do not knowingly collect their data.</p>
          </Section>

          <Section title="7. Changes">
            <p>We may update this policy. Material changes will be reflected by the date above.</p>
          </Section>

          <Section title="8. Contact">
            <p>
              <Link to="/contact" className="text-primary hover:underline">
                Contact us
              </Link>{" "}
              with any questions or privacy requests.
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
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}
