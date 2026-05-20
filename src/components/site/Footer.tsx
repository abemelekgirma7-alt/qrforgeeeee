import { Mail, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";

const COLUMNS: Array<{
  heading: string;
  taglines?: string[];
  links?: { label: string; to?: string; action?: "faq" | "bulk" | "single" | "how"; href?: string; external?: boolean }[];
}> = [
  {
    heading: "QR Forge",
    taglines: ["The privacy-first QR platform.", "Create, manage, share."],
  },
  {
    heading: "Features",
    links: [
      { label: "QR Codes", action: "single" },
      { label: "Templates", href: "#templates" },
      { label: "Bulk Creation", action: "bulk" },
      { label: "QR Scanner", to: "/scanner" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "How it works", action: "how" },
      { label: "FAQ", action: "faq" },
      { label: "Blog", to: "/blog" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "About us", to: "/about" },
      { label: "Contact", to: "/contact" },
      { label: "Privacy", to: "/privacy" },
      { label: "Terms", to: "/terms" },
      { label: "Cookies", to: "/cookies" },
    ],
  },
];

export function FeedbackSection() {
  return (
    <section className="container mt-20 sm:mt-28">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ y: -6, boxShadow: "0 30px 70px -20px hsl(var(--primary) / 0.45)" }}
        className="group relative mx-auto max-w-2xl overflow-hidden rounded-3xl border bg-card p-10 text-center shadow-elev-md sm:p-12"
      >
        {/* Animated gradient orbs */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.55), transparent 65%)" }}
          animate={{ x: [0, 30, 0], y: [0, 20, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 10, ease: "easeInOut", repeat: Infinity }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, hsl(var(--primary-glow) / 0.55), transparent 65%)" }}
          animate={{ x: [0, -25, 0], y: [0, -15, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 12, ease: "easeInOut", repeat: Infinity }}
        />
        {/* Shimmer sweep on hover */}
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />

        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          whileInView={{ scale: 1, rotate: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, type: "spring", stiffness: 160, damping: 12 }}
          className="relative z-10 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-hero text-primary-foreground shadow-elev-md"
        >
          <Sparkles className="h-7 w-7" />
        </motion.div>

        <h3 className="relative z-10 text-2xl font-bold sm:text-3xl">Need help or feedback?</h3>
        <p className="relative z-10 mt-3 text-base text-muted-foreground sm:text-lg">
          We're here to make QR Forge better for you. Reach out any time — we usually reply
          within 24–48 hours.
        </p>
        <div className="relative z-10 mt-6 flex flex-wrap items-center justify-center gap-3">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-elev-md hover:bg-primary-hover"
            >
              <Mail className="h-4 w-4" /> Contact support
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

export function Footer() {
  const location = useLocation();
  const navigate = useNavigate();

  const triggerAction = (action: "faq" | "bulk" | "single" | "how") => {
    if (action === "how") {
      if (location.pathname !== "/") return navigate("/#how-it-works");
      document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (location.pathname !== "/") {
      const hash =
        action === "faq" ? "/#faq" : action === "bulk" ? "/#generator-bulk" : "/#generator";
      navigate(hash);
      return;
    }
    if (action === "faq") {
      document.getElementById("faq")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.dispatchEvent(
        new CustomEvent("qr-set-mode", { detail: { mode: action } }),
      );
      document.getElementById("generator")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <footer className="mt-24 bg-footerbg border-t">
      <div className="container py-12">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-5 text-left sm:grid-cols-4 sm:gap-6">
          {COLUMNS.map((col) => (
            <div key={col.heading} className="flex flex-col items-start gap-2">
              {col.heading === "QR Forge" ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-hero text-primary-foreground shadow-elev-sm">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-4 w-4">
                      <rect x="3" y="3" width="7" height="7" rx="1.2" />
                      <rect x="14" y="3" width="7" height="7" rx="1.2" />
                      <rect x="3" y="14" width="7" height="7" rx="1.2" />
                      <rect x="5.5" y="5.5" width="2" height="2" rx="0.4" fill="currentColor" stroke="none" />
                      <rect x="16.5" y="5.5" width="2" height="2" rx="0.4" fill="currentColor" stroke="none" />
                      <rect x="5.5" y="16.5" width="2" height="2" rx="0.4" fill="currentColor" stroke="none" />
                    </svg>
                  </span>
                  <span className="text-base font-bold tracking-tight sm:text-lg">
                    QR <span className="text-primary">Forge</span>
                  </span>
                </div>
              ) : (
                <h4 className="text-sm font-bold uppercase tracking-wider text-foreground sm:text-xs md:text-sm">
                  {col.heading}
                </h4>
              )}
              {col.taglines?.map((t) => (
                <p key={t} className="text-sm leading-snug text-muted-foreground sm:text-xs md:text-sm">
                  {t}
                </p>
              ))}
              {col.links?.map((l) =>
                l.to ? (
                  <Link
                    key={l.label}
                    to={l.to}
                    className="text-sm text-muted-foreground transition-all hover:text-primary sm:text-xs md:text-sm"
                  >
                    {l.label}
                  </Link>
                ) : l.action ? (
                  <button
                    key={l.label}
                    type="button"
                    onClick={() => triggerAction(l.action!)}
                    className="text-left text-sm text-muted-foreground transition-all hover:text-primary sm:text-xs md:text-sm"
                  >
                    {l.label}
                  </button>
                ) : (
                  <a
                    key={l.label}
                    href={l.href}
                    target={l.external ? "_blank" : undefined}
                    rel={l.external ? "noreferrer noopener" : undefined}
                    className="text-sm text-muted-foreground transition-all hover:text-primary sm:text-xs md:text-sm"
                  >
                    {l.label}
                  </a>
                ),
              )}
            </div>
          ))}
        </div>

        <p className="mx-auto mt-8 max-w-3xl text-center text-sm text-muted-foreground sm:text-xs">
          © 2026 QR Forge. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
