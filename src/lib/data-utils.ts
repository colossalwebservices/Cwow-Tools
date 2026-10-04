import Papa from "papaparse";

// Robust CSV parsing using PapaParse — handles quoted commas, line breaks,
// escaped quotes, BOMs, and different line endings.
export function parseCsv(text: string): string[][] {
  const result = Papa.parse<string[]>(text, { skipEmptyLines: false });
  return result.data as string[][];
}

export function parseCsvToObjects(text: string): Record<string, string>[] {
  const result = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  return result.data;
}

export function objectsToCsv(rows: Record<string, unknown>[], columns?: string[]): string {
  if (rows.length === 0) return "";
  const cols = columns ?? Object.keys(rows[0]);
  return Papa.unparse(
    rows.map((r) => {
      const obj: Record<string, unknown> = {};
      for (const c of cols) obj[c] = r[c] ?? "";
      return obj;
    }),
    { columns: cols },
  );
}

export function flattenJson(data: unknown): Record<string, unknown> {
  if (Array.isArray(data)) {
    // For arrays of objects, return first element flattened
    if (data.length > 0 && typeof data[0] === "object" && data[0] !== null) {
      return flattenJson(data[0]);
    }
    return { value: JSON.stringify(data) };
  }
  if (typeof data === "object" && data !== null) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v !== null && typeof v === "object") {
        const flat = flattenJson(v);
        for (const [k2, v2] of Object.entries(flat)) out[`${k}.${k2}`] = v2;
      } else {
        out[k] = v;
      }
    }
    return out;
  }
  return { value: data };
}

// Simple YAML <-> JSON without external dependency (handles common cases).
export function jsonToYaml(obj: unknown, indent = 0): string {
  const pad = "  ".repeat(indent);
  if (obj === null) return "null";
  if (typeof obj === "string") {
    if (/[:\n#{}[\],&*?|>!%@`]/.test(obj) || obj.trim() === "") return JSON.stringify(obj);
    return obj;
  }
  if (typeof obj === "number" || typeof obj === "boolean") return String(obj);
  if (Array.isArray(obj)) {
    if (obj.length === 0) return "[]";
    return obj.map((item) => `${pad}- ${jsonToYaml(item, indent + 1)}`).join("\n");
  }
  if (typeof obj === "object") {
    const entries = Object.entries(obj as Record<string, unknown>);
    if (entries.length === 0) return "{}";
    return entries
      .map(([k, v]) => {
        if (v !== null && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length > 0) {
          return `${pad}${k}:\n${jsonToYaml(v, indent + 1)}`;
        }
        if (Array.isArray(v) && v.length > 0) {
          return `${pad}${k}:\n${jsonToYaml(v, indent + 1)}`;
        }
        return `${pad}${k}: ${jsonToYaml(v, indent + 1)}`;
      })
      .join("\n");
  }
  return String(obj);
}

export function yamlToJson(yaml: string): unknown {
  // Minimal YAML parser for simple key-value and nested structures.
  const lines = yaml.split("\n").filter((l) => l.trim() && !l.trim().startsWith("#"));
  return parseYamlLines(lines, 0).value;
}

function parseYamlLines(lines: string[], indent: number): { value: unknown; consumed: number } {
  if (lines.length === 0) return { value: null, consumed: 0 };
  const first = lines[0];
  const leading = first.match(/^\s*/)?.[0].length ?? 0;
  if (leading < indent) return { value: null, consumed: 0 };

  // Array?
  if (first.trim().startsWith("- ")) {
    const arr: unknown[] = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const lead = line.match(/^\s*/)?.[0].length ?? 0;
      if (lead < leading) break;
      const content = line.trim().slice(2);
      if (content.includes(": ")) {
        // inline object
        const [k, ...rest] = content.split(":");
        arr.push({ [k.trim()]: rest.join(":").trim() });
      } else {
        arr.push(parseScalar(content));
      }
      i++;
    }
    return { value: arr, consumed: i };
  }

  // Object
  const obj: Record<string, unknown> = {};
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const lead = line.match(/^\s*/)?.[0].length ?? 0;
    if (lead < leading) break;
    if (lead > leading) {
      i++;
      continue;
    }
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) {
      i++;
      continue;
    }
    const key = line.slice(leading, colonIdx).trim();
    const val = line.slice(colonIdx + 1).trim();
    if (val === "") {
      // nested
      const nested = parseYamlLines(lines.slice(i + 1), leading + 1);
      obj[key] = nested.value;
      i += 1 + nested.consumed;
    } else {
      obj[key] = parseScalar(val);
      i++;
    }
  }
  return { value: obj, consumed: i };
}

function parseScalar(val: string): unknown {
  if (val === "null" || val === "~") return null;
  if (val === "true") return true;
  if (val === "false") return false;
  if (/^-?\d+$/.test(val)) return parseInt(val, 10);
  if (/^-?\d+\.\d+$/.test(val)) return parseFloat(val);
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
    return val.slice(1, -1);
  return val;
}
