import { useState } from "react";
import { FileDropzone, FileChip, formatBytes } from "../file-dropzone";
import { ResultPanel, type ToolResult } from "../../lib/result-panel";
import {
  parseCsv,
  parseCsvToObjects,
  objectsToCsv,
  flattenJson,
  jsonToYaml,
  yamlToJson,
} from "../../lib/data-utils";
import { Loader2 } from "lucide-react";

function useDataState() {
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<ToolResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return { files, setFiles, result, setResult, loading, setLoading, error, setError };
}

function RunButton({
  onClick,
  loading,
  label,
  disabled,
}: {
  onClick: () => void;
  loading: boolean;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors focus-ring"
    >
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin" /> Processing…
        </>
      ) : (
        label
      )}
    </button>
  );
}

function FileList({ files, setFiles }: { files: File[]; setFiles: (f: File[]) => void }) {
  if (!files.length) return null;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {files.map((f, i) => (
          <FileChip key={i} file={f} onRemove={() => setFiles(files.filter((_, j) => j !== i))} />
        ))}
      </div>
      <button
        onClick={() => setFiles([])}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        Clear all
      </button>
    </div>
  );
}

async function readText(file: File): Promise<string> {
  return file.text();
}

export function CsvToXlsxTool() {
  const s = useDataState();
  const run = async () => {
    if (!s.files.length) return;
    s.setLoading(true);
    s.setError(null);
    try {
      const XLSX = await import("xlsx");
      const JSZip = s.files.length > 1 ? (await import("jszip")).default : null;
      const outputs: { name: string; blob: Blob }[] = [];
      for (const file of s.files) {
        const text = await readText(file);
        const rows = parseCsv(text);
        const ws = XLSX.utils.aoa_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        const arr = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
        outputs.push({
          name: file.name.replace(/\.[^.]+$/, "") + ".xlsx",
          blob: new Blob([arr], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          }),
        });
      }
      if (outputs.length === 1) {
        s.setResult({
          blob: outputs[0].blob,
          filename: outputs[0].name,
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          measurements: [
            { label: "Rows", value: String(parseCsv(await readText(s.files[0])).length - 1) },
            { label: "Size", value: formatBytes(outputs[0].blob.size) },
          ],
        });
      } else {
        const zip = new JSZip!();
        outputs.forEach((o) => zip.file(o.name, o.blob));
        const zipBlob = await zip.generateAsync({ type: "blob" });
        s.setResult({
          blob: zipBlob,
          filename: "xlsx-files.zip",
          mimeType: "application/zip",
          measurements: [{ label: "Files", value: String(outputs.length) }],
        });
      }
    } catch (e) {
      s.setError((e as Error).message);
    } finally {
      s.setLoading(false);
    }
  };
  return (
    <div>
      {s.files.length === 0 ? (
        <FileDropzone accept=".csv,text/csv" multiple onFiles={s.setFiles} hint="Batch supported" />
      ) : (
        <FileList files={s.files} setFiles={s.setFiles} />
      )}
      {s.error && <p className="mt-3 text-sm text-destructive">{s.error}</p>}
      <RunButton
        onClick={run}
        loading={s.loading}
        label="Convert to Excel"
        disabled={!s.files.length}
      />
      {s.result && (
        <div className="mt-4">
          <ResultPanel
            result={s.result}
            onReset={() => {
              s.setResult(null);
              s.setFiles([]);
            }}
          />
        </div>
      )}
    </div>
  );
}

export function XlsxToCsvTool() {
  const s = useDataState();
  const run = async () => {
    if (!s.files.length) return;
    s.setLoading(true);
    s.setError(null);
    try {
      const XLSX = await import("xlsx");
      const bytes = await s.files[0].arrayBuffer();
      const wb = XLSX.read(bytes, { type: "array" });
      const sheets = wb.SheetNames;
      const first = wb.Sheets[sheets[0]];
      const csv = XLSX.utils.sheet_to_csv(first);
      s.setResult({
        text: csv,
        filename: s.files[0].name.replace(/\.[^.]+$/, "") + ".csv",
        mimeType: "text/csv",
        measurements: [
          { label: "Sheets", value: String(sheets.length) },
          { label: "Used sheet", value: sheets[0] },
        ],
        preview: (
          <pre className="max-h-48 overflow-auto text-xs font-mono text-foreground">
            {csv.slice(0, 2000)}
            {csv.length > 2000 ? "…" : ""}
          </pre>
        ),
      });
    } catch (e) {
      s.setError((e as Error).message);
    } finally {
      s.setLoading(false);
    }
  };
  return (
    <div>
      {s.files.length === 0 ? (
        <FileDropzone
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onFiles={(f) => s.setFiles(f)}
        />
      ) : (
        <FileList files={s.files} setFiles={s.setFiles} />
      )}
      {s.error && <p className="mt-3 text-sm text-destructive">{s.error}</p>}
      <RunButton
        onClick={run}
        loading={s.loading}
        label="Convert to CSV"
        disabled={!s.files.length}
      />
      {s.result && (
        <div className="mt-4">
          <ResultPanel
            result={s.result}
            onReset={() => {
              s.setResult(null);
              s.setFiles([]);
            }}
          />
        </div>
      )}
    </div>
  );
}

