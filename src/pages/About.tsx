import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles, ShieldCheck, Lock, Heart } from "lucide-react";
import { useEffect } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";

export default function About() {
  useEffect(() => {
    document.title = "about us";
    const meta = document.querySelector('meta[name="description"]') || (() => {
      const m = document.createElement("meta");
      m.setAttribute("name", "description");
      document.head.appendChild(m);
      return m;
    })();
    meta.setAttribute(
      "content",
      "About QR Forge — a free, privacy-first QR code generator built for creators, small businesses, and developers worldwide.",
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
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">About QR Forge</h1>
          <p className="mt-3 text-base text-muted-foreground">
            QR Forge is a free QR code generator built to make beautiful, branded,
            scannable QR codes accessible to everyone — no sign-up, no watermark, no hidden fees.
          </p>

          <section className="mt-8 space-y-4 text-sm leading-relaxed text-foreground/90">
            <h2 className="text-xl font-semibold">Our story</h2>
            <p>
              QR Forge started as a side project to solve a simple frustration: every QR code
              generator on the web either limited downloads, slapped on watermarks, or charged
              monthly fees for what should be a one-click utility. We believed creators,
              restaurants, event organizers, and small businesses deserved a tool that was
              powerful, premium-looking, and genuinely free.
            </p>
            <p>
              Today, QR Forge is used by thousands of people every month to create branded QR
              codes for menus, business cards, weddings, events, payments, and more.
            </p>
          </section>

          <section className="mt-8 space-y-4 text-sm leading-relaxed text-foreground/90">
            <h2 className="text-xl font-semibold">What we believe</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Card icon={<Sparkles className="h-5 w-5 text-primary" />} title="Free, forever">
                Unlimited static QR codes. No watermark. No expiration. Ever.
              </Card>
              <Card icon={<ShieldCheck className="h-5 w-5 text-primary" />} title="Privacy first">
                Everything happens in your browser. Your data never touches our servers.
              </Card>
              <Card icon={<Lock className="h-5 w-5 text-primary" />} title="Proprietary &amp; secure">
                QR Forge is a closed-source product maintained by our team. The codebase is
                not public and is not available for external editing.
              </Card>
              <Card icon={<Heart className="h-5 w-5 text-primary" />} title="Built with care">
                Designed for clarity, scannability, and a premium look — out of the box.
              </Card>
            </div>
          </section>

          <section className="mt-8 space-y-3 text-sm leading-relaxed text-foreground/90">
            <h2 className="text-xl font-semibold">Who's behind QR Forge</h2>
            <p>
              QR Forge is independently maintained by a small team of designers and developers
              passionate about good tooling. We don't sell user data. We're funded by tasteful
              ad placements that keep the tool free for everyone.
            </p>
            <p>
              Have a question, idea, or partnership in mind? We'd love to hear from you on our{" "}
              <Link to="/contact" className="text-primary underline-offset-2 hover:underline">
                Contact page
              </Link>
              .
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
}

function Card({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-secondary/40 p-4">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{children}</p>
    </div>
  );
}
