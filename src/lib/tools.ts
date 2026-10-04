import type { CategoryId } from "./categories";
import type { ToolDefinition } from "./tools/tool-types";
import { PDF_TOOLS } from "./tools/pdf-tools";
import { IMAGE_TOOLS } from "./tools/image-tools";
import { AI_TOOLS, MEDIA_TOOLS } from "./tools/ai-media-tools";
import { DATA_TOOLS } from "./tools/data-tools";
import { DEV_TEXT_TOOLS } from "./tools/dev-text-tools";
import { COLOR_DESIGN_TOOLS, BUSINESS_TOOLS } from "./tools/color-business-tools";

export type { ToolDefinition, ProcessingMode, ToolStatus, InputKind } from "./tools/tool-types";

export const TOOLS: ToolDefinition[] = [
  ...PDF_TOOLS,
  ...IMAGE_TOOLS,
  ...AI_TOOLS,
  ...MEDIA_TOOLS,
  ...DATA_TOOLS,
  ...DEV_TEXT_TOOLS,
  ...COLOR_DESIGN_TOOLS,
  ...BUSINESS_TOOLS,
];

// Registry validation — catches duplicate ids/slugs at module load.
const seenIds = new Set<string>();
const seenSlugs = new Set<string>();
for (const t of TOOLS) {
  if (seenIds.has(t.id)) throw new Error(`Duplicate tool id: ${t.id}`);
  if (seenSlugs.has(t.slug)) throw new Error(`Duplicate tool slug: ${t.slug}`);
  seenIds.add(t.id);
  seenSlugs.add(t.slug);
}

// Only "ready" tools appear in the public catalog. integration-required /
// unsupported tools are kept as configuration but never shown as working.
export const READY_TOOLS: ToolDefinition[] = TOOLS.filter((t) => t.status === "ready");

export function toolBySlug(slug: string): ToolDefinition | undefined {
  return READY_TOOLS.find((t) => t.slug === slug);
}

export function toolById(id: string): ToolDefinition | undefined {
  return READY_TOOLS.find((t) => t.id === id);
}

export function toolsByCategory(category: CategoryId): ToolDefinition[] {
  return READY_TOOLS.filter((t) => t.category === category);
}

export function categoryToolCount(category: CategoryId): number {
  return READY_TOOLS.filter((t) => t.category === category).length;
}

export function totalReadyToolCount(): number {
  return READY_TOOLS.length;
}

export function featuredTools(): ToolDefinition[] {
  return READY_TOOLS.filter((t) => t.featured);
}

export function relatedTools(tool: ToolDefinition): ToolDefinition[] {
  const ids = tool.related ?? [];
  return ids
    .map((id) => READY_TOOLS.find((t) => t.id === id))
    .filter((t): t is ToolDefinition => Boolean(t));
}

// Suggest compatible "next" tools whose accepted inputs include the given
// output MIME type. Handles image/* style wildcards and excludes the current
// tool. Used by result panels to offer a "Send to next tool" action based on
// the actual output type.
export function suggestNextTools(
  mimeType: string,
  currentToolId?: string,
  limit = 6,
): ToolDefinition[] {
  if (!mimeType) return [];
  const mime = mimeType.toLowerCase();
  const type = mime.split("/")[0];
  const matches: ToolDefinition[] = [];
  for (const t of READY_TOOLS) {
    if (t.id === currentToolId) continue;
    const accepts = t.accepts ?? [];
    let hit = false;
    for (const a of accepts) {
      const acc = a.toLowerCase();
      if (acc === mime) hit = true;
      else if (acc === `${type}/*`) hit = true;
      else if (acc.endsWith("/*") && type === acc.slice(0, -2)) hit = true;
      if (hit) break;
    }
    if (hit) matches.push(t);
  }
  // De-dup and cap.
  const seen = new Set<string>();
  const out: ToolDefinition[] = [];
  for (const t of matches) {
    if (seen.has(t.id)) continue;
    seen.add(t.id);
    out.push(t);
    if (out.length >= limit) break;
  }
  return out;
}

// Lightweight scoring search across names, keywords, synonyms, formats.
export function searchTools(query: string, limit = 12): ToolDefinition[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);
  const scored: { tool: ToolDefinition; score: number }[] = [];
  for (const tool of READY_TOOLS) {
    const name = tool.name.toLowerCase();
    const desc = tool.description.toLowerCase();
    const keywords = tool.keywords.map((k) => k.toLowerCase());
    const synonyms = (tool.synonyms ?? []).map((s) => s.toLowerCase());
    const accepts = (tool.accepts ?? []).join(" ").toLowerCase();
    const outputs = (tool.outputs ?? []).join(" ").toLowerCase();
    let score = 0;
    if (name === q) score += 100;
    else if (name.includes(q)) score += 60;
    if (synonyms.some((s) => s === q)) score += 80;
    else if (synonyms.some((s) => s.includes(q))) score += 40;
    if (keywords.some((k) => k === q)) score += 50;
    else if (keywords.some((k) => k.includes(q))) score += 25;
    if (desc.includes(q)) score += 15;
    if (accepts.includes(q) || outputs.includes(q)) score += 20;
    for (const term of terms) {
      if (name.includes(term)) score += 8;
      if (keywords.some((k) => k.includes(term))) score += 6;
      if (synonyms.some((s) => s.includes(term))) score += 10;
      if (desc.includes(term)) score += 3;
    }
    if (score > 0) scored.push({ tool, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.tool);
}
