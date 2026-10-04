import { useEffect, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Shield, Cloud, Heart } from "lucide-react";
import { type ToolDef, categoryMap, toolMap } from "../lib/registry";
import { usePrefs } from "../lib/prefs";

interface ToolPageShellProps {
  tool: ToolDef;
  workspace: ReactNode; // input + options + action
  result?: ReactNode; // result panel
  below?: ReactNode; // instructions, faqs, related
}

export function ToolPageShell({ tool, workspace, result, below }: ToolPageShellProps) {
  const { favorites, toggleFavorite, addRecent } = usePrefs();
  const cat = categoryMap[tool.category];
  const isFav = favorites.includes(tool.id);

  useEffect(() => {
    addRecent(tool.id);
  }, [tool.id, addRecent]);

  const privacyLabel =
    tool.mode === "local"
      ? { icon: Shield, text: "Stays on your device", color: "text-cat-business" }
      : { icon: Cloud, text: "Processed online", color: "text-cat-video" };

  const PrivacyIcon = privacyLabel.icon;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 text-sm text-muted-foreground mb-4"
      >
        <Link to="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="size-3.5" />
        <Link to="/category/$slug" params={{ slug: cat.slug }} className="hover:text-foreground">
          {cat.name}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{tool.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{tool.name}</h1>
          <p className="mt-1 text-muted-foreground max-w-2xl">{tool.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
            <span className={`flex items-center gap-1.5 font-medium ${privacyLabel.color}`}>
              <PrivacyIcon className="size-3.5" /> {privacyLabel.text}
            </span>
            {tool.limits && <span className="text-muted-foreground">· {tool.limits}</span>}
            {tool.batch && (
              <span className="rounded-full bg-accent px-2 py-0.5 text-accent-foreground">
                Batch supported
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => toggleFavorite(tool.id)}
          className="shrink-0 flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors focus-ring"
        >
          <Heart className={`size-4 ${isFav ? "fill-primary text-primary" : ""}`} />
          {isFav ? "Saved" : "Save"}
        </button>
      </div>

      {/* Workspace split */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="raised-surface p-5">{workspace}</div>
        {result ? <div className="raised-surface p-5">{result}</div> : null}
      </div>

      {/* Below */}
      {below && <div className="mt-10">{below}</div>}
    </div>
  );
}

export function ToolInfoSection({ tool }: { tool: ToolDef }) {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div>
        <h2 className="font-semibold text-foreground mb-3">How to use</h2>
        <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
          {(
            tool.instructions ?? [
              "Upload your input.",
              "Adjust options if needed.",
              "Run the tool and download the result.",
            ]
          ).map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
        {tool.faqs && tool.faqs.length > 0 && (
          <>
            <h2 className="font-semibold text-foreground mt-6 mb-3">FAQs</h2>
            <div className="space-y-3">
              {tool.faqs.map((f, i) => (
                <div key={i}>
                  <p className="text-sm font-medium text-foreground">{f.q}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{f.a}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <div>
        <h2 className="font-semibold text-foreground mb-3">Supported formats</h2>
        <div className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Input:</span>{" "}
            {tool.inputKinds.join(", ") || "—"}
          </p>
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Output:</span>{" "}
            {tool.outputKinds.join(", ")}
          </p>
        </div>
        {tool.related && tool.related.length > 0 && (
          <>
            <h2 className="font-semibold text-foreground mt-6 mb-3">Related tools</h2>
            <div className="flex flex-wrap gap-2">
              {tool.related.map((id) => {
                const t = toolMap[id];
                if (!t) return null;
                return (
                  <Link
                    key={id}
                    to="/tools/$slug"
                    params={{ slug: t.slug }}
                    className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground hover:border-primary/40 transition-colors"
                  >
                    {t.name}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
