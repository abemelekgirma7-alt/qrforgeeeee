import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";

export default function Terms() {
  useEffect(() => {
    document.title = "Terms of Service";
    const meta = document.querySelector('meta[name="description"]');
    if (meta)
      meta.setAttribute(
        "content",
        "QR Forge terms of service: the rules for using our QR code generator and related services.",
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
          <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: May 30, 2026</p>

          <p className="mt-6 text-sm text-muted-foreground">
            By using QR Forge you agree to these terms. If you don't agree, please don't use the service.
          </p>

          <Section title="1. Using the Service">
            <p>You must be at least 13 years old. Use QR Forge only for lawful purposes.</p>
          </Section>

          <Section title="2. What's Not Allowed">
            <ul className="list-disc space-y-1 pl-5">
              <li>Generating QR codes that link to illegal, fraudulent, or malicious content.</li>
              <li>Phishing, malware, or copyright‑infringing material.</li>
              <li>Attempting to break, overload, or abuse the service.</li>
            </ul>
            <p>We may suspend or terminate access for violations.</p>
          </Section>

          <Section title="3. Accounts">
            <p>
              If you create an account, you're responsible for keeping your credentials safe and for
              activity under your account.
            </p>
          </Section>

          <Section title="4. Your Content">
            <p>
              You keep ownership of anything you put into the generator. You grant us a limited
              license to process it only as needed to provide the service.
            </p>
          </Section>

          <Section title="5. Intellectual Property">
            <p>
              The QR Forge software, design, and branding belong to us. These terms don't transfer
              any ownership to you.
            </p>
          </Section>

          <Section title="6. Ads &amp; Third Parties">
            <p>
              The service may show ads (e.g. Google AdSense) and link to third‑party sites. We're
              not responsible for their content or practices.
            </p>
          </Section>

          <Section title="7. No Warranty">
            <p>
              QR Forge is provided "as is", without warranties of any kind. We don't guarantee it
              will always be available, error‑free, or fit for a particular purpose.
            </p>
          </Section>

          <Section title="8. Limitation of Liability">
            <p>
              To the maximum extent permitted by law, QR Forge isn't liable for indirect or
              consequential damages, lost profits, or lost data arising from your use of the service.
            </p>
          </Section>

          <Section title="9. Privacy">
            <p>
              See our{" "}
              <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>{" "}
              and{" "}
              <Link to="/cookies" className="text-primary hover:underline">Cookie Policy</Link>{" "}
              for how we handle data.
            </p>
          </Section>

          <Section title="10. Changes">
            <p>
              We may update these terms. Continued use after changes means you accept the updated terms.
            </p>
          </Section>

          <Section title="11. Contact">
            <p>
              <Link to="/contact" className="text-primary hover:underline">
                Contact us
              </Link>{" "}
              with any questions.
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
