import { Link } from "@tanstack/react-router";
import { ChevronRight, Shield, Cpu, Cloud } from "lucide-react";
import type { ToolDefinition } from "../../lib/tools";
import { CATEGORY_MAP, categoryAccentClass } from "../../lib/categories";
import { relatedTools } from "../../lib/tools";
import { useFavorites } from "../site/use-local-storage";
import { Star } from "lucide-react";

export function ToolShell({ tool, children }: { tool: ToolDefinition; children: React.ReactNode }) {
  const cat = CATEGORY_MAP[tool.category];
  const { isFavorite, toggleFavorite, mounted } = useFavorites();
  const related = relatedTools(tool);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <nav
        className="flex items-center gap-1.5 text-xs text-muted-foreground"
        aria-label="Breadcrumb"
      >
        <Link to="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/tools" className="hover:text-foreground">
          Tools
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/category/$slug" params={{ slug: cat.slug }} className="hover:text-foreground">
          {cat.name}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{tool.name}</span>
      </nav>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {tool.name}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{tool.description}</p>
        </div>
        {mounted && (
          <button
            onClick={() => toggleFavorite(tool.id)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
            aria-label={isFavorite(tool.id) ? "Remove favorite" : "Add favorite"}
          >
            <Star
              className={`h-3.5 w-3.5 ${isFavorite(tool.id) ? "fill-primary text-primary" : ""}`}
            />
            {isFavorite(tool.id) ? "Saved" : "Save"}
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <PrivacyBadge mode={tool.mode} />
        {tool.limits && (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
            {tool.limits}
          </span>
        )}
      </div>

      <div className="mt-6">{children}</div>

      {tool.faqs && tool.faqs.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">FAQs</h2>
          <div className="mt-3 space-y-2">
            {tool.faqs.map((f) => (
              <details key={f.q} className="group rounded-lg border border-border bg-panel p-4">
                <summary className="cursor-pointer text-sm font-medium text-foreground list-none">
                  {f.q}
                </summary>
                <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">Related tools</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((r) => (
              <Link
                key={r.id}
                to="/tools/$slug"
                params={{ slug: r.slug }}
                className="rounded-lg border border-border bg-panel p-3 transition-colors hover:border-primary/40 hover:bg-accent"
              >
                <p className={`text-[11px] font-medium ${categoryAccentClass(r.category)}`}>
                  {CATEGORY_MAP[r.category].name}
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">{r.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function PrivacyBadge({ mode }: { mode: ToolDefinition["mode"] }) {
  if (mode === "local") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
        <Shield className="h-3 w-3" /> Stays on your device
      </span>
    );
  }
  if (mode === "online") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
        <Cloud className="h-3 w-3" /> Processed online
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-[11px] font-medium text-blue-600 dark:text-blue-400">
      <Cpu className="h-3 w-3" /> Hybrid
    </span>
  );
}
