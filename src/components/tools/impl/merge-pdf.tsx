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

export function MergePdfTool() {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const { busy, error, results, run, restart } = useToolState();
  const { addItem } = useWorkspace();

  async function process() {
    if (files.length < 2) return;
    await run(async () => {
      const { PDFDocument } = await import("pdf-lib");
      const merged = await PDFDocument.create();
      for (const sf of files) {
        const bytes = await sf.file.arrayBuffer();
        const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const pages = await merged.copyPages(src, src.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
      }
      const out = await merged.save();
      const blob = new Blob([out], { type: "application/pdf" });
      return [
        {
          blob,
          filename: "merged.pdf",
          mime: "application/pdf",
          previewUrl: URL.createObjectURL(blob),
          measurements: [
            { label: "Pages", value: String(merged.getPageCount()) },
            { label: "Size", value: formatBytes(blob.size) },
          ],
        },
      ];
    });
  }

  function sendToWorkspace() {
    const r = results[0];
    if (r?.blob)
      addItem({ name: r.filename, mime: r.mime, blob: r.blob, sourceToolName: "Merge PDF" });
  }

  function move(id: string, dir: -1 | 1) {
    setFiles((prev) => {
      const i = prev.findIndex((f) => f.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <FileDropZone
          accept="application/pdf"
          multiple
          files={files}
          onFiles={(nf) => setFiles((prev) => [...prev, ...nf.map(makeSelectedFile)])}
          onRemove={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
          hint="Select 2 or more PDF files"
        />
        {files.length > 0 && (
          <div className="rounded-xl border border-border bg-panel p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Merge order (top to bottom)
            </p>
            <ol className="space-y-1.5">
              {files.map((f, i) => (
                <li
                  key={f.id}
                  className="flex items-center gap-2 rounded-lg bg-surface px-2.5 py-1.5"
                >
                  <span className="text-xs font-mono text-muted-foreground">{i + 1}.</span>
                  <span className="flex-1 truncate text-sm text-foreground">{f.file.name}</span>
                  <span className="text-xs text-muted-foreground">{formatBytes(f.file.size)}</span>
                  <button
                    onClick={() => move(f.id, -1)}
                    disabled={i === 0}
                    className="rounded p-1 text-muted-foreground hover:bg-accent disabled:opacity-30"
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => move(f.id, 1)}
                    disabled={i === files.length - 1}
                    className="rounded p-1 text-muted-foreground hover:bg-accent disabled:opacity-30"
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                </li>
              ))}
            </ol>
          </div>
        )}
        <ActionButton onClick={process} disabled={files.length < 2} busy={busy}>
          Merge {files.length} PDFs
        </ActionButton>
      </div>
      <div className="space-y-3">
        {error && <ErrorPanel message={error} onRestart={restart} />}
        {results.map((r, i) => (
          <ResultPanel
            key={i}
            result={r}
            tool={{ id: "pdf-merge" } as never}
            onRestart={restart}
            onSendToWorkspace={i === 0 ? sendToWorkspace : undefined}
          />
        ))}
        {!error && results.length === 0 && (
          <EmptyState>
            Select at least two PDFs to merge. Drag to reorder before merging.
          </EmptyState>
        )}
      </div>
    </div>
  );
}