export function CsvToJsonTool() {
  const s = useDataState();
  const run = async () => {
    if (!s.files.length) return;
    s.setLoading(true);
    s.setError(null);
    try {
      const text = await readText(s.files[0]);
      const rows = parseCsvToObjects(text);
      const json = JSON.stringify(rows, null, 2);
      s.setResult({
        text: json,
        filename: s.files[0].name.replace(/\.[^.]+$/, "") + ".json",
        mimeType: "application/json",
        measurements: [{ label: "Records", value: String(rows.length) }],
        preview: (
          <pre className="max-h-48 overflow-auto text-xs font-mono text-foreground">
            {json.slice(0, 2000)}
            {json.length > 2000 ? "…" : ""}
          </pre>
        ),
      });
    } catch (e) {
      s.setError((e as Error).message);
    } finally {
      s.setLoading(false);
    }
  };
  return (
    <div>
      {s.files.length === 0 ? (
        <FileDropzone accept=".csv,text/csv" onFiles={(f) => s.setFiles(f)} />
      ) : (
        <FileList files={s.files} setFiles={s.setFiles} />
      )}
      {s.error && <p className="mt-3 text-sm text-destructive">{s.error}</p>}
      <RunButton
        onClick={run}
        loading={s.loading}
        label="Convert to JSON"
        disabled={!s.files.length}
      />
      {s.result && (
        <div className="mt-4">
          <ResultPanel
            result={s.result}
            onReset={() => {
              s.setResult(null);
              s.setFiles([]);
            }}
          />
        </div>
      )}
    </div>
  );
}

export function JsonToCsvTool() {
  const s = useDataState();
  const run = async () => {
    if (!s.files.length) return;
    s.setLoading(true);
    s.setError(null);
    try {
      const text = await readText(s.files[0]);
      const data = JSON.parse(text);
      const arr = Array.isArray(data) ? data : [data];
      const flat = arr.map((item: unknown) => flattenJson(item));
      const csv = objectsToCsv(flat as Record<string, unknown>[]);
      s.setResult({
        text: csv,
        filename: s.files[0].name.replace(/\.[^.]+$/, "") + ".csv",
        mimeType: "text/csv",
        measurements: [
          { label: "Records", value: String(arr.length) },
          { label: "Columns", value: String(Object.keys(flat[0] ?? {}).length) },
        ],
        preview: (
          <pre className="max-h-48 overflow-auto text-xs font-mono text-foreground">
            {csv.slice(0, 2000)}
            {csv.length > 2000 ? "…" : ""}
          </pre>
        ),
      });
    } catch (e) {
      s.setError((e as Error).message);
    } finally {
      s.setLoading(false);
    }
  };
  return (
    <div>
      {s.files.length === 0 ? (
        <FileDropzone accept=".json,application/json" onFiles={(f) => s.setFiles(f)} />
      ) : (
        <FileList files={s.files} setFiles={s.setFiles} />
      )}
      {s.error && <p className="mt-3 text-sm text-destructive">{s.error}</p>}
      <RunButton
        onClick={run}
        loading={s.loading}
        label="Convert to CSV"
        disabled={!s.files.length}
      />
      {s.result && (
        <div className="mt-4">
          <ResultPanel
            result={s.result}
            onReset={() => {
              s.setResult(null);
              s.setFiles([]);
            }}
          />
        </div>
      )}
    </div>
  );
}

