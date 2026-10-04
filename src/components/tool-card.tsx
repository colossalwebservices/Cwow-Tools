import { Link } from "@tanstack/react-router";
import { Heart, ArrowRight } from "lucide-react";
import { type ToolDef, categoryMap } from "../lib/registry";
import { usePrefs } from "../lib/prefs";

export function ToolCard({ tool }: { tool: ToolDef }) {
  const { favorites, toggleFavorite } = usePrefs();
  const cat = categoryMap[tool.category];
  const isFav = favorites.includes(tool.id);

  return (
    <Link
      to="/tools/$slug"
      params={{ slug: tool.slug }}
      className="group relative flex flex-col rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all focus-ring"
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`flex size-9 items-center justify-center rounded-lg bg-${cat.accent}/15 text-${cat.accent}`}
        >
          <span className={`size-2.5 rounded-full bg-${cat.accent}`} />
        </span>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(tool.id);
          }}
          className="rounded-md p-1 text-muted-foreground hover:text-primary transition-colors focus-ring"
          aria-label={isFav ? "Remove favorite" : "Add favorite"}
        >
          <Heart className={`size-4 ${isFav ? "fill-primary text-primary" : ""}`} />
        </button>
      </div>
      <h3 className="mt-3 font-semibold text-foreground group-hover:text-primary transition-colors">
        {tool.name}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{tool.description}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{cat.name}</span>
        <span className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          Open <ArrowRight className="size-3" />
        </span>
      </div>
    </Link>
  );
}

export function ToolCardGrid({ tools, columns }: { tools: ToolDef[]; columns?: number }) {
  const cols = columns ?? 4;
  const colClass =
    cols === 2
      ? "sm:grid-cols-2"
      : cols === 3
        ? "sm:grid-cols-2 lg:grid-cols-3"
        : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
  return (
    <div className={`grid gap-4 ${colClass}`}>
      {tools.map((t) => (
        <ToolCard key={t.id} tool={t} />
      ))}
    </div>
  );
}
