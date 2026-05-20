import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function Hero() {
  const scrollToGenerator = () => {
    const el = document.getElementById("generator");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="container relative mt-8 sm:mt-12 text-center">
      {/* Ambient backdrop */}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 -z-0 h-[36rem] -translate-y-1/2 overflow-hidden">
        <motion.div
          aria-hidden
          className="absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl"
          style={{ background: "radial-gradient(circle at center, hsl(var(--primary) / 0.55), transparent 60%)" }}
          animate={{ scale: [1, 1.12, 1], rotate: [0, 18, 0] }}
          transition={{ duration: 14, ease: "easeInOut", repeat: Infinity }}
        />
        <motion.div
          aria-hidden
          className="absolute left-[20%] top-[30%] h-72 w-72 rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, hsl(var(--primary-glow) / 0.5), transparent 65%)" }}
          animate={{ x: [0, 30, -10, 0], y: [0, -20, 10, 0] }}
          transition={{ duration: 18, ease: "easeInOut", repeat: Infinity }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl px-3 py-1 text-xs font-medium text-muted-foreground shadow-elev-sm"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
        The ultimate QR code generator
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="hero-heading relative z-10 mx-auto mt-6 max-w-4xl font-extrabold tracking-tight text-[clamp(1.8rem,4.6vw,3.8rem)] leading-[1.05]"
        style={{
          fontFamily: '"Space Grotesk", "Inter", system-ui, sans-serif',
          letterSpacing: "-0.02em",
        }}
      >
        Unlimited free QR codes,
        <br />
        built for brands.
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mx-auto mt-5 max-w-2xl text-balance text-sm font-normal text-muted-foreground sm:text-base md:text-lg text-shadow-soft"
        style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
      >
        Branded with your logo, exported in 4K, generated in bulk. No sign-up, no watermark, no expiry.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.75, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mt-8 flex justify-center"
      >
        <button
          type="button"
          onClick={scrollToGenerator}
          className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-hero px-8 py-4 text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-elev-md transition-transform hover:scale-[1.04] active:scale-95 sm:text-base"
        >
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          <Sparkles className="h-4 w-4 animate-pulse" />
          <span className="relative">Create QR</span>
        </button>
      </motion.div>
    </section>
  );
}
