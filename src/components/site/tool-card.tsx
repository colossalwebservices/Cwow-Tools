import { Link } from "@tanstack/react-router";
import { Star, ArrowRight } from "lucide-react";
import type { ToolDefinition } from "../../lib/tools";
import { CATEGORY_MAP, categoryBgClass, categoryAccentClass } from "../../lib/categories";

export function ToolCard({
  tool,
  favorited,
  onToggleFavorite,
}: {
  tool: ToolDefinition;
  favorited?: boolean;
  onToggleFavorite?: (id: string) => void;
}) {
  const cat = CATEGORY_MAP[tool.category];
  const Icon = cat.icon;
  return (
    <div className="group relative flex flex-col rounded-xl border border-border bg-panel p-4 transition-all hover:border-primary/40 hover:shadow-md">
      {onToggleFavorite && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleFavorite(tool.id);
          }}
          className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground opacity-0 transition-all hover:bg-accent hover:text-foreground group-hover:opacity-100"
          aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
        >
          <Star className={`h-4 w-4 ${favorited ? "fill-primary text-primary" : ""}`} />
        </button>
      )}
      <Link to="/tools/$slug" params={{ slug: tool.slug }} className="flex flex-1 flex-col">
        <div
          className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${categoryBgClass(
            tool.category,
          )}`}
        >
          <Icon className={`h-4.5 w-4.5 ${categoryAccentClass(tool.category)}`} />
        </div>
        <h3 className="text-sm font-semibold text-foreground">{tool.name}</h3>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{tool.description}</p>
        <div className="mt-3 flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-medium ${categoryAccentClass(
              tool.category,
            )}`}
          >
            {cat.name}
          </span>
          {tool.mode === "local" && (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
              On device
            </span>
          )}
        </div>
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
          Open tool <ArrowRight className="h-3 w-3" />
        </span>
      </Link>
    </div>
  );
}
