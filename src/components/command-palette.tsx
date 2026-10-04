import { useEffect, useState, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, X, ArrowRight } from "lucide-react";
import { searchTools, categories, categoryMap, readyTools, type ToolDef } from "../lib/registry";
import { workflows } from "../lib/workflows";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const previousFocus = useRef<HTMLElement | null>(null);

  type Item =
    | { type: "tool"; tool: ToolDef }
    | { type: "category"; slug: string; name: string }
    | { type: "workflow"; slug: string; name: string; description: string };

  const items: Item[] = [];
  if (query.trim()) {
    for (const t of searchTools(query).slice(0, 12)) items.push({ type: "tool", tool: t });
  } else {
    for (const t of readyTools.slice(0, 8)) items.push({ type: "tool", tool: t });
  }
  for (const c of categories) items.push({ type: "category", slug: c.slug, name: c.name });
  for (const w of workflows)
    items.push({ type: "workflow", slug: w.slug, name: w.name, description: w.description });

  useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement as HTMLElement;
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      previousFocus.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, items.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = items[activeIndex];
        if (!item) return;
        if (item.type === "tool")
          navigate({ to: "/tools/$slug", params: { slug: item.tool.slug } });
        else if (item.type === "category")
          navigate({ to: "/category/$slug", params: { slug: item.slug } });
        else navigate({ to: "/workflows/$slug", params: { slug: item.slug } });
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, items, activeIndex, navigate, onOpenChange]);

  if (!open) return null;

  const go = (item: Item) => {
    if (item.type === "tool") navigate({ to: "/tools/$slug", params: { slug: item.tool.slug } });
    else if (item.type === "category")
      navigate({ to: "/category/$slug", params: { slug: item.slug } });
    else navigate({ to: "/workflows/$slug", params: { slug: item.slug } });
    onOpenChange(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[15vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="size-5 text-muted-foreground" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder="Search tools, categories, workflows…"
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
            aria-label="Search"
          />
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground focus-ring"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {items.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No tools found. Try "compress", "pdf", or "csv".
            </div>
          )}
          {items.map((item, i) => {
            const active = i === activeIndex;
            const cat = item.type === "tool" ? categoryMap[item.tool.category] : null;
            return (
              <button
                key={i}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => go(item)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left focus-ring ${active ? "bg-accent text-accent-foreground" : "text-foreground"}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium text-sm">
                      {item.type === "tool"
                        ? item.tool.name
                        : item.type === "category"
                          ? item.name
                          : item.name}
                    </span>
                    {cat && <span className="text-xs text-muted-foreground">· {cat.name}</span>}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.type === "tool"
                      ? item.tool.description
                      : item.type === "category"
                        ? "Browse category"
                        : item.description}
                  </p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </button>
            );
          })}
        </div>
        <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground flex justify-between">
          <span>↑↓ navigate · Enter select · Esc close</span>
          <span>{readyTools.length} tools</span>
        </div>
      </div>
    </div>
  );
}
