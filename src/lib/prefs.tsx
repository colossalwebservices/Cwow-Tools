// Theme + favorites/recent persistence. Favorites/recent store tool IDs only.
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

type Theme = "dark" | "light";

interface PrefsContextValue {
  theme: Theme;
  toggleTheme: () => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  recent: string[];
  addRecent: (id: string) => void;
}

const PrefsContext = createContext<PrefsContextValue | null>(null);

const THEME_KEY = "cwow-theme";
const FAV_KEY = "cwow-favorites";
const RECENT_KEY = "cwow-recent";

function safeGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key: string, val: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, val);
  } catch {
    /* ignore */
  }
}

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = safeGet(THEME_KEY) as Theme | null;
    if (stored) setTheme(stored);
    const fav = safeGet(FAV_KEY);
    if (fav) setFavorites(JSON.parse(fav));
    const rec = safeGet(RECENT_KEY);
    if (rec) setRecent(JSON.parse(rec));
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    safeSet(THEME_KEY, theme);
  }, [theme, mounted]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      safeSet(FAV_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const addRecent = useCallback((id: string) => {
    setRecent((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, 8);
      safeSet(RECENT_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <PrefsContext.Provider
      value={{ theme, toggleTheme, favorites, toggleFavorite, recent, addRecent }}
    >
      {children}
    </PrefsContext.Provider>
  );
}

export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs must be used within PrefsProvider");
  return ctx;
}
