import { Star, PenLine, Sparkles, User as UserIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

type Review = { text: string; author: string; role: string; avatar: string };

const REVIEWS: Review[] = [
  {
    text: "I run a small coffee shop in Portland and switched our paper menus to QR menus during a renovation. QR Forge let me brand them with our logo and house color in about ten minutes. Two months later, scans still work perfectly — even the older iPhones our regulars carry. Worth every star.",
    author: "Sarah Johnson", role: "Café owner, Portland",
    avatar: "https://i.pravatar.cc/120?img=47",
  },
  {
    text: "I organize street-food markets and we print 800+ vendor QR badges per event. The bulk generator + ZIP download saved me an entire weekend. Auto-detect caught the mix of URLs and contact cards I pasted in. Can't go back to the old workflow.",
    author: "Marcus Thompson", role: "Event organizer",
    avatar: "https://i.pravatar.cc/120?img=12",
  },
  {
    text: "As a freelance illustrator I put a QR portfolio on my business cards. Tried 4 other generators — most slap a watermark or break when you add a logo. This one is genuinely free, the codes scan instantly, and the dot styles actually match my brand.",
    author: "Priya Patel", role: "Freelance illustrator",
    avatar: "https://i.pravatar.cc/120?img=44",
  },
  {
    text: "We replaced printed table cards at our restaurant with QR menus. Our regulars are 60+ and I was worried — but every single one scanned on the first try. The contrast warning when I picked a too-light yellow saved me from reprinting 40 cards.",
    author: "David Williams", role: "Restaurant owner",
    avatar: "https://i.pravatar.cc/120?img=68",
  },
  {
    text: "Used it for a 1,200-person conference. Generated unique entry QR tickets in bulk, downloaded them as a single ZIP, and emailed them out. Zero scan failures at the door. Our previous ticketing tool charged $0.40 per code — this was free.",
    author: "Aisha Rahman", role: "Conference producer",
    avatar: "https://i.pravatar.cc/120?img=49",
  },
  {
    text: "I'm a content creator and put a QR code on every video thumbnail to push viewers to my Linktree. The custom logo + gradient option made it actually look like part of my brand instead of a random black square. Click-throughs went up.",
    author: "Michael Chen", role: "YouTube creator",
    avatar: "https://i.pravatar.cc/120?img=15",
  },
  {
    text: "Real-estate agent here. I print yard-sign QR codes that link straight to the listing video tour. Buyers love it, sellers love it, and my codes have never broken. The dynamic option means I can update the URL after a price drop without reprinting signs.",
    author: "Olivia Martinez", role: "Real-estate agent",
    avatar: "https://i.pravatar.cc/120?img=32",
  },
  {
    text: "I teach high-school chemistry and put QR codes on lab worksheets that link to safety videos. Students scan them with their phones and watch before starting. Took me 5 minutes to make all 12. Honestly didn't expect a free tool to feel this polished.",
    author: "James O'Connor", role: "High-school teacher",
    avatar: "https://i.pravatar.cc/120?img=33",
  },
  {
    text: "Built a WiFi QR for our Airbnb and stuck it on the fridge. Guests stop texting me for the password. Tiny thing, but it was the first review where someone specifically thanked me for it. 10/10 weekend project.",
    author: "Emily Carter", role: "Airbnb host",
    avatar: "https://i.pravatar.cc/120?img=20",
  },
  {
    text: "Wedding planner. We did seating-chart QR codes and a shared photo-album QR for guests. Both worked flawlessly all night, even in dim lighting. The bride cried (the good kind). I'll be using QR Forge for every wedding from now on.",
    author: "Nia Bennett", role: "Wedding planner",
    avatar: "https://i.pravatar.cc/120?img=45",
  },
  {
    text: "I run a one-man dog-grooming business. I added a QR sticker to my van that opens my booking page. Three new clients in the first week told me 'I scanned your van.' Free advertising, no app to install, no learning curve.",
    author: "Tom Becker", role: "Small business owner",
    avatar: "https://i.pravatar.cc/120?img=11",
  },
  {
    text: "Designer at a small agency. We needed branded QR codes for a client deck and the SVG export saved us — clean vector, no pixelation when scaled up to a billboard mock. The interface is way faster than the paid tools we'd been forced to use.",
    author: "Hannah Lee", role: "Brand designer",
    avatar: "https://i.pravatar.cc/120?img=23",
  },
];

const ROW_A = REVIEWS.slice(0, 6);
const ROW_B = REVIEWS.slice(6);

function ReviewCard({ r }: { r: Review }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = r.text.length > 180;
  return (
    <article
      className="glass-panel flex w-[260px] shrink-0 flex-col gap-3 rounded-2xl p-4 transition-all duration-300 hover:shadow-[0_20px_60px_-20px_hsl(var(--primary)/0.35)] sm:w-[300px]"
      style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
    >
      <div className="flex text-amber-400">
        {Array.from({ length: 5 }).map((_, j) => (
          <Star key={j} className="h-3 w-3 fill-current" />
        ))}
      </div>
      <p
        className={
          (expanded ? "" : "line-clamp-5 ") +
          "text-xs leading-relaxed text-foreground/90 sm:text-[13px]"
        }
      >
        "{r.text}"
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="self-start text-[11px] font-semibold text-primary hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
      <div className="mt-auto flex items-center gap-3 pt-2">
        {r.avatar ? (
          <img
            src={r.avatar}
            alt={r.author}
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
            className="h-8 w-8 rounded-full border border-white/10 object-cover"
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-secondary text-muted-foreground">
            <UserIcon className="h-4 w-4" />
          </span>
        )}
        <div>
          <p className="text-xs font-semibold text-foreground">{r.author}</p>
          <p className="text-[10px] text-muted-foreground">{r.role}</p>
        </div>
      </div>
    </article>
  );
}

function Row({ items, direction }: { items: Review[]; direction: "left" | "right" }) {
  const track = [...items, ...items];
  return (
    <div
      className="relative overflow-hidden"
      style={{
        maskImage: "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)",
      }}
    >
      <div className={direction === "left" ? "marquee-track-slow flex w-max gap-4" : "marquee-track-reverse flex w-max gap-4"}>
        {track.map((r, i) => (
          <ReviewCard key={`${r.author}-${i}`} r={r} />
        ))}
      </div>
    </div>
  );
}

export function ReviewsSection() {
  const [count, setCount] = useState(4738);
  const [liveReviews, setLiveReviews] = useState<Review[]>([]);
  useEffect(() => {
    const id = setInterval(() => setCount((c) => c + 1), 4000);
    let cancelled = false;
    (async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data } = await supabase
          .from("reviews")
          .select("name,role,review_text,avatar_url")
          .eq("approved", true)
          .order("created_at", { ascending: false })
          .limit(30);
        if (cancelled || !data?.length) return;
        setLiveReviews(
          data.map((r) => ({
            text: r.review_text,
            author: r.name,
            role: r.role ?? "",
            avatar: r.avatar_url ?? "",
          })),
        );
      } catch { /* ignore — fall back to seeded reviews */ }
    })();
    return () => { cancelled = true; clearInterval(id); };
  }, []);
  const merged = liveReviews.length ? [...liveReviews, ...REVIEWS] : REVIEWS;
  const half = Math.ceil(merged.length / 2);
  const rowA = merged.slice(0, half);
  const rowB = merged.slice(half);
  return (
    <section className="mt-20 sm:mt-28">
      <div className="container mx-auto max-w-2xl text-center">
        <h2
          className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl text-shadow-soft"
          style={{ fontFamily: '"Space Grotesk", "Inter", system-ui, sans-serif', letterSpacing: "-0.02em" }}
        >
          Loved by <span className="tabular-nums text-primary">{count.toLocaleString()}+</span> creators
        </h2>
        <div className="mt-3 flex items-center justify-center gap-2 text-amber-400">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-5 w-5 fill-current" />
          ))}
          <span className="ml-1 text-sm font-medium text-muted-foreground">4.8 average rating</span>
        </div>
        <p className="mt-4 text-sm text-muted-foreground text-shadow-soft" style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>
          Designers, restaurant owners, event planners, and developers love QR Forge.
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            to="/share-review"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-hero px-8 py-4 text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-elev-md transition-transform hover:scale-[1.04] active:scale-95"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <Sparkles className="h-4 w-4 animate-pulse" />
            <span className="relative">Write a review</span>
            <PenLine className="h-4 w-4 relative" />
          </Link>
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-4">
        <Row items={rowA} direction="left" />
        <Row items={rowB} direction="right" />
      </div>
    </section>
  );
}
