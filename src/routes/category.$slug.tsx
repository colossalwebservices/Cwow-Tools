import { createFileRoute, useParams } from "@tanstack/react-router";
import { categories, categoryMap, toolsByCategory, type CategoryId } from "../lib/registry";
import { ToolCard } from "../components/tool-card";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/category/$slug")({
  head: ({ params }) => {
    const cat = categories.find((c) => c.slug === params.slug);
    return {
      meta: [
        { title: cat ? `${cat.name} Tools — C Wow` : "Category — C Wow" },
        {
          name: "description",
          content: cat
            ? `${cat.description} ${toolsByCategory(cat.id).length} tools available.`
            : "Browse tools by category.",
        },
        { property: "og:title", content: cat ? `${cat.name} Tools — C Wow` : "Category — C Wow" },
        {
          property: "og:description",
          content: cat ? cat.description : "Browse tools by category.",
        },
      ],
      links: [{ rel: "canonical", href: `https://cwow.app/category/${params.slug}` }],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = useParams({ from: "/category/$slug" });
  const cat = categories.find((c) => c.slug === slug);

  if (!cat) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">Category not found</h1>
        <Link to="/tools" className="mt-4 inline-block text-primary hover:underline">
          Browse all tools
        </Link>
      </div>
    );
  }

  const catId = cat.id as CategoryId;
  const tools = toolsByCategory(catId);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <Link to="/" className="hover:text-foreground">
          Home
        </Link>
        <span>/</span>
        <Link to="/tools" className="hover:text-foreground">
          Tools
        </Link>
        <span>/</span>
        <span className="text-foreground">{cat.name}</span>
      </nav>

      <div className="flex items-center gap-3">
        <span className={`size-3 rounded-full bg-${cat.accent}`} />
        <h1 className="text-3xl font-bold text-foreground">{cat.name}</h1>
      </div>
      <p className="mt-2 text-muted-foreground">
        {cat.description} {tools.length} tools available.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tools.map((t) => (
          <ToolCard key={t.id} tool={t} />
        ))}
      </div>

      <div className="mt-12">
        <p className="text-sm font-medium text-muted-foreground mb-3">Other categories</p>
        <div className="flex flex-wrap gap-2">
          {categories
            .filter((c) => c.id !== catId)
            .map((c) => (
              <Link
                key={c.id}
                to="/category/$slug"
                params={{ slug: c.slug }}
                className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              >
                <span className={`size-2 rounded-full bg-${c.accent}`} /> {c.name}
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
