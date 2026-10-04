import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useCallback, useRef } from "react";
import {
  Search,
  Upload,
  Sparkles,
  ArrowRight,
  Shield,
  Cloud,
  Zap,
  Layers,
  FileText,
  Image as ImageIcon,
  Database,
  Type,
  Palette,
  Briefcase,
} from "lucide-react";
import {
  readyTools,
  categories,
  categoryMap,
  searchTools,
  categoryCount,
  type CategoryId,
} from "../lib/registry";
import { availableWorkflows } from "../lib/workflows";
import { ToolCard } from "../components/tool-card";
import { usePrefs } from "../lib/prefs";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "C Wow — Everyday Tools, Colossal Possibilities" },
      {
        name: "description",
        content:
          "C Wow by Colossal Web Services: a free multitool workspace to convert files, create content, clean images, and get more done. No account required.",
      },
      { property: "og:title", content: "C Wow — Everyday Tools, Colossal Possibilities" },
      {
        property: "og:description",
        content:
          "Convert files, create content, clean up images, and get more done in one connected workspace.",
      },
    ],
    links: [{ rel: "canonical", href: "https://cwow.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "C Wow",
          description:
            "A free multitool workspace to convert files, create content, clean images, and get more done.",
          applicationCategory: "UtilitiesApplication",
          operatingSystem: "Web",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          publisher: { "@type": "Organization", name: "Colossal Web Services" },
        }),
      },
    ],
  }),
  component: Index,
});

const exampleTasks = [
  "Compress a PDF",
  "Resize product photos",
  "Convert CSV to Excel",
  "Rewrite an email",
  "Make this picture smaller",
  "Combine PDF files",
];

const catIcons: Record<CategoryId, typeof FileText> = {
  pdf: FileText,
  image: ImageIcon,
  video: ImageIcon,
  audio: ImageIcon,
  "ai-write": Sparkles,
  "ai-image": Sparkles,
  "file-data": Database,
  "developer-text": Type,
  "color-design": Palette,
  business: Briefcase,
};

