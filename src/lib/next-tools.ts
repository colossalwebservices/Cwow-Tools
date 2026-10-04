// Suggest compatible "next" tools whose accepted input MIME types include the
// given output MIME type. Handles image/*, video/*, audio/* style wildcards
// and excludes the current tool. Used by result panels to offer a
// "Send to next tool" action based on the actual output type.
import { readyTools, type ToolDef } from "./registry";

export function suggestNextTools(mimeType: string, currentToolId?: string, limit = 6): ToolDef[] {
  if (!mimeType) return [];
  const mime = mimeType.toLowerCase();
  const type = mime.split("/")[0];
  const matches: ToolDef[] = [];
  for (const t of readyTools) {
    if (t.id === currentToolId) continue;
    let hit = false;
    for (const a of t.inputKinds) {
      const acc = a.toLowerCase();
      if (acc === mime) hit = true;
      else if (acc === `${type}/*`) hit = true;
      else if (acc.endsWith("/*") && type === acc.slice(0, -2)) hit = true;
      if (hit) break;
    }
    if (hit) matches.push(t);
  }
  const seen = new Set<string>();
  const out: ToolDef[] = [];
  for (const t of matches) {
    if (seen.has(t.id)) continue;
    seen.add(t.id);
    out.push(t);
    if (out.length >= limit) break;
  }
  return out;
}
