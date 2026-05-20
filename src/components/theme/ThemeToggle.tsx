import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

/**
 * Single-icon theme toggle.
 * - Defaults to "device" mode on first load (handled by ThemeProvider).
 * - On click, flips between explicit light and dark based on the currently
 *   resolved theme. After the first click the mode becomes explicit; the
 *   user can keep tapping to switch.
 * - Sun ⇄ Moon animate in/out with a soft scale + rotate transition.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolved, setMode } = useTheme();
  const isDark = resolved === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setMode(isDark ? "light" : "dark")}
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border bg-card text-foreground shadow-elev-sm transition-all duration-300 hover:border-primary hover:text-primary",
        className,
      )}
    >
      <Sun
        className={cn(
          "absolute h-4 w-4 transition-all duration-500",
          isDark
            ? "rotate-90 scale-0 opacity-0"
            : "rotate-0 scale-100 opacity-100",
        )}
      />
      <Moon
        className={cn(
          "absolute h-4 w-4 transition-all duration-500",
          isDark
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-90 scale-0 opacity-0",
        )}
      />
    </button>
  );
}
