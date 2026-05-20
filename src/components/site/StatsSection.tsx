import { motion } from "framer-motion";
import { Box, Users, BarChart3, Zap } from "lucide-react";

const STATS = [
  { n: "1M+", l: "QR Codes Created", icon: Box },
  { n: "1,000+", l: "Active Users", icon: Users },
  { n: "10K+", l: "Scans Daily", icon: BarChart3 },
  { n: "<50ms", l: "Redirect Speed", icon: Zap },
];

export function StatsSection() {
  return (
    <section className="container mt-16 sm:mt-20">
      <div className="mx-auto grid grid-cols-4 gap-1.5 sm:max-w-none sm:gap-4">
        {STATS.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.l}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{
                y: -4,
                boxShadow: "0 20px 50px -16px hsl(var(--primary) / 0.45)",
              }}
              className="group relative flex flex-col items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/5 px-1.5 py-2.5 text-center backdrop-blur-xl transition-all sm:gap-2 sm:rounded-2xl sm:p-6"
              style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary/20 sm:h-10 sm:w-10 sm:rounded-xl">
                <Icon className="h-3 w-3 sm:h-5 sm:w-5" />
              </div>
              <div
                className="text-[13px] font-extrabold leading-none tracking-tight text-foreground sm:text-3xl md:text-4xl"
                style={{ fontFamily: '"Space Grotesk", "Inter", system-ui, sans-serif', letterSpacing: "-0.02em" }}
              >
                {s.n}
              </div>
              <div className="text-[8px] font-medium uppercase leading-tight tracking-wider text-muted-foreground sm:text-xs">
                {s.l}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
