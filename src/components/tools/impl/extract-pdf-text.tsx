import { useState } from "react";
import {
  FileDropZone,
  makeSelectedFile,
  formatBytes,
  type SelectedFile,
} from "../../site/file-drop-zone";
import { ErrorPanel, ResultPanel, type ToolResult } from "../../site/result-panel";
import { useWorkspace } from "../../workspace/workspace-provider";
import { useToolState, ActionButton, EmptyState } from "../tool-primitives";

export function ExtractPdfTextTool() {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const { busy, error, results, run, restart } = useToolState();
  const { addItem } = useWorkspace();

  async function process() {
    if (!files[0]) return;
    await run(async () => {
      const { getDocument } = await import("pdfjs-dist/build/pdf.mjs");
      const bytes = await files[0].file.arrayBuffer();
      const doc = await getDocument({ data: bytes }).promise;
      const pages: string[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        const text = content.items.map((it: any) => ("str" in it ? it.str : "")).join(" ");
        pages.push(`--- Page ${i} ---\n${text}`);
      }
      await doc.destroy();
      const full = pages.join("\n\n");
      const blob = new Blob([full], { type: "text/plain" });
      return [
        {
          text: full,
          blob,
          filename: files[0].file.name.replace(/\.pdf$/i, "") + ".txt",
          mime: "text/plain",
          measurements: [
            { label: "Pages", value: String(doc.numPages) },
            { label: "Characters", value: String(full.length) },
            { label: "Size", value: formatBytes(blob.size) },
          ],
          warnings:
            full.trim().length === 0
              ? [
                  "No embedded text found. This PDF may be a scanned image — it needs OCR to extract text.",
                ]
              : undefined,
        },
      ] as ToolResult[];
    });
  }

  function sendToWorkspace() {
    const r = results[0];
    if (r?.blob)
      addItem({ name: r.filename, mime: r.mime, blob: r.blob, sourceToolName: "Extract PDF Text" });
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
        <ActionButton onClick={process} disabled={!files[0]} busy={busy}>
          Extract text
        </ActionButton>
      </div>
      <div className="space-y-3">
        {error && <ErrorPanel message={error} onRestart={restart} />}
        {results.map((r, i) => (
          <ResultPanel
            key={i}
            result={r}
            tool={{ id: "pdf-extract-text" } as never}
            onRestart={restart}
            onSendToWorkspace={i === 0 ? sendToWorkspace : undefined}
          />
        ))}
        {!error && results.length === 0 && (
          <EmptyState>The extracted text will appear here as a downloadable TXT file.</EmptyState>
        )}
      </div>
    </div>
  );
}
