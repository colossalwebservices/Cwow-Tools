import { createFileRoute } from "@tanstack/react-router";
import { readyTools, categories } from "../lib/registry";
import { availableWorkflows } from "../lib/workflows";
import { guides } from "../lib/guides";

// Sitemap server route — returns XML. The origin is derived from the request.
export const Route = createFileRoute("/sitemap/xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const urls = [
          `${origin}/`,
          `${origin}/tools`,
          `${origin}/workflows`,
          `${origin}/guides`,
          `${origin}/about`,
          `${origin}/privacy`,
          `${origin}/terms`,
          `${origin}/contact`,
          `${origin}/workspace`,
        ];
        for (const c of categories) urls.push(`${origin}/category/${c.slug}`);
        for (const t of readyTools) urls.push(`${origin}/tools/${t.slug}`);
        for (const w of availableWorkflows) urls.push(`${origin}/workflows/${w.slug}`);
        for (const g of guides) urls.push(`${origin}/guides/${g.slug}`);
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")}\n</urlset>`;
        return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8" } });
      },
    },
  },
});
