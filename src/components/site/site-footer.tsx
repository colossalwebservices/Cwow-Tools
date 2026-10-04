import { Link } from "@tanstack/react-router";
import { Logo } from "./logo";
import { CwsLogo } from "./cws-logo";
import { CATEGORIES } from "../../lib/categories";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <Logo />
            <p className="mt-3 text-sm text-muted-foreground">
              Everyday tasks. Colossal possibilities. A free multitool workspace that runs right in
              your browser.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Tools</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <FooterLink to="/tools">All Tools</FooterLink>
              <FooterLink to="/workflows">Workflows</FooterLink>
              <FooterLink to="/guides">Guides</FooterLink>
              <FooterLink to="/workspace">Workspace</FooterLink>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Categories</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {CATEGORIES.slice(0, 5).map((c) => (
                <FooterLink key={c.id} to="/category/$slug" params={{ slug: c.slug }}>
                  {c.name}
                </FooterLink>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Company</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <FooterLink to="/about">About</FooterLink>
              <FooterLink to="/privacy">Privacy</FooterLink>
              <FooterLink to="/terms">Terms</FooterLink>
              <FooterLink to="/contact">Contact</FooterLink>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} C Wow by Colossal Web Services. Free tools, no signup
            required.
          </p>
          <a
            href="https://www.colossalwebservices.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg transition-opacity hover:opacity-80 focus-ring"
            aria-label="Colossal Web Services — need a website, app, or automation?"
          >
            <span className="text-xs text-muted-foreground">
              Need a website, app, or automation?
            </span>
            <CwsLogo height={22} />
          </a>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  to,
  params,
  children,
}: {
  to: string;
  params?: Record<string, string>;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        to={to}
        params={params}
        className="text-muted-foreground transition-colors hover:text-foreground"
      >
        {children}
      </Link>
    </li>
  );
}
