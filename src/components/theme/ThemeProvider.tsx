import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeMode = "light" | "dark" | "device";

type ThemeContextValue = {
  mode: ThemeMode;
  resolved: "light" | "dark";
  setMode: (m: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "qrforge.theme";

function applyClass(resolved: "light" | "dark") {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "device";
    return (localStorage.getItem(STORAGE_KEY) as ThemeMode) || "device";
  });
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const compute = (): "light" | "dark" =>
      mode === "device" ? (mql.matches ? "dark" : "light") : mode;

    const update = () => {
      const next = compute();
      setResolved(next);
      applyClass(next);
    };

    update();
    if (mode === "device") {
      mql.addEventListener("change", update);
      return () => mql.removeEventListener("change", update);
    }
  }, [mode]);

  const setMode = (m: ThemeMode) => {
    localStorage.setItem(STORAGE_KEY, m);
    setModeState(m);
  };

  return (
    <ThemeContext.Provider value={{ mode, resolved, setMode }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
