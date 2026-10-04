import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { readyTools, categories, searchTools, type CategoryId } from "../lib/registry";
import { ToolCard } from "../components/tool-card";

export const Route = createFileRoute("/tools/")({
  component: ToolsDirectory,
});

function ToolsDirectory() {
  const search = useSearch({ strict: false }) as { q?: string };
  const [query, setQuery] = useState(search.q ?? "");
  const [activeCat, setActiveCat] = useState<CategoryId | "all">("all");

  const results = useMemo(() => {
    let list = query.trim() ? searchTools(query) : readyTools;
    if (activeCat !== "all") list = list.filter((t) => t.category === activeCat);
    return list;
  }, [query, activeCat]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold text-foreground">All Tools</h1>
      <p className="mt-1 text-muted-foreground">
        {readyTools.length} ready tools across {categories.length} categories.
      </p>

      <div className="mt-6 flex items-center gap-2 rounded-xl border border-border bg-card p-2">
        <Search className="size-5 text-muted-foreground ml-2" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, format, or task…"
          className="flex-1 bg-transparent px-1 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none"
          aria-label="Search tools"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCat("all")}
          className={`rounded-full px-3 py-1.5 text-sm transition-colors focus-ring ${activeCat === "all" ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground hover:text-foreground"}`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCat(c.id)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors focus-ring ${activeCat === c.id ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground hover:text-foreground"}`}
          >
            <span className={`size-2 rounded-full bg-${c.accent}`} /> {c.name}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {results.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-sm">No tools found. Try "compress", "pdf", "csv", or "image".</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((t) => (
              <ToolCard key={t.id} tool={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
