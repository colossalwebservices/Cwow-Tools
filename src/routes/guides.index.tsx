import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { guides } from "../lib/guides";

export const Route = createFileRoute("/guides/")({
  component: GuidesPage,
});

function GuidesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-foreground">Guides</h1>
      <p className="mt-2 text-muted-foreground">
        Step-by-step guides for common tasks, each linking to the tools you need.
      </p>
      <div className="mt-8 space-y-4">
        {guides.map((g) => (
          <Link
            key={g.slug}
            to="/guides/$slug"
            params={{ slug: g.slug }}
            className="group block rounded-xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-lg transition-all focus-ring"
          >
            <h2 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {g.title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{g.description}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs text-primary">
              Read guide <ArrowRight className="size-3" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
