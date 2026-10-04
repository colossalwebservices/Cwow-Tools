import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, CornerDownLeft } from "lucide-react";
import { READY_TOOLS, searchTools } from "../../lib/tools";
import { CATEGORIES } from "../../lib/categories";
import { categoryAccentClass } from "../../lib/categories";

interface CommandItem {
  type: "tool" | "category" | "page";
  label: string;
  hint: string;
  to: string;
  params?: Record<string, string>;
}

const PAGES: CommandItem[] = [
  { type: "page", label: "All Tools", hint: "Directory", to: "/tools" },
  { type: "page", label: "Workflows", hint: "Connected presets", to: "/workflows" },
  { type: "page", label: "Guides", hint: "How-to articles", to: "/guides" },
  { type: "page", label: "Workspace", hint: "Session items", to: "/workspace" },
  { type: "page", label: "About", hint: "Page", to: "/about" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isModK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      const typing =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA";
      if (isModK) {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      } else if (e.key.toLowerCase() === "k" && !typing && !open) {
        // only cmd/ctrl+k
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  const items = buildItems(query);

  function go(item: CommandItem) {
    setOpen(false);
    navigate({ to: item.to, params: item.params });
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = items[activeIndex];
      if (item) go(item);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 pt-[15vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search tools, categories, or pages…"
            className="h-14 w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            aria-label="Command palette search"
          />
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {items.length === 0 && (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              No results. Try a different term or browse{" "}
              <button onClick={() => go(PAGES[0])} className="font-medium text-primary underline">
                all tools
              </button>
              .
            </div>
          )}
          {items.map((item, i) => (
            <button
              key={`${item.type}-${item.label}`}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => go(item)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                i === activeIndex ? "bg-accent text-foreground" : "text-foreground"
              }`}
            >
              <span className="flex-1">
                <span className="font-medium">{item.label}</span>
                <span className="ml-2 text-xs text-muted-foreground">{item.hint}</span>
              </span>
              {i === activeIndex && (
                <CornerDownEnter className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function buildItems(query: string): CommandItem[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    const cats: CommandItem[] = CATEGORIES.map((c) => ({
      type: "category",
      label: c.name,
      hint: "Category",
      to: "/category/$slug",
      params: { slug: c.slug },
    }));
    return [...PAGES, ...cats].slice(0, 10);
  }
  const tools = searchTools(q, 8).map<CommandItem>((t) => ({
    type: "tool",
    label: t.name,
    hint: categoryAccentClass(t.category).replace("text-", ""),
    to: "/tools/$slug",
    params: { slug: t.slug },
  }));
  const cats = CATEGORIES.filter((c) => c.name.toLowerCase().includes(q)).map<CommandItem>((c) => ({
    type: "category",
    label: c.name,
    hint: "Category",
    to: "/category/$slug",
    params: { slug: c.slug },
  }));
  const pages = PAGES.filter((p) => p.label.toLowerCase().includes(q));
  return [...tools, ...cats, ...pages].slice(0, 12);
}

// Re-export for count display elsewhere
export function readyToolCount() {
  return READY_TOOLS.length;
}
