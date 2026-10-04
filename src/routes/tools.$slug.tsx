import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { getTool, categoryMap } from "../lib/registry";
import { toolComponents } from "../components/tools";
import { ToolPageShell, ToolInfoSection } from "../components/tool-page-shell";

export const Route = createFileRoute("/tools/$slug")({
  head: ({ params }) => {
    const tool = getTool(params.slug);
    const cat = tool ? categoryMap[tool.category] : null;
    return {
      meta: [
        { title: tool ? `${tool.name} — C Wow` : "Tool — C Wow" },
        { name: "description", content: tool?.description ?? "C Wow tool." },
        { property: "og:title", content: tool ? `${tool.name} — C Wow` : "Tool — C Wow" },
        { property: "og:description", content: tool?.description ?? "C Wow tool." },
      ],
      links: [{ rel: "canonical", href: `https://cwow.app/tools/${params.slug}` }],
    };
  },
  component: ToolRoute,
});

function ToolRoute() {
  const { slug } = useParams({ from: "/tools/$slug" });
  const tool = getTool(slug);

  if (!tool) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">Tool not found</h1>
        <Link to="/tools" className="mt-4 inline-block text-primary hover:underline">
          Browse all tools
        </Link>
      </div>
    );
  }

  if (tool.availability !== "ready") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <Link to="/" className="hover:text-foreground">
            Home
          </Link>
          <span>/</span>
          <Link
            to="/category/$slug"
            params={{ slug: categoryMap[tool.category].slug }}
            className="hover:text-foreground"
          >
            {categoryMap[tool.category].name}
          </Link>
          <span>/</span>
          <span className="text-foreground">{tool.name}</span>
        </nav>
        <h1 className="text-2xl font-bold text-foreground">{tool.name}</h1>
        <p className="mt-2 text-muted-foreground">{tool.description}</p>
        <div className="mt-6 rounded-xl border border-border bg-card p-6">
          <p className="font-medium text-foreground">This tool requires a connected service.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {tool.unavailableReason ??
              `Requires: ${tool.integration ?? "an external integration"}.`}
            This capability is not yet active. It will appear in the catalog once its engine is
            configured.
          </p>
        </div>
      </div>
    );
  }

  const ToolComponent = toolComponents[tool.slug];

  return (
    <ToolPageShell
      tool={tool}
      workspace={
        ToolComponent ? (
          <ToolComponent />
        ) : (
          <div className="text-muted-foreground text-sm">Tool component not found.</div>
        )
      }
      below={<ToolInfoSection tool={tool} />}
    />
  );
}
