import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  HelpCircle,
  Layers,
  LayoutDashboard,
  LogIn,
  LogOut,
  Settings,
  User,
  Menu,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";

function QrMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <rect x="3" y="3" width="7" height="7" rx="1.2" />
      <rect x="14" y="3" width="7" height="7" rx="1.2" />
      <rect x="3" y="14" width="7" height="7" rx="1.2" />
      <rect x="5.5" y="5.5" width="2" height="2" rx="0.4" fill="currentColor" stroke="none" />
      <rect x="16.5" y="5.5" width="2" height="2" rx="0.4" fill="currentColor" stroke="none" />
      <rect x="5.5" y="16.5" width="2" height="2" rx="0.4" fill="currentColor" stroke="none" />
      <path d="M14 14h2v2h-2zM18 14h3v2h-3zM14 18h2v3h-2zM18 18h2v2h-2zM21 18v3M18 21h3" />
    </svg>
  );
}

export function Navbar({ blogLinkLabel = "Blog" }: { blogLinkLabel?: string }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname === "/") {
      const el = document.getElementById("generator");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/#generator");
    }
  };

  // Cross-page jump helper: navigate to "/" then dispatch the appropriate event
  // once Index has mounted. On the home page, dispatch immediately.
  const jumpToBulk = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname === "/") {
      window.dispatchEvent(new CustomEvent("qr-set-mode", { detail: { mode: "bulk" } }));
      document.getElementById("generator")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate("/#generator-bulk");
    }
  };
  const jumpToFaq = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname === "/") {
      document.getElementById("faq")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate("/#faq");
    }
  };

  const isGeneratorLink = blogLinkLabel.toLowerCase() === "generator";
  const blogHref = isGeneratorLink ? "/#generator" : "/blog";

  const navLinks = [
    { label: "About", to: "/about", isHash: false },
    { label: blogLinkLabel, to: blogHref, isHash: isGeneratorLink },
    { label: "Support", to: "/contact", isHash: false },
  ];

  return (
    <header className="container flex flex-wrap items-center gap-x-3 gap-y-2 pt-5 sm:pt-8 md:pt-10">
      <a href="/#generator" onClick={handleLogoClick} className="flex shrink-0 cursor-pointer items-center gap-2" aria-label="QR Forge — go to generator">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-hero text-primary-foreground shadow-elev-sm sm:h-10 sm:w-10">
          <QrMark className="h-5 w-5 sm:h-6 sm:w-6" />
        </span>
        <span className="text-base font-bold tracking-tight sm:text-lg md:text-xl">
          QR <span className="text-primary">Forge</span>
        </span>
      </a>

      {/* Desktop nav links */}
      <nav className="ml-2 hidden items-center gap-4 lg:flex">
        {navLinks.map((l) =>
          l.isHash ? (
            <a key={l.label} href={l.to} className="text-sm font-medium text-muted-foreground hover:text-primary">
              {l.label}
            </a>
          ) : (
            <Link key={l.label} to={l.to} className="text-sm font-medium text-muted-foreground hover:text-primary">
              {l.label}
            </Link>
          ),
        )}
        <a
          href="/#generator-bulk"
          onClick={jumpToBulk}
          className="text-sm font-medium text-muted-foreground hover:text-primary"
        >
          Bulk Creation
        </a>
        <a
          href="/#faq"
          onClick={jumpToFaq}
          className="text-sm font-medium text-muted-foreground hover:text-primary"
        >
          FAQ
        </a>
      </nav>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
        {user ? (
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground shadow-elev-sm hover:bg-primary-hover sm:px-3 sm:py-1.5 sm:text-xs md:px-3.5 md:text-sm"
          >
            <LayoutDashboard className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
            <span className="hidden xs:inline">Dashboard</span>
            <span className="xs:hidden">Me</span>
          </Link>
        ) : (
          <Link
            to="/auth"
            className="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 text-[11px] font-semibold text-foreground hover:border-primary hover:text-primary sm:px-3 sm:py-1.5 sm:text-xs md:px-3.5 md:text-sm"
          >
            <LogIn className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" /> Login
          </Link>
        )}

        <ThemeToggle className="ml-0.5" />

        <Sheet>
          <SheetTrigger
            aria-label="Open menu"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border bg-card text-muted-foreground shadow-elev-sm hover:bg-secondary hover:text-foreground sm:h-9 sm:w-9 lg:hidden"
          >
            <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-[82vw] max-w-sm">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-hero text-primary-foreground">
                  <QrMark className="h-4 w-4" />
                </span>
                Menu
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col">
              {navLinks.map((l) =>
                l.isHash ? (
                  <SheetClose asChild key={l.label}>
                    <a href={l.to} className="rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-secondary">
                      {l.label}
                    </a>
                  </SheetClose>
                ) : (
                  <SheetClose asChild key={l.label}>
                    <Link to={l.to} className="rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-secondary">
                      {l.label}
                    </Link>
                  </SheetClose>
                ),
              )}
              <SheetClose asChild>
                <a
                  href="/#generator-bulk"
                  onClick={jumpToBulk}
                  className="rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-secondary"
                >
                  Bulk Creation
                </a>
              </SheetClose>
              <SheetClose asChild>
                <a
                  href="/#faq"
                  onClick={jumpToFaq}
                  className="rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-secondary"
                >
                  FAQ
                </a>
              </SheetClose>
              <div className="my-3 h-px bg-border" />
              <SheetClose asChild>
                <Link to="/privacy" className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary">Privacy</Link>
              </SheetClose>
              <SheetClose asChild>
                <Link to="/terms" className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary">Terms</Link>
              </SheetClose>
            </nav>
          </SheetContent>
        </Sheet>

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Settings"
            className="ml-0.5 hidden h-8 w-8 items-center justify-center rounded-full border bg-card text-muted-foreground shadow-elev-sm transition-colors hover:bg-secondary hover:text-foreground lg:inline-flex lg:h-9 lg:w-9"
          >
            <Settings className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Settings</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {user ? (
              <>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard"><User className="mr-2 h-4 w-4" />Account</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => supabase.auth.signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />Sign out
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem asChild>
                <Link to="/auth"><LogIn className="mr-2 h-4 w-4" />Sign in</Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/blog"><BookOpen className="mr-2 h-4 w-4" />Blog</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/about">About</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/contact">Contact</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/privacy">Privacy</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/terms">Terms</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
