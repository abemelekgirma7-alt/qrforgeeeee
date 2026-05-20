import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";

export default function Cookies() {
  useEffect(() => {
    document.title = "Cookie Policy";
    const meta = document.querySelector('meta[name="description"]');
    if (meta)
      meta.setAttribute(
        "content",
        "QR Forge cookie policy: what cookies we use, why we use them, and how to manage your preferences.",
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
          <h1 className="text-3xl font-bold tracking-tight">Cookie Policy</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>

          <p className="mt-6 text-sm text-muted-foreground">
            This policy explains how QR Forge uses cookies and similar technologies.
          </p>

          <Section title="1. What Are Cookies?">
            <p>
              Cookies are small text files placed on your device when you visit a website. They help the site
              remember your preferences, keep you signed in, and understand how visitors use the platform.
            </p>
          </Section>
          <Section title="2. How We Use Cookies">
            <ul className="list-disc space-y-1 pl-5">
              <li><strong>Essential</strong> — required for sign-in, security, and core generator functionality.</li>
              <li><strong>Preference</strong> — remember your theme and recent QR settings.</li>
              <li><strong>Analytics</strong> — help us understand which pages are popular.</li>
              <li><strong>Advertising</strong> — used by Google AdSense and similar partners.</li>
            </ul>
          </Section>
          <Section title="3. Third‑Party Cookies">
            <p>
              We may allow trusted third parties (Google AdSense, Google Analytics, Supabase) to set cookies on
              your device. These partners have their own privacy policies.
            </p>
          </Section>
          <Section title="4. Google AdSense">
            <p>
              Google uses cookies to serve ads based on your visits to this site and others. You can opt out at{" "}
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google Ads Settings
              </a>
              .
            </p>
          </Section>
          <Section title="5. Managing Cookies">
            <p>
              Most browsers let you control cookies through their settings. Blocking cookies may affect parts of
              QR Forge.
            </p>
          </Section>
          <Section title="6. Changes">
            <p>We may update this policy. Material changes will be reflected by the date above.</p>
          </Section>
          <Section title="7. Contact">
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
