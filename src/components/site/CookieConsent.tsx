import { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";
import { Link } from "react-router-dom";

const KEY = "qrforge:cookie-consent";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!localStorage.getItem(KEY)) setShow(true);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  const decide = (value: "accepted" | "declined") => {
    localStorage.setItem(KEY, value);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] animate-fade-in-up px-3 pb-3 sm:px-4 sm:pb-4">
      <div className="mx-auto flex max-w-3xl flex-col items-start gap-3 rounded-2xl border bg-card/95 p-4 shadow-elev-md backdrop-blur-md sm:flex-row sm:items-center sm:gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Cookie className="h-5 w-5" />
        </div>
        <p className="flex-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
          We use cookies to keep QR Forge fast, secure, and to understand how the site is used.{" "}
          <Link to="/cookies" className="font-medium text-primary underline-offset-2 hover:underline">
            Learn more
          </Link>
          .
        </p>
        <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
          <button
            onClick={() => decide("declined")}
            className="flex-1 rounded-full border bg-secondary px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground sm:flex-none"
          >
            Decline
          </button>
          <button
            onClick={() => decide("accepted")}
            className="flex-1 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-elev-sm transition-colors hover:bg-primary-hover sm:flex-none"
          >
            Accept
          </button>
          <button
            aria-label="Dismiss"
            onClick={() => decide("declined")}
            className="hidden h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground sm:inline-flex"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
