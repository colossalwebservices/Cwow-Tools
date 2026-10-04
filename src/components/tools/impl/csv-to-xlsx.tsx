import { useState } from "react";
import {
  FileDropZone,
  makeSelectedFile,
  formatBytes,
  type SelectedFile,
} from "../../site/file-drop-zone";
import { ResultPanel, ErrorPanel, type ToolResult } from "../../site/result-panel";
import { useWorkspace } from "../../workspace/workspace-provider";
import { useToolState, ActionButton, EmptyState } from "../tool-primitives";
import { parseCsv } from "../../../lib/data-utils";

export function CsvToXlsxTool() {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const { busy, error, results, run, restart } = useToolState();
  const { addItem } = useWorkspace();

  async function process() {
    if (!files[0]) return;
    await run(async () => {
      const text = await files[0].file.text();
      const rows = parseCsv(text);
      const XLSX = (await import("xlsx")).default;
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
      const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([out], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      return [
        {
          blob,
          filename: files[0].file.name.replace(/\.csv$/i, "") + ".xlsx",
          mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          measurements: [
            { label: "Rows", value: String(Math.max(0, rows.length - 1)) },
            { label: "Columns", value: String(rows[0]?.length ?? 0) },
            { label: "Size", value: formatBytes(blob.size) },
          ],
        },
      ];
    });
  }

  function sendToWorkspace() {
    const r = results[0];
    if (r?.blob)
      addItem({ name: r.filename, mime: r.mime, blob: r.blob, sourceToolName: "CSV to Excel" });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <FileDropZone
          accept="text/csv,.csv"
          files={files}
          onFiles={(nf) => setFiles(nf.map(makeSelectedFile))}
          onRemove={() => setFiles([])}
          hint="One CSV file"
        />
        <ActionButton onClick={process} disabled={!files[0]} busy={busy}>
          Convert to Excel
        </ActionButton>
      </div>
      <div className="space-y-3">
        {error && <ErrorPanel message={error} onRestart={restart} />}
        {results.map((r, i) => (
          <ResultPanel
            key={i}
            result={r}
            tool={{ id: "csv-to-xlsx" } as never}
            onRestart={restart}
            onSendToWorkspace={i === 0 ? sendToWorkspace : undefined}
          />
        ))}
        {!error && results.length === 0 && (
          <EmptyState>Your XLSX spreadsheet will appear here.</EmptyState>
        )}
      </div>
    </div>
  );
}
