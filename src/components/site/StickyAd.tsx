import { useEffect, useState } from "react";
import { X } from "lucide-react";

/** Sticky bottom 728x90 leaderboard slot. Responsive: shrinks to 320x50 on mobile. */
export function StickyAd() {
  const [open, setOpen] = useState(true);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!open || !show) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-40 flex justify-center px-3 animate-fade-in-up">
      <div className="pointer-events-auto relative flex h-[60px] w-full max-w-[728px] items-center justify-between gap-3 rounded-xl border border-dashed bg-card/95 px-4 text-xs text-muted-foreground shadow-elev-lg backdrop-blur sm:h-[90px] sm:px-6">
        <span className="hidden sm:inline">📣 Advertisement · 728×90</span>
        <span className="sm:hidden">Ad · 320×50</span>
        <span className="font-medium text-foreground">Your sponsored message goes here</span>
        <button
          onClick={() => setOpen(false)}
          className="rounded-full p-1 hover:bg-secondary"
          aria-label="Close ad"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
