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

export function PdfToImagesTool() {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [asZip, setAsZip] = useState(true);
  const { busy, error, results, run, restart } = useToolState();
  const { addItem } = useWorkspace();

  async function process() {
    if (!files[0]) return;
    await run(async () => {
      const { getDocument } = await import("pdfjs-dist/build/pdf.mjs");
      const bytes = await files[0].file.arrayBuffer();
      const doc = await getDocument({ data: bytes }).promise;
      const images: Blob[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
        const blob = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error("Could not render page."))),
            "image/png",
          ),
        );
        images.push(blob);
      }
      await doc.destroy();

      if (asZip && images.length > 1) {
        const JSZip = (await import("jszip")).default;
        const zip = new JSZip();
        images.forEach((b, i) => zip.file(`page-${String(i + 1).padStart(3, "0")}.png`, b));
        const zipBlob = await zip.generateAsync({ type: "blob" });
        return [
          {
            blob: zipBlob,
            filename: files[0].file.name.replace(/\.pdf$/i, "") + "-pages.zip",
            mime: "application/zip",
            measurements: [
              { label: "Pages", value: String(images.length) },
              { label: "Size", value: formatBytes(zipBlob.size) },
            ],
          },
        ];
      }
      const first = images[0];
      return [
        {
          blob: first,
          filename: files[0].file.name.replace(/\.pdf$/i, "") + "-page-1.png",
          mime: "image/png",
          previewUrl: URL.createObjectURL(first),
          measurements: [
            { label: "Pages rendered", value: String(images.length) },
            { label: "Downloaded", value: "Page 1 (PNG)" },
          ],
          warnings:
            images.length > 1
              ? ["Only page 1 is shown here. Enable ZIP to download all pages."]
              : undefined,
        },
      ] as ToolResult[];
    });
  }

  function sendToWorkspace() {
    const r = results[0];
    if (r?.blob)
      addItem({ name: r.filename, mime: r.mime, blob: r.blob, sourceToolName: "PDF to Images" });
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
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={asZip}
            onChange={(e) => setAsZip(e.target.checked)}
            className="h-4 w-4 rounded"
          />
          Download all pages as ZIP
        </label>
        <ActionButton onClick={process} disabled={!files[0]} busy={busy}>
          Render pages
        </ActionButton>
      </div>
      <div className="space-y-3">
        {error && <ErrorPanel message={error} onRestart={restart} />}
        {results.map((r, i) => (
          <ResultPanel
            key={i}
            result={r}
            tool={{ id: "pdf-to-images" } as never}
            onRestart={restart}
            onSendToWorkspace={i === 0 ? sendToWorkspace : undefined}
          />
        ))}
        {!error && results.length === 0 && (
          <EmptyState>Rendered page images will appear here.</EmptyState>
        )}
      </div>
    </div>
  );
}