export function JsonToXlsxTool() {
  const s = useDataState();
  const run = async () => {
    if (!s.files.length) return;
    s.setLoading(true);
    s.setError(null);
    try {
      const XLSX = await import("xlsx");
      const text = await readText(s.files[0]);
      const data = JSON.parse(text);
      const arr = Array.isArray(data) ? data : [data];
      const flat = arr.map((item: unknown) => flattenJson(item));
      const ws = XLSX.utils.json_to_sheet(flat);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
      const arrBuf = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
      const blob = new Blob([arrBuf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      s.setResult({
        blob,
        filename: s.files[0].name.replace(/\.[^.]+$/, "") + ".xlsx",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        measurements: [{ label: "Records", value: String(arr.length) }],
      });
    } catch (e) {
      s.setError((e as Error).message);
    } finally {
      s.setLoading(false);
    }
  };
  return (
    <div>
      {s.files.length === 0 ? (
        <FileDropzone accept=".json,application/json" onFiles={(f) => s.setFiles(f)} />
      ) : (
        <FileList files={s.files} setFiles={s.setFiles} />
      )}
      {s.error && <p className="mt-3 text-sm text-destructive">{s.error}</p>}
      <RunButton
        onClick={run}
        loading={s.loading}
        label="Convert to Excel"
        disabled={!s.files.length}
      />
      {s.result && (
        <div className="mt-4">
          <ResultPanel
            result={s.result}
            onReset={() => {
              s.setResult(null);
              s.setFiles([]);
            }}
          />
        </div>
      )}
    </div>
  );
}

export function XlsxToJsonTool() {
  const s = useDataState();
  const run = async () => {
    if (!s.files.length) return;
    s.setLoading(true);
    s.setError(null);
    try {
      const XLSX = await import("xlsx");
      const bytes = await s.files[0].arrayBuffer();
      const wb = XLSX.read(bytes, { type: "array" });
      const first = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(first);
      const text = JSON.stringify(json, null, 2);
      s.setResult({
        text,
        filename: s.files[0].name.replace(/\.[^.]+$/, "") + ".json",
        mimeType: "application/json",
        measurements: [
          { label: "Records", value: String(json.length) },
          { label: "Sheets", value: String(wb.SheetNames.length) },
        ],
        preview: (
          <pre className="max-h-48 overflow-auto text-xs font-mono text-foreground">
            {text.slice(0, 2000)}
            {text.length > 2000 ? "…" : ""}
          </pre>
        ),
      });
    } catch (e) {
      s.setError((e as Error).message);
    } finally {
      s.setLoading(false);
    }
  };
  return (
    <div>
      {s.files.length === 0 ? (
        <FileDropzone
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onFiles={(f) => s.setFiles(f)}
        />
      ) : (
        <FileList files={s.files} setFiles={s.setFiles} />
      )}
      {s.error && <p className="mt-3 text-sm text-destructive">{s.error}</p>}
      <RunButton
        onClick={run}
        loading={s.loading}
        label="Convert to JSON"
        disabled={!s.files.length}
      />
      {s.result && (
        <div className="mt-4">
          <ResultPanel
            result={s.result}
            onReset={() => {
              s.setResult(null);
              s.setFiles([]);
            }}
          />
        </div>
      )}
    </div>
  );
}

export function XmlJsonTool() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"xml2json" | "json2xml">("xml2json");
  const s = useDataState();
  const run = async () => {
    if (!input.trim()) {
      s.setError("Enter some data.");
      return;
    }
    s.setLoading(true);
    s.setError(null);
    try {
      let output = "";
      if (mode === "xml2json") {
        const parser = new DOMParser();
        const doc = parser.parseFromString(input, "text/xml");
        if (doc.getElementsByTagName("parsererror").length) throw new Error("Invalid XML");
        output = JSON.stringify(xmlToJson(doc.documentElement), null, 2);
      } else {
        const data = JSON.parse(input);
        output = jsonToXml(data, "root");
      }
      s.setResult({
        text: output,
        filename: mode === "xml2json" ? "converted.json" : "converted.xml",
        mimeType: mode === "xml2json" ? "application/json" : "text/xml",
        preview: (
          <pre className="max-h-48 overflow-auto text-xs font-mono text-foreground">
            {output.slice(0, 2000)}
            {output.length > 2000 ? "…" : ""}
          </pre>
        ),
      });
    } catch (e) {
      s.setError((e as Error).message);
    } finally {
      s.setLoading(false);
    }
  };
  return (
    <div>
      <div className="flex gap-2 mb-3">
        {(["xml2json", "json2xml"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-lg px-3 py-1.5 text-sm ${mode === m ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`}
          >
            {m === "xml2json" ? "XML → JSON" : "JSON → XML"}
          </button>
        ))}
      </div>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={mode === "xml2json" ? "<root><item>value</item></root>" : '{"item": "value"}'}
        className="min-h-[160px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus-ring resize-y"
      />
      {s.error && <p className="mt-3 text-sm text-destructive">{s.error}</p>}
      <RunButton onClick={run} loading={s.loading} label="Convert" disabled={!input.trim()} />
      {s.result && (
        <div className="mt-4">
          <ResultPanel
            result={s.result}
            onReset={() => {
              s.setResult(null);
              setInput("");
            }}
          />
        </div>
      )}
    </div>
  );
}

export function YamlJsonTool() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"yaml2json" | "json2yaml">("yaml2json");
  const s = useDataState();
  const run = async () => {
    if (!input.trim()) {
      s.setError("Enter some data.");
      return;
    }
    s.setLoading(true);
    s.setError(null);
    try {
      let output = "";
      if (mode === "yaml2json") {
        const data = yamlToJson(input);
        output = JSON.stringify(data, null, 2);
      } else {
        const data = JSON.parse(input);
        output = jsonToYaml(data);
      }
      s.setResult({
        text: output,
        filename: mode === "yaml2json" ? "converted.json" : "converted.yaml",
        mimeType: mode === "yaml2json" ? "application/json" : "text/yaml",
        preview: (
          <pre className="max-h-48 overflow-auto text-xs font-mono text-foreground">
            {output.slice(0, 2000)}
            {output.length > 2000 ? "…" : ""}
          </pre>
        ),
      });
    } catch (e) {
      s.setError((e as Error).message);
    } finally {
      s.setLoading(false);
    }
  };
  return (
    <div>
      <div className="flex gap-2 mb-3">
        {(["yaml2json", "json2yaml"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-lg px-3 py-1.5 text-sm ${mode === m ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`}
          >
            {m === "yaml2json" ? "YAML → JSON" : "JSON → YAML"}
          </button>
        ))}
      </div>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={mode === "yaml2json" ? "key: value\nlist:\n  - item1" : '{"key": "value"}'}
        className="min-h-[160px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus-ring resize-y"
      />
      {s.error && <p className="mt-3 text-sm text-destructive">{s.error}</p>}
      <RunButton onClick={run} loading={s.loading} label="Convert" disabled={!input.trim()} />
      {s.result && (
        <div className="mt-4">
          <ResultPanel
            result={s.result}
            onReset={() => {
              s.setResult(null);
              setInput("");
            }}
          />
        </div>
      )}
    </div>
  );
}

export function CsvCleanTool() {
  const s = useDataState();
  const [dedupe, setDedupe] = useState(true);
  const [trim, setTrim] = useState(true);
  const run = async () => {
    if (!s.files.length) return;
    s.setLoading(true);
    s.setError(null);
    try {
      const text = await readText(s.files[0]);
      let rows = parseCsv(text);
      const header = rows[0] ?? [];
      let dataRows = rows.slice(1);
      const before = dataRows.length;
      if (trim)
        dataRows = dataRows.map((r) => r.map((c) => (typeof c === "string" ? c.trim() : c)));
      if (dedupe) {
        const seen = new Set<string>();
        dataRows = dataRows.filter((r) => {
          const key = r.join("\x00");
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      }
      const out = [header, ...dataRows];
      const csv = objectsToCsv(
        out.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""]))),
        header,
      );
      s.setResult({
        text: csv,
        filename: "cleaned.csv",
        mimeType: "text/csv",
        measurements: [
          { label: "Rows before", value: String(before) },
          { label: "Rows after", value: String(dataRows.length) },
          { label: "Removed", value: String(before - dataRows.length) },
        ],
        preview: (
          <pre className="max-h-48 overflow-auto text-xs font-mono text-foreground">
            {csv.slice(0, 2000)}
            {csv.length > 2000 ? "…" : ""}
          </pre>
        ),
      });
    } catch (e) {
      s.setError((e as Error).message);
    } finally {
      s.setLoading(false);
    }
  };
  return (
    <div>
      {s.files.length === 0 ? (
        <FileDropzone accept=".csv,text/csv" onFiles={(f) => s.setFiles(f)} />
      ) : (
        <FileList files={s.files} setFiles={s.setFiles} />
      )}
      <div className="mt-4 space-y-2">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={dedupe}
            onChange={(e) => setDedupe(e.target.checked)}
            className="accent-primary"
          />{" "}
          Remove duplicate rows
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={trim}
            onChange={(e) => setTrim(e.target.checked)}
            className="accent-primary"
          />{" "}
          Trim whitespace in fields
        </label>
      </div>
      {s.error && <p className="mt-3 text-sm text-destructive">{s.error}</p>}
      <RunButton onClick={run} loading={s.loading} label="Clean CSV" disabled={!s.files.length} />
      {s.result && (
        <div className="mt-4">
          <ResultPanel
            result={s.result}
            onReset={() => {
              s.setResult(null);
              s.setFiles([]);
            }}
          />
        </div>
      )}
    </div>
  );
}

