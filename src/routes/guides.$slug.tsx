import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { ChevronRight, ArrowRight } from "lucide-react";
import { guideMap } from "../lib/guides";
import { getTool, categoryMap } from "../lib/registry";

export const Route = createFileRoute("/guides/$slug")({
  head: ({ params }) => {
    const g = guideMap[params.slug];
    return {
      meta: [
        { title: g ? `${g.title} — C Wow Guides` : "Guide — C Wow" },
        { name: "description", content: g?.description ?? "A C Wow guide." },
        { property: "og:title", content: g ? `${g.title} — C Wow Guides` : "Guide — C Wow" },
        { property: "og:description", content: g?.description ?? "A C Wow guide." },
      ],
    };
  },
  component: GuidePage,
});

function GuidePage() {
  const { slug } = useParams({ from: "/guides/$slug" });
  const g = guideMap[slug];

  if (!g) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">Guide not found</h1>
        <Link to="/guides" className="mt-4 inline-block text-primary hover:underline">
          All guides
        </Link>
      </div>
    );
  }

  const cat = categoryMap[g.category];

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <Link to="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="size-3.5" />
        <Link to="/guides" className="hover:text-foreground">
          Guides
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{g.title}</span>
      </nav>

      <h1 className="text-3xl font-bold text-foreground">{g.title}</h1>
      <p className="mt-2 text-muted-foreground">{g.description}</p>

      <div className="mt-8 space-y-8">
        {g.sections.map((s, i) => (
          <section key={i}>
            <h2 className="text-xl font-semibold text-foreground">{s.heading}</h2>
            <p className="mt-2 text-foreground leading-relaxed">{s.body}</p>
            {s.toolSlugs && s.toolSlugs.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {s.toolSlugs.map((ts) => {
                  const tool = getTool(ts);
                  if (!tool) return null;
                  return (
                    <Link
                      key={ts}
                      to="/tools/$slug"
                      params={{ slug: tool.slug }}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground hover:border-primary/40 transition-colors focus-ring"
                    >
                      {tool.name} <ArrowRight className="size-3 text-muted-foreground" />
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-border bg-surface p-4">
        <p className="text-sm text-muted-foreground">
          Browse more tools in{" "}
          <Link
            to="/category/$slug"
            params={{ slug: cat.slug }}
            className="text-primary hover:underline"
          >
            {cat.name}
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
