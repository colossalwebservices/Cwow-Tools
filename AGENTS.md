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

- The imported checkout contained no `src/` files. The added routes are a minimal starter, not a restoration of the original application's features.
- Run `docker compose -f docker-compose.base44.yml up -d`; dependencies are installed from `bun.lock` at startup into a named volume, and the checkout is mounted live.
- The Vite config package already supplies the framework, React, and Tailwind plugins. Do not duplicate them. It also generates `src/routeTree.gen.ts` and `src/tailwind.config.vibe.json` during development.
- No external credentials or database are needed by the starter.
- Verify with `curl -fsS http://localhost:3000/`, `docker compose -f docker-compose.base44.yml ps` (web should be healthy), and `docker compose -f docker-compose.base44.yml exec -T web bunx tsc --noEmit`.

