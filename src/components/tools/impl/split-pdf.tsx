import { useState } from "react";
import {
  FileDropZone,
  makeSelectedFile,
  formatBytes,
  type SelectedFile,
} from "../../site/file-drop-zone";
import { ResultPanel, ErrorPanel, type ToolResult } from "../../site/result-panel";
import { useWorkspace } from "../../workspace/workspace-provider";
import { useToolState, ActionButton, EmptyState, TextField } from "../tool-primitives";

export function SplitPdfTool() {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [ranges, setRanges] = useState("1");
  const { busy, error, results, run, restart } = useToolState();
  const { addItem } = useWorkspace();

  function parseRanges(input: string, maxPage: number): number[][] {
    const groups: number[][] = [];
    for (const part of input.split(",")) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      if (trimmed.includes("-")) {
        const [a, b] = trimmed.split("-").map((n) => parseInt(n.trim(), 10));
        if (isNaN(a) || isNaN(b) || a < 1 || b > maxPage || a > b)
          throw new Error(`Invalid range: ${trimmed}. The PDF has ${maxPage} pages.`);
        const pages: number[] = [];
        for (let i = a; i <= b; i++) pages.push(i);
        groups.push(pages);
      } else {
        const n = parseInt(trimmed, 10);
        if (isNaN(n) || n < 1 || n > maxPage)
          throw new Error(`Invalid page: ${trimmed}. The PDF has ${maxPage} pages.`);
        groups.push([n]);
      }
    }
    return groups;
  }

  async function process() {
    if (!files[0]) return;
    await run(async () => {
      const { PDFDocument } = await import("pdf-lib");
      const bytes = await files[0].file.arrayBuffer();
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const total = src.getPageCount();
      const groups = parseRanges(ranges, total);
      const out: ToolResult[] = [];
      for (let g = 0; g < groups.length; g++) {
        const doc = await PDFDocument.create();
        const pages = await doc.copyPages(
          src,
          groups[g].map((p) => p - 1),
        );
        pages.forEach((p) => doc.addPage(p));
        const data = await doc.save();
        const blob = new Blob([data], { type: "application/pdf" });
        out.push({
          blob,
          filename: `${files[0].file.name.replace(/\.pdf$/i, "")}-pages-${groups[g][0]}-${groups[g][groups[g].length - 1]}.pdf`,
          mime: "application/pdf",
          previewUrl: URL.createObjectURL(blob),
          measurements: [
            { label: "Pages", value: String(groups[g].length) },
            { label: "Size", value: formatBytes(blob.size) },
          ],
        });
      }
      return out;
    });
  }

  function sendToWorkspace(i: number) {
    const r = results[i];
    if (r?.blob)
      addItem({ name: r.filename, mime: r.mime, blob: r.blob, sourceToolName: "Split PDF" });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <FileDropZone
          accept="application/pdf"
          files={files}
          onFiles={(nf) => setFiles(nf.map(makeSelectedFile))}
          onRemove={() => setFiles([])}
          hint="One PDF file"
        />
        <div className="rounded-xl border border-border bg-panel p-4">
          <TextField
            label="Page ranges (e.g. 1-3, 5, 8-10)"
            value={ranges}
            onChange={setRanges}
            rows={2}
            mono
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Each range becomes a separate output PDF. Use single numbers for individual pages.
          </p>
        </div>
        <ActionButton onClick={process} disabled={!files[0]} busy={busy}>
          Split PDF
        </ActionButton>
      </div>
      <div className="space-y-3">
        {error && <ErrorPanel message={error} onRestart={restart} />}
        {results.map((r, i) => (
          <ResultPanel
            key={i}
            result={r}
            tool={{ id: "pdf-split" } as never}
            onRestart={restart}
            onSendToWorkspace={() => sendToWorkspace(i)}
          />
        ))}
        {!error && results.length === 0 && (
          <EmptyState>Your split PDFs will appear here, one per range.</EmptyState>
        )}
      </div>
    </div>
  );
}