export function CsvSplitTool() {
  const s = useDataState();
  const [rowsPerFile, setRowsPerFile] = useState(1000);
  const run = async () => {
    if (!s.files.length) return;
    s.setLoading(true);
    s.setError(null);
    try {
      const JSZip = (await import("jszip")).default;
      const text = await readText(s.files[0]);
      const rows = parseCsv(text);
      const header = rows[0];
      const data = rows.slice(1);
      const zip = new JSZip();
      const chunks = Math.ceil(data.length / rowsPerFile);
      for (let i = 0; i < chunks; i++) {
        const chunk = data.slice(i * rowsPerFile, (i + 1) * rowsPerFile);
        const csv = objectsToCsv(
          [header, ...chunk].map((r) => Object.fromEntries(header.map((h, j) => [h, r[j] ?? ""]))),
          header,
        );
        zip.file(`split-${i + 1}.csv`, csv);
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });
      s.setResult({
        blob: zipBlob,
        filename: "csv-split.zip",
        mimeType: "application/zip",
        measurements: [
          { label: "Total rows", value: String(data.length) },
          { label: "Files", value: String(chunks) },
          { label: "Rows/file", value: String(rowsPerFile) },
        ],
      });
    } catch (e) {
      s.setError((e as Error).message);
    } finally {
      s.setLoading(false);
    }
  };
  return (
    <div>
      {s.files.length === 0 ? (
        <FileDropzone accept=".csv,text/csv" onFiles={(f) => s.setFiles(f)} />
      ) : (
        <FileList files={s.files} setFiles={s.setFiles} />
      )}
      <div className="mt-4">
        <label className="block text-sm text-muted-foreground">
          Rows per file
          <input
            type="number"
            min={1}
            value={rowsPerFile}
            onChange={(e) => setRowsPerFile(+e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus-ring"
          />
        </label>
      </div>
      {s.error && <p className="mt-3 text-sm text-destructive">{s.error}</p>}
      <RunButton onClick={run} loading={s.loading} label="Split CSV" disabled={!s.files.length} />
      {s.result && (
        <div className="mt-4">
          <ResultPanel
            result={s.result}
            onReset={() => {
              s.setResult(null);
              s.setFiles([]);
            }}
          />
        </div>
      )}
    </div>
  );
}

export function CsvMergeTool() {
  const s = useDataState();
  const run = async () => {
    if (s.files.length < 2) {
      s.setError("Add at least 2 CSV files.");
      return;
    }
    s.setLoading(true);
    s.setError(null);
    try {
      let header: string[] | null = null;
      const allRows: string[][] = [];
      for (const file of s.files) {
        const text = await readText(file);
        const rows = parseCsv(text);
        if (!header) {
          header = rows[0];
          allRows.push(rows[0]);
        }
        allRows.push(...rows.slice(1));
      }
      const csv = objectsToCsv(
        allRows.map((r) => Object.fromEntries((header ?? []).map((h, i) => [h, r[i] ?? ""]))),
        header ?? [],
      );
      s.setResult({
        text: csv,
        filename: "merged.csv",
        mimeType: "text/csv",
        measurements: [
          { label: "Files", value: String(s.files.length) },
          { label: "Total rows", value: String(allRows.length - 1) },
        ],
        preview: (
          <pre className="max-h-48 overflow-auto text-xs font-mono text-foreground">
            {csv.slice(0, 2000)}
            {csv.length > 2000 ? "…" : ""}
          </pre>
        ),
      });
    } catch (e) {
      s.setError((e as Error).message);
    } finally {
      s.setLoading(false);
    }
  };
  return (
    <div>
      {s.files.length === 0 ? (
        <FileDropzone
          accept=".csv,text/csv"
          multiple
          onFiles={s.setFiles}
          hint="Add 2 or more CSVs"
        />
      ) : (
        <FileList files={s.files} setFiles={s.setFiles} />
      )}
      {s.error && <p className="mt-3 text-sm text-destructive">{s.error}</p>}
      <RunButton onClick={run} loading={s.loading} label="Merge CSVs" disabled={!s.files.length} />
      {s.result && (
        <div className="mt-4">
          <ResultPanel
            result={s.result}
            onReset={() => {
              s.setResult(null);
              s.setFiles([]);
            }}
          />
        </div>
      )}
    </div>
  );
}

export function ZipCreateTool() {
  const s = useDataState();
  const run = async () => {
    if (!s.files.length) return;
    s.setLoading(true);
    s.setError(null);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      for (const file of s.files) zip.file(file.name, file);
      const blob = await zip.generateAsync({ type: "blob" });
      s.setResult({
        blob,
        filename: "archive.zip",
        mimeType: "application/zip",
        measurements: [
          { label: "Files", value: String(s.files.length) },
          { label: "Original size", value: formatBytes(s.files.reduce((a, f) => a + f.size, 0)) },
          { label: "ZIP size", value: formatBytes(blob.size) },
        ],
      });
    } catch (e) {
      s.setError((e as Error).message);
    } finally {
      s.setLoading(false);
    }
  };
  return (
    <div>
      {s.files.length === 0 ? (
        <FileDropzone multiple onFiles={s.setFiles} hint="Any files" />
      ) : (
        <FileList files={s.files} setFiles={s.setFiles} />
      )}
      {s.error && <p className="mt-3 text-sm text-destructive">{s.error}</p>}
      <RunButton onClick={run} loading={s.loading} label="Create ZIP" disabled={!s.files.length} />
      {s.result && (
        <div className="mt-4">
          <ResultPanel
            result={s.result}
            onReset={() => {
              s.setResult(null);
              s.setFiles([]);
            }}
          />
        </div>
      )}
    </div>
  );
}

