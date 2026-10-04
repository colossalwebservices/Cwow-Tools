import { createFileRoute } from "@tanstack/react-router";
import { Layers, ArrowRight, X } from "lucide-react";
import { workflows } from "../lib/workflows";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/workflows/")({
  component: WorkflowsPage,
});

function WorkflowsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
        <Layers className="size-7 text-primary" /> Connected Workflows
      </h1>
      <p className="mt-2 text-muted-foreground max-w-2xl">
        Chain compatible tools together to finish a multi-step task in one run. Each step uses the
        previous step's output — no reuploading between tools.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {workflows.map((w) => (
          <div
            key={w.slug}
            className={`rounded-xl border p-5 ${w.available ? "border-border bg-card hover:border-primary/40 hover:shadow-lg transition-all" : "border-border bg-surface opacity-60"}`}
          >
            <Layers className="size-6 text-primary" />
            <h2 className="mt-3 font-semibold text-foreground">{w.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{w.description}</p>
            <div className="mt-3 flex flex-wrap items-center gap-1">
              {w.steps.map((step, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                    {step.label}
                  </span>
                  {i < w.steps.length - 1 && (
                    <ArrowRight className="size-3 text-muted-foreground" />
                  )}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-primary">Result: {w.resultDescription}</p>
            {w.available ? (
              <Link
                to="/workflows/$slug"
                params={{ slug: w.slug }}
                className="mt-4 inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors focus-ring"
              >
                Open workflow <ArrowRight className="size-4" />
              </Link>
            ) : (
              <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                <X className="size-3.5" /> {w.unavailableReason}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
