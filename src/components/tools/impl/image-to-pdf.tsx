import { useState } from "react";
import {
  FileDropZone,
  makeSelectedFile,
  formatBytes,
  type SelectedFile,
} from "../../site/file-drop-zone";
import { ResultPanel, ErrorPanel, type ToolResult } from "../../site/result-panel";
import { useWorkspace } from "../../workspace/workspace-provider";
import { loadImage } from "../../../lib/image-utils";
import { useToolState, ActionButton, EmptyState } from "../tool-primitives";

export function ImageToPdfTool() {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [pageSize, setPageSize] = useState<"fit" | "a4" | "letter">("fit");
  const { busy, error, results, run, restart } = useToolState();
  const { addItem } = useWorkspace();

  async function process() {
    if (files.length === 0) return;
    await run(async () => {
      const { PDFDocument, StandardFonts } = await import("pdf-lib");
      const doc = await PDFDocument.create();
      for (const sf of files) {
        const img = await loadImage(sf.file);
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext("2d")!.drawImage(img, 0, 0);
        const pngBytes = await new Promise<Uint8Array>((resolve, reject) =>
          canvas.toBlob(async (b) => {
            if (!b) return reject(new Error("Could not encode image."));
            resolve(new Uint8Array(await b.arrayBuffer()));
          }, "image/png"),
        );
        const embedded = await doc.embedPng(pngBytes);
        let w = embedded.width;
        let h = embedded.height;
        if (pageSize !== "fit") {
          const target = pageSize === "a4" ? [595.28, 841.89] : [612, 792];
          const scale = Math.min(target[0] / w, target[1] / h);
          w *= scale;
          h *= scale;
          const page = doc.addPage(target);
          page.drawImage(embedded, {
            x: (target[0] - w) / 2,
            y: (target[1] - h) / 2,
            width: w,
            height: h,
          });
        } else {
          doc.addPage([w, h]).drawImage(embedded, { x: 0, y: 0, width: w, height: h });
        }
      }
      const data = await doc.save();
      const blob = new Blob([data], { type: "application/pdf" });
      return [
        {
          blob,
          filename: "images.pdf",
          mime: "application/pdf",
          previewUrl: URL.createObjectURL(blob),
          measurements: [
            { label: "Pages", value: String(files.length) },
            { label: "Size", value: formatBytes(blob.size) },
          ],
        },
      ];
    });
  }

  function sendToWorkspace() {
    const r = results[0];
    if (r?.blob)
      addItem({ name: r.filename, mime: r.mime, blob: r.blob, sourceToolName: "Images to PDF" });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <FileDropZone
          accept="image/jpeg,image/png,image/webp"
          multiple
          files={files}
          onFiles={(nf) => setFiles((prev) => [...prev, ...nf.map(makeSelectedFile)])}
          onRemove={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
          hint="JPG, PNG, or WebP"
        />
        <div className="rounded-xl border border-border bg-panel p-4">
          <label className="text-xs font-medium text-muted-foreground">Page size</label>
          <div className="mt-2 flex gap-2">
            {(["fit", "a4", "letter"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setPageSize(s)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${pageSize === s ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-foreground"}`}
              >
                {s === "fit" ? "Fit to image" : s === "a4" ? "A4" : "Letter"}
              </button>
            ))}
          </div>
        </div>
        <ActionButton onClick={process} disabled={files.length === 0} busy={busy}>
          Create PDF from {files.length} {files.length === 1 ? "image" : "images"}
        </ActionButton>
      </div>
      <div className="space-y-3">
        {error && <ErrorPanel message={error} onRestart={restart} />}
        {results.map((r, i) => (
          <ResultPanel
            key={i}
            result={r}
            tool={{ id: "image-to-pdf" } as never}
            onRestart={restart}
            onSendToWorkspace={i === 0 ? sendToWorkspace : undefined}
          />
        ))}
        {!error && results.length === 0 && (
          <EmptyState>Your combined PDF will appear here.</EmptyState>
        )}
      </div>
    </div>
  );
}