export function ZipExtractTool() {
  const s = useDataState();
  const run = async () => {
    if (!s.files.length) return;
    s.setLoading(true);
    s.setError(null);
    try {
      const JSZip = (await import("jszip")).default;
      const bytes = await s.files[0].arrayBuffer();
      const zip = await JSZip.loadAsync(bytes);
      const entries = Object.values(zip.files).filter((e) => !e.dir);
      if (entries.length > 500) throw new Error("Too many files (max 500).");
      const outZip = new JSZip();
      for (const entry of entries) {
        const blob = await entry.async("blob");
        outZip.file(entry.name, blob);
      }
      // If single file, return it directly
      if (entries.length === 1) {
        const blob = await entries[0].async("blob");
        s.setResult({
          blob,
          filename: entries[0].name,
          mimeType: "application/octet-stream",
          measurements: [
            { label: "Files", value: "1" },
            { label: "Size", value: formatBytes(blob.size) },
          ],
        });
      } else {
        const blob = await outZip.generateAsync({ type: "blob" });
        s.setResult({
          blob,
          filename: "extracted.zip",
          mimeType: "application/zip",
          measurements: [
            { label: "Files", value: String(entries.length) },
            { label: "Size", value: formatBytes(blob.size) },
          ],
        });
      }
    } catch (e) {
      s.setError((e as Error).message);
    } finally {
      s.setLoading(false);
    }
  };
  return (
    <div>
      {s.files.length === 0 ? (
        <FileDropzone accept=".zip,application/zip" onFiles={(f) => s.setFiles(f)} />
      ) : (
        <FileList files={s.files} setFiles={s.setFiles} />
      )}
      {s.error && <p className="mt-3 text-sm text-destructive">{s.error}</p>}
      <RunButton onClick={run} loading={s.loading} label="Extract ZIP" disabled={!s.files.length} />
      {s.result && (
        <div className="mt-4">
          <ResultPanel
            result={s.result}
            onReset={() => {
              s.setResult(null);
              s.setFiles([]);
            }}
          />
        </div>
      )}
    </div>
  );
}

