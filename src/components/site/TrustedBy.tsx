// Two distinct brand sets — left row has different names than right row.
const ROW_A = [
  "Spotify", "Airbnb", "Stripe", "Notion", "Figma", "Shopify",
  "Vercel", "Linear", "Discord", "Slack",
];
const ROW_B = [
  "Netflix", "Adobe", "Tesla", "Uber", "Pinterest", "Twitch",
  "Dropbox", "GitHub", "Atlassian", "Canva",
];

function Row({ items, reverse = false }: { items: string[]; reverse?: boolean }) {
  const track = [...items, ...items, ...items];
  return (
    <div
      className="relative overflow-hidden"
      style={{
        maskImage: "linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)",
      }}
    >
      <div
        className={reverse ? "marquee-track-reverse flex w-max items-center gap-12 px-4 py-3" : "marquee-track-slow flex w-max items-center gap-12 px-4 py-3"}
        style={{ animationDuration: "40s" }}
      >
        {track.map((name, i) => (
          <span
            key={`${name}-${i}`}
            className="shrink-0 text-xl font-bold tracking-tight text-foreground/40 transition-colors duration-300 hover:text-foreground/80 sm:text-2xl md:text-3xl"
            style={{ fontFamily: '"Space Grotesk", "Inter", system-ui, sans-serif', letterSpacing: "-0.02em" }}
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

export function TrustedBy() {
  return (
    <section className="container mt-16 sm:mt-20">
      <p
        className="mb-8 text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground text-shadow-soft"
        style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
      >
        Trusted by teams at world-class companies
      </p>
      <div className="flex flex-col gap-3">
        <Row items={ROW_A} />
        <Row items={ROW_B} reverse />
      </div>
    </section>
  );
}