function Index() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [fileHint, setFileHint] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { favorites, recent } = usePrefs();

  const featured = readyTools.filter((t) => t.featured).slice(0, 8);
  const startHere = readyTools.filter((t) => t.startHere);

  const liveResults = query.trim() ? searchTools(query).slice(0, 6) : [];

  const submitSearch = (q?: string) => {
    const term = q ?? query;
    navigate({ to: "/tools", search: { q: term } });
  };

  const onFileDrop = useCallback(
    (file: File) => {
      setFileHint(`"${file.name}" — finding compatible tools…`);
      setTimeout(
        () =>
          navigate({ to: "/tools", search: { q: file.type || file.name.split(".").pop() || "" } }),
        400,
      );
    },
    [navigate],
  );

  const favTools = favorites
    .map((id) => readyTools.find((t) => t.id === id))
    .filter(Boolean)
    .slice(0, 4);
  const recentTools = recent
    .map((id) => readyTools.find((t) => t.id === id))
    .filter(Boolean)
    .slice(0, 4);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent"
          aria-hidden
        />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 pt-16 pb-12 text-center">
          <p className="text-sm font-medium text-primary">Your everyday productivity toolbox</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Small tasks. <span className="text-primary">Colossal possibilities.</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Convert files, create content, clean up images, and get more done in one connected
            workspace.
          </p>

          {/* Search */}
          <div className="mt-8 mx-auto max-w-2xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitSearch();
              }}
              className="flex items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-xl shadow-primary/5 focus-within:border-primary/50 transition-colors"
            >
              <Search className="size-5 text-muted-foreground ml-2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What do you need to do?"
                className="flex-1 bg-transparent px-1 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none"
                aria-label="Search tools"
              />
              <button
                type="submit"
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors focus-ring"
              >
                Search
              </button>
            </form>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {exampleTasks.map((ex) => (
                <button
                  key={ex}
                  onClick={() => {
                    setQuery(ex);
                    submitSearch(ex);
                  }}
                  className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors focus-ring"
                >
                  {ex}
                </button>
              ))}
            </div>
            {liveResults.length > 0 && (
              <div className="mt-3 rounded-xl border border-border bg-popover p-2 text-left shadow-lg">
                {liveResults.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => navigate({ to: "/tools/$slug", params: { slug: t.slug } })}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 hover:bg-accent transition-colors focus-ring text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.description}</p>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* File drop entry point */}
          <div className="mt-6">
            <input
              ref={fileInputRef}
              type="file"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFileDrop(f);
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl border border-dashed border-border bg-card/50 px-4 py-3 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors focus-ring"
            >
              <Upload className="size-4" /> Drop a file to find the right tools
            </button>
            {fileHint && <p className="mt-2 text-xs text-primary">{fileHint}</p>}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 space-y-16">
        {/* Categories */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">Browse by category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {categories.map((c) => {
              const Icon = catIcons[c.id];
              return (
                <a
                  key={c.id}
                  href={`/category/${c.slug}`}
                  className="group flex flex-col rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-lg transition-all focus-ring"
                >
                  <span
                    className={`flex size-10 items-center justify-center rounded-lg bg-${c.accent}/15 text-${c.accent}`}
                  >
                    <Icon className="size-5" />
                  </span>
                  <p className="mt-3 font-semibold text-sm text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {categoryCount(c.id)} tools
                  </p>
                </a>
              );
            })}
          </div>
        </section>

        {/* Favorites / Recent */}
        {(favTools.length > 0 || recentTools.length > 0) && (
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">Your tools</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {favTools.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-3">Favorites</p>
                  <ToolCardGridSmall tools={favTools as any} />
                </div>
              )}
              {recentTools.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-3">Recently used</p>
                  <ToolCardGridSmall tools={recentTools as any} />
                </div>
              )}
            </div>
          </section>
        )}

        {/* Featured */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Featured tools</h2>
            <a href="/tools" className="text-sm text-primary hover:underline">
              View all
            </a>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((t) => (
              <ToolCard key={t.id} tool={t} />
            ))}
          </div>
        </section>

        {/* Start here */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">Start here</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {startHere.map((t) => (
              <ToolCard key={t.id} tool={t} />
            ))}
          </div>
        </section>

        {/* Workflows */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Connected workflows</h2>
            <a href="/workflows" className="text-sm text-primary hover:underline">
              All workflows
            </a>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {availableWorkflows.map((w) => (
              <a
                key={w.slug}
                href={`/workflows/${w.slug}`}
                className="group rounded-xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-lg transition-all focus-ring"
              >
                <Layers className="size-6 text-primary" />
                <h3 className="mt-3 font-semibold text-foreground">{w.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{w.description}</p>
                <p className="mt-3 text-xs text-primary flex items-center gap-1">
                  {w.steps.length} steps{" "}
                  <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
                </p>
              </a>
            ))}
          </div>
        </section>

        {/* Privacy explainer */}
        <section className="rounded-2xl border border-border bg-card p-8">
          <h2 className="text-xl font-bold text-foreground mb-4">Local vs. online processing</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex gap-3">
              <Shield className="size-6 shrink-0 text-cat-business" />
              <div>
                <p className="font-semibold text-foreground">Stays on your device</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Most tools process files entirely in your browser. Your files never leave your
                  device — nothing is uploaded.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Cloud className="size-6 shrink-0 text-cat-video" />
              <div>
                <p className="font-semibold text-foreground">Processed online</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Some advanced tools (AI, media) need a server. These are clearly labeled and only
                  enabled when their service is connected.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl">
          <h2 className="text-xl font-bold text-foreground mb-4">Frequently asked questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "Do I need to create an account?",
                a: "No. Every ready tool works without registration. Pick a tool, add your file, and get your result.",
              },
              {
                q: "Are my files uploaded to a server?",
                a: 'Only tools labeled "Processed online" send data to a server. Tools labeled "Stays on your device" run entirely in your browser.',
              },
              {
                q: "Is C Wow free?",
                a: "Yes. The local tool catalog is free to use. Advanced online tools respect the limits of their connected services.",
              },
              {
                q: "Can I run multiple tools in sequence?",
                a: "Yes. Use connected workflows, or send any result to your workspace and continue with a compatible next tool.",
              },
            ].map((f, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4">
                <p className="font-medium text-foreground">{f.q}</p>
                <p className="text-sm text-muted-foreground mt-1">{f.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function ToolCardGridSmall({ tools }: { tools: any[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {tools.map((t) => (
        <ToolCard key={t.id} tool={t} />
      ))}
    </div>
  );
}
