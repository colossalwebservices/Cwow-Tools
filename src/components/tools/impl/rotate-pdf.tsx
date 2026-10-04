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

export function RotatePdfTool() {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [rotation, setRotation] = useState(90);
  const { busy, error, results, run, restart } = useToolState();
  const { addItem } = useWorkspace();

  async function process() {
    if (!files[0]) return;
    await run(async () => {
      const { degrees } = await import("pdf-lib");
      const { PDFDocument } = await import("pdf-lib");
      const bytes = await files[0].file.arrayBuffer();
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const pages = doc.getPages();
      pages.forEach((p) => {
        const current = p.getRotation().angle;
        p.setRotation(degrees((current + rotation) % 360));
      });
      const data = await doc.save();
      const blob = new Blob([data], { type: "application/pdf" });
      return [
        {
          blob,
          filename: files[0].file.name.replace(/\.pdf$/i, "") + "-rotated.pdf",
          mime: "application/pdf",
          previewUrl: URL.createObjectURL(blob),
          measurements: [
            { label: "Pages", value: String(pages.length) },
            { label: "Rotation", value: `${rotation}°` },
            { label: "Size", value: formatBytes(blob.size) },
          ],
        },
      ];
    });
  }

  function sendToWorkspace() {
    const r = results[0];
    if (r?.blob)
      addItem({ name: r.filename, mime: r.mime, blob: r.blob, sourceToolName: "Rotate PDF" });
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
          <label className="text-xs font-medium text-muted-foreground">Rotation</label>
          <div className="mt-2 flex gap-2">
            {[90, 180, 270].map((r) => (
              <button
                key={r}
                onClick={() => setRotation(r)}
                className={`rounded-lg border px-4 py-1.5 text-sm font-medium ${rotation === r ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-foreground"}`}
              >
                {r}°
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Rotates all pages in the document.</p>
        </div>
        <ActionButton onClick={process} disabled={!files[0]} busy={busy}>
          Rotate PDF
        </ActionButton>
      </div>
      <div className="space-y-3">
        {error && <ErrorPanel message={error} onRestart={restart} />}
        {results.map((r, i) => (
          <ResultPanel
            key={i}
            result={r}
            tool={{ id: "pdf-rotate" } as never}
            onRestart={restart}
            onSendToWorkspace={i === 0 ? sendToWorkspace : undefined}
          />
        ))}
        {!error && results.length === 0 && (
          <EmptyState>Your rotated PDF will appear here.</EmptyState>
        )}
      </div>
    </div>
  );
}
