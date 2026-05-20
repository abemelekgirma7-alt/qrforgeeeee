import { useEffect, useRef, useState } from "react";
import { SkipForward, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const EVENT_NAME = "qrforge:popup-ad";
const COUNTDOWN_SECONDS = 30;

type AdDetail = { onComplete?: () => void };

/**
 * YouTube-style ad gate. Fires before a download.
 * Pass an onComplete callback that runs after the user closes/skips the ad —
 * the actual file download happens then.
 *
 *   firePopupAd(() => doDownload());
 *
 * The X / Skip controls are disabled until COUNTDOWN_SECONDS elapses.
 */
export function PopupAd() {
  const [open, setOpen] = useState(false);
  const [remaining, setRemaining] = useState(COUNTDOWN_SECONDS);
  const onCompleteRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<number | null>(null);

  const cleanup = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<AdDetail>).detail;
      onCompleteRef.current = detail?.onComplete ?? null;
      setRemaining(COUNTDOWN_SECONDS);
      setOpen(true);
      cleanup();
      timerRef.current = window.setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            cleanup();
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
      cleanup();
    };
  }, []);

  const close = () => {
    if (remaining > 0) return;
    setOpen(false);
    cleanup();
    const cb = onCompleteRef.current;
    onCompleteRef.current = null;
    if (cb) cb();
  };

  if (!open) return null;

  const canSkip = remaining === 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Sponsored content"
    >
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border bg-card shadow-elev-lg animate-scale-in">
        {/* Close (X) — top-right */}
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="secondary"
            size="icon"
            className="h-9 w-9 rounded-full shadow-elev-md disabled:opacity-50"
            onClick={close}
            disabled={!canSkip}
            aria-label="Close ad"
            title={canSkip ? "Close" : `Available in ${remaining}s`}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {/* Skip — bottom-right */}
        <div className="absolute bottom-4 right-4 z-10">
          {canSkip ? (
            <Button
              variant="secondary"
              size="sm"
              className="h-9 gap-1.5 rounded-full text-xs shadow-elev-md"
              onClick={close}
              aria-label="Skip ad"
            >
              Skip ad <SkipForward className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <span className="rounded-full bg-background/80 px-3 py-1.5 text-[11px] font-medium text-muted-foreground shadow-elev-sm backdrop-blur">
              Skip in {remaining}s
            </span>
          )}
        </div>
        <div className="relative w-full">
          <div className="aspect-video bg-gradient-to-br from-primary/20 via-secondary to-accent" />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
              Sponsored
            </span>
            <h3 className="mt-3 text-2xl font-bold sm:text-3xl">Your ad plays here</h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Your QR code download will start automatically when the ad ends or you skip it.
            </p>
            <div className="mt-5 h-1.5 w-48 overflow-hidden rounded-full bg-background/60">
              <div
                className="h-full bg-primary transition-[width] duration-1000 ease-linear"
                style={{
                  width: `${((COUNTDOWN_SECONDS - remaining) / COUNTDOWN_SECONDS) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function firePopupAd(onComplete?: () => void) {
  window.dispatchEvent(
    new CustomEvent<AdDetail>(EVENT_NAME, { detail: { onComplete } }),
  );
}
