import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { workflowMap } from "../lib/workflows";
import { getTool } from "../lib/registry";
import { ChevronRight, ArrowRight, Layers } from "lucide-react";

export const Route = createFileRoute("/workflows/$slug")({
  head: ({ params }) => {
    const w = workflowMap[params.slug];
    return {
      meta: [
        { title: w ? `${w.name} Workflow — C Wow` : "Workflow — C Wow" },
        { name: "description", content: w?.description ?? "A connected C Wow workflow." },
        { property: "og:title", content: w ? `${w.name} Workflow — C Wow` : "Workflow — C Wow" },
        { property: "og:description", content: w?.description ?? "A connected C Wow workflow." },
      ],
    };
  },
  component: WorkflowDetailPage,
});

function WorkflowDetailPage() {
  const { slug } = useParams({ from: "/workflows/$slug" });
  const w = workflowMap[slug];

  if (!w) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">Workflow not found</h1>
        <Link to="/workflows" className="mt-4 inline-block text-primary hover:underline">
          All workflows
        </Link>
      </div>
    );
  }

  if (!w.available) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <Link to="/" className="hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="size-3.5" />
          <Link to="/workflows" className="hover:text-foreground">
            Workflows
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="text-foreground">{w.name}</span>
        </nav>
        <h1 className="text-2xl font-bold text-foreground">{w.name}</h1>
        <p className="mt-2 text-muted-foreground">{w.description}</p>
        <div className="mt-6 rounded-xl border border-border bg-card p-6">
          <p className="font-medium text-foreground">This workflow requires a connected service.</p>
          <p className="mt-1 text-sm text-muted-foreground">{w.unavailableReason}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <Link to="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="size-3.5" />
        <Link to="/workflows" className="hover:text-foreground">
          Workflows
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{w.name}</span>
      </nav>

      <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
        <Layers className="size-7 text-primary" /> {w.name}
      </h1>
      <p className="mt-2 text-muted-foreground">{w.description}</p>
      <p className="mt-2 text-sm text-primary">Result: {w.resultDescription}</p>

      <h2 className="mt-8 font-semibold text-foreground">Steps</h2>
      <div className="mt-4 space-y-3">
        {w.steps.map((step, i) => {
          const tool = getTool(step.toolSlug);
          return (
            <div key={i} className="flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {i + 1}
              </span>
              <div className="flex-1 rounded-xl border border-border bg-card p-4">
                <p className="font-medium text-foreground">{step.label}</p>
                {tool && <p className="text-sm text-muted-foreground">{tool.description}</p>}
              </div>
              {tool && (
                <Link
                  to="/tools/$slug"
                  params={{ slug: tool.slug }}
                  className="text-sm text-primary hover:underline whitespace-nowrap"
                >
                  Open tool
                </Link>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-xl border border-border bg-surface p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">How to run this workflow</p>
        <p className="mt-1">
          Open each step's tool in order. Use "Send to workspace" after each step, then load the
          result into the next tool. The workspace keeps your outputs in this session so you don't
          reupload.
        </p>
      </div>

      <Link
        to="/workspace"
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors focus-ring"
      >
        Go to workspace <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
