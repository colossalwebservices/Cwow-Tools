<!-- VIBE:BEGIN -->
> [!IMPORTANT]
> This project is connected to AI Studio. Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on AI Studio's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to AI Studio and show up in
> the editor, so keep the branch in a working state.
<!-- VIBE:END -->

## Base44 development environment

- The `main` branch's "Add files via upload" commit (`209d28b`) shipped only root build config and dropped the entire `src/` tree, so the Vite dev server had no `src/server.ts` entry to start. The application source was restored from `origin/base44/setup-67882c50` into this branch (`fix-main-34541ab8c165`); root build config was already identical and was left untouched.
- Run `docker compose -f docker-compose.base44.yml up -d`; dependencies install from `bun.lock` at startup into a named volume, and the checkout is mounted live. The dev server (Vite 8 + TanStack Start SSR) binds `0.0.0.0:3000`.
- The Vite config package (`@leadconnector/vite-tanstack-config`) supplies the framework, React, and Tailwind plugins — do not duplicate them. It generates `src/routeTree.gen.ts` and `src/tailwind.config.vibe.json` during development (both gitignored).
- No external credentials or database are needed to boot. Online tools are marked unavailable until their integrations are implemented; most tools run locally in the browser.
- Verify with `curl -fsS http://localhost:3000/` (homepage renders SSR HTML) and `docker compose -f docker-compose.base44.yml ps` (`web` should be healthy). `bun run build` (production) completes successfully.
- `bunx tsc --noEmit` reports a large number of pre-existing strict-typing errors in the restored archive (including missing `src/lib/categories` and `src/lib/tools/tool-types` modules). These do not block the dev server or the production build; do not claim the source is type-check clean.
