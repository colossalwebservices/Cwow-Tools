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

- The imported checkout initially contained no `src/` files. The complete source from the user's `c-wow-workspace.zip` has since been restored, replacing the temporary starter. Existing root build configuration and Base44 setup were preserved.
- Run `docker compose -f docker-compose.base44.yml up -d`; dependencies are installed from `bun.lock` at startup into a named volume, and the checkout is mounted live.
- The Vite config package already supplies the framework, React, and Tailwind plugins. Do not duplicate them. It also generates `src/routeTree.gen.ts` and `src/tailwind.config.vibe.json` during development.
- No external credentials or database are needed to boot the restored app. Online tools are marked unavailable until their integrations are implemented/configured; most tools run locally in the browser.
- Verify with `curl -fsS http://localhost:3000/` and `docker compose -f docker-compose.base44.yml ps` (web should be healthy). The restored homepage rendered without browser errors.
- `docker compose -f docker-compose.base44.yml exec -T web bunx tsc --noEmit` reports 208 existing errors in the supplied archive, including missing `src/lib/categories`, `src/lib/tools/tool-types`, and strict typing errors. Do not claim the restored source is type-check clean. Search behavior and screenshot verification were not completed during restoration.

