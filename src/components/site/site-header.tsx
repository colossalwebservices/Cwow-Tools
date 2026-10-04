import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, Moon, Search, Sun, Wrench, X } from "lucide-react";
import { Logo } from "./logo";
import { useTheme } from "./theme-provider";
import { useWorkspace } from "../workspace/workspace-provider";
import { CATEGORIES } from "../../lib/categories";
import { Button } from "../ui/button";

export function SiteHeader() {
  const { theme, toggleTheme } = useTheme();
  const { count } = useWorkspace();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Cmd/Ctrl+K opens the command palette (handled globally there), but the
  // header search focuses its own input on "/" for keyboard users.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        const el = document.getElementById("header-search");
        el?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchValue.trim();
    if (q) navigate({ to: "/tools", search: { q } });
    else navigate({ to: "/tools" });
    setMobileOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Logo />

        <nav className="ml-2 hidden items-center gap-1 md:flex">
          <NavLink to="/tools">All Tools</NavLink>
          <CategoriesMenu />
          <NavLink to="/workflows">Workflows</NavLink>
          <NavLink to="/guides">Guides</NavLink>
        </nav>

        <form onSubmit={submitSearch} className="relative ml-auto hidden flex-1 max-w-xs lg:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="header-search"
            type="search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search tools…"
            className="h-9 w-full rounded-lg border border-input bg-surface pl-9 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Search tools"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 select-none rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground lg:inline-block">
            /
          </kbd>
        </form>

        <div className="ml-auto flex items-center gap-1.5 lg:ml-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="h-9 w-9"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/workspace" className="gap-1.5">
              <Wrench className="h-4 w-4" />
              Workspace
              {count > 0 && (
                <span className="ml-0.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  {count}
                </span>
              )}
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="mx-auto max-w-7xl space-y-1 px-4 py-3">
            <form onSubmit={submitSearch} className="relative mb-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search tools…"
                className="h-10 w-full rounded-lg border border-input bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                aria-label="Search tools"
              />
            </form>
            <MobileLink to="/tools" onClick={() => setMobileOpen(false)}>
              All Tools
            </MobileLink>
            {CATEGORIES.map((c) => (
              <MobileLink
                key={c.id}
                to="/category/$slug"
                params={{ slug: c.slug }}
                onClick={() => setMobileOpen(false)}
              >
                {c.name}
              </MobileLink>
            ))}
            <MobileLink to="/workflows" onClick={() => setMobileOpen(false)}>
              Workflows
            </MobileLink>
            <MobileLink to="/guides" onClick={() => setMobileOpen(false)}>
              Guides
            </MobileLink>
            <MobileLink to="/workspace" onClick={() => setMobileOpen(false)}>
              Workspace{count > 0 ? ` (${count})` : ""}
            </MobileLink>
          </div>
        </div>
      )}
    </header>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      activeProps={{ className: "text-foreground" }}
    >
      {children}
    </Link>
  );
}

function MobileLink({
  to,
  params,
  children,
  onClick,
}: {
  to: string;
  params?: Record<string, string>;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      to={to}
      params={params}
      onClick={onClick}
      className="block rounded-md px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
    >
      {children}
    </Link>
  );
}

function CategoriesMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-expanded={open}
      >
        Categories
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 w-64 rounded-xl border border-border bg-popover p-2 shadow-lg">
          {CATEGORIES.map((c) => (
            <Link
              key={c.id}
              to="/category/$slug"
              params={{ slug: c.slug }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: `var(${c.accentVar})` }}
              />
              {c.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
