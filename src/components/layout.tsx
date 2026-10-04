import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search, Moon, Sun, Menu, X, Layers, Sparkles } from "lucide-react";
import { usePrefs } from "../lib/prefs";
import { useWorkspace } from "../lib/workspace";
import { readyTools, categories } from "../lib/registry";

interface HeaderProps {
  onOpenPalette: () => void;
}

export function Header({ onOpenPalette }: HeaderProps) {
  const { theme, toggleTheme } = usePrefs();
  const { count } = useWorkspace();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const doSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/tools", search: { q: search } });
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-2 focus-ring rounded-lg"
          aria-label="C Wow home"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-lg shadow-primary/30">
            C
          </span>
          <span className="hidden sm:block">
            <span className="block font-bold text-lg leading-none text-foreground">C Wow</span>
            <span className="block text-[10px] text-muted-foreground leading-none mt-0.5">
              by Colossal Web Services
            </span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 ml-2">
          <Link
            to="/tools"
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-ring"
            activeProps={{ className: "text-foreground bg-accent" }}
          >
            All Tools
          </Link>
          <div className="relative group">
            <button className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-ring flex items-center gap-1">
              Categories
            </button>
            <div className="invisible absolute left-0 top-full pt-1 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
              <div className="grid w-[480px] grid-cols-2 gap-1 rounded-xl border border-border bg-popover p-2 shadow-xl">
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    to="/category/$slug"
                    params={{ slug: c.slug }}
                    className="rounded-lg p-2 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`size-2 rounded-full bg-${c.accent}`} />
                      <span className="text-sm font-medium text-foreground">{c.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <Link
            to="/workflows"
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-ring"
            activeProps={{ className: "text-foreground bg-accent" }}
          >
            Workflows
          </Link>
        </nav>

        <button
          onClick={onOpenPalette}
          className="hidden sm:flex flex-1 max-w-md items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted-foreground hover:border-primary/50 transition-colors focus-ring ml-auto"
        >
          <Search className="size-4" />
          <span className="flex-1 text-left">Search tools…</span>
          <kbd className="hidden lg:inline-flex items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            ⌘K
          </kbd>
        </button>

        <div className="flex items-center gap-1 ml-auto sm:ml-0">
          <Link
            to="/workspace"
            className="relative rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-ring"
            aria-label={`Workspace (${count} items)`}
          >
            <Layers className="size-5" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-ring"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </button>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-ring"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-3">
          <form
            onSubmit={doSearch}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2"
          >
            <Search className="size-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tools…"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </form>
          <Link
            to="/tools"
            onClick={() => setMobileOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            All Tools
          </Link>
          <Link
            to="/workflows"
            onClick={() => setMobileOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            Workflows
          </Link>
          <div className="pt-2 border-t border-border">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Categories
            </p>
            {categories.map((c) => (
              <Link
                key={c.id}
                to="/category/$slug"
                params={{ slug: c.slug }}
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm text-foreground hover:bg-accent"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-background mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                C
              </span>
              <div>
                <p className="font-bold text-foreground">C Wow</p>
                <p className="text-xs text-muted-foreground">by Colossal Web Services</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Everyday tasks. Colossal possibilities.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Tools</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/tools" className="hover:text-foreground">
                  All Tools
                </Link>
              </li>
              <li>
                <Link to="/workflows" className="hover:text-foreground">
                  Workflows
                </Link>
              </li>
              <li>
                <Link to="/workspace" className="hover:text-foreground">
                  Workspace
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Company</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/about" className="hover:text-foreground">
                  About
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-foreground">
                  Privacy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-foreground">
                  Terms
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-foreground">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Need more?</p>
            <p className="text-sm text-muted-foreground">
              Need a website, app, or automation? Meet Colossal Web Services.
            </p>
            <Link
              to="/contact"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors focus-ring"
            >
              <Sparkles className="size-4" /> Get in touch
            </Link>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row justify-between gap-2 text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} C Wow by Colossal Web Services. {readyTools.length} ready
            tools.
          </p>
          <p>Built for everyday productivity.</p>
        </div>
      </div>
    </footer>
  );
}