export function MdHtmlTool() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"md2html" | "html2md">("md2html");
  const s = useDataState();
  const run = async () => {
    if (!input.trim()) {
      s.setError("Enter some content.");
      return;
    }
    s.setLoading(true);
    s.setError(null);
    try {
      let output = "";
      if (mode === "md2html") {
        output = markdownToHtml(input);
      } else {
        output = htmlToMarkdown(input);
      }
      s.setResult({
        text: output,
        filename: mode === "md2html" ? "converted.html" : "converted.md",
        mimeType: mode === "md2html" ? "text/html" : "text/markdown",
        preview: (
          <pre className="max-h-48 overflow-auto text-xs font-mono text-foreground whitespace-pre-wrap">
            {output.slice(0, 2000)}
            {output.length > 2000 ? "…" : ""}
          </pre>
        ),
      });
    } catch (e) {
      s.setError((e as Error).message);
    } finally {
      s.setLoading(false);
    }
  };
  return (
    <div>
      <div className="flex gap-2 mb-3">
        {(["md2html", "html2md"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-lg px-3 py-1.5 text-sm ${mode === m ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`}
          >
            {m === "md2html" ? "Markdown → HTML" : "HTML → Markdown"}
          </button>
        ))}
      </div>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={mode === "md2html" ? "# Heading\n**bold** text" : "<h1>Heading</h1>"}
        className="min-h-[160px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus-ring resize-y"
      />
      {s.error && <p className="mt-3 text-sm text-destructive">{s.error}</p>}
      <RunButton onClick={run} loading={s.loading} label="Convert" disabled={!input.trim()} />
      {s.result && (
        <div className="mt-4">
          <ResultPanel
            result={s.result}
            onReset={() => {
              s.setResult(null);
              setInput("");
            }}
          />
        </div>
      )}
    </div>
  );
}

// ---- helpers ----
function xmlToJson(node: Element): unknown {
  const obj: Record<string, unknown> = {};
  if (node.attributes && node.attributes.length > 0) {
    for (const attr of Array.from(node.attributes)) obj["@" + attr.name] = attr.value;
  }
  const children = Array.from(node.children);
  if (children.length === 0) {
    return node.textContent?.trim() || "";
  }
  for (const child of children) {
    const val = xmlToJson(child);
    if (obj[child.tagName]) {
      if (!Array.isArray(obj[child.tagName])) obj[child.tagName] = [obj[child.tagName]];
      (obj[child.tagName] as unknown[]).push(val);
    } else obj[child.tagName] = val;
  }
  return obj;
}

function jsonToXml(data: unknown, name: string, indent = 0): string {
  const pad = "  ".repeat(indent);
  if (data === null || typeof data !== "object")
    return `${pad}<${name}>${escapeXml(String(data ?? ""))}</${name}>`;
  if (Array.isArray(data)) return data.map((item) => jsonToXml(item, name, indent)).join("\n");
  const entries = Object.entries(data as Record<string, unknown>);
  let inner = "";
  for (const [k, v] of entries) {
    if (k.startsWith("@")) continue;
    inner += "\n" + jsonToXml(v, k, indent + 1);
  }
  return `${pad}<${name}>${inner}\n${pad}</${name}>`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function markdownToHtml(md: string): string {
  let html = md;
  html = html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  html = html
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/`(.+?)`/g, "<code>$1</code>");
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
  html = html.replace(/^\s*[-*] (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);
  html = html.replace(/\n\n/g, "</p><p>");
  return `<p>${html}</p>`;
}

function htmlToMarkdown(html: string): string {
  let md = html;
  md = md
    .replace(/<h1>(.*?)<\/h1>/gi, "# $1\n")
    .replace(/<h2>(.*?)<\/h2>/gi, "## $1\n")
    .replace(/<h3>(.*?)<\/h3>/gi, "### $1\n");
  md = md.replace(/<strong>(.*?)<\/strong>/gi, "**$1**").replace(/<b>(.*?)<\/b>/gi, "**$1**");
  md = md.replace(/<em>(.*?)<\/em>/gi, "*$1*").replace(/<i>(.*?)<\/i>/gi, "*$1*");
  md = md.replace(/<code>(.*?)<\/code>/gi, "`$1`");
  md = md.replace(/<a href="(.*?)">(.*?)<\/a>/gi, "[$2]($1)");
  md = md.replace(/<li>(.*?)<\/li>/gi, "- $1\n");
  md = md.replace(/<\/?(ul|ol|p|div|span)>/gi, "");
  md = md.replace(/<[^>]+>/g, "");
  return md.trim();
}
