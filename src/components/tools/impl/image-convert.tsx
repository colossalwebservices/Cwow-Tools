import { useState } from "react";
import {
  FileDropZone,
  makeSelectedFile,
  formatBytes,
  type SelectedFile,
} from "../../site/file-drop-zone";
import { ResultPanel, ErrorPanel, type ToolResult } from "../../site/result-panel";
import { useWorkspace } from "../../workspace/workspace-provider";
import {
  loadImage,
  canvasToBlob,
  getExtForMime,
  baseName,
  type ImageFormat,
} from "../../../lib/image-utils";
import { useToolState, SelectField, ActionButton, EmptyState } from "../tool-primitives";

export function ImageConvertTool() {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [format, setFormat] = useState<ImageFormat>("image/png");
  const [bgColor, setBgColor] = useState("#ffffff");
  const { busy, error, results, run, restart } = useToolState();
  const { addItem } = useWorkspace();

  async function process() {
    await run(async () => {
      const out: ToolResult[] = [];
      for (const sf of files) {
        const img = await loadImage(sf.file);
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d")!;
        // Flatten transparency when converting to JPEG
        if (format === "image/jpeg") {
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);
        const blob = await canvasToBlob(canvas, format, 0.92);
        out.push({
          blob,
          filename: `${baseName(sf.file.name)}.${getExtForMime(format)}`,
          mime: format,
          previewUrl: URL.createObjectURL(blob),
          measurements: [
            { label: "Format", value: format.replace("image/", "").toUpperCase() },
            { label: "Size", value: formatBytes(blob.size) },
          ],
          warnings:
            format === "image/jpeg" && sf.file.type === "image/png"
              ? ["Transparency was flattened onto the chosen background color."]
              : undefined,
        });
      }
      return out;
    });
  }

  function sendToWorkspace(i: number) {
    const r = results[i];
    if (r?.blob)
      addItem({
        name: r.filename,
        mime: r.mime,
        blob: r.blob,
        sourceToolName: "Convert Image",
        preview: r.previewUrl,
      });
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
          <SelectField
            label="Convert to"
            value={format}
            onChange={(v) => setFormat(v as ImageFormat)}
            options={[
              { value: "image/jpeg", label: "JPEG" },
              { value: "image/png", label: "PNG" },
              { value: "image/webp", label: "WebP" },
            ]}
          />
          {format === "image/jpeg" && (
            <div className="mt-3">
              <label className="text-xs font-medium text-muted-foreground">
                Background (for transparent images)
              </label>
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-input bg-surface px-1"
              />
            </div>
          )}
        </div>
        <ActionButton onClick={process} disabled={files.length === 0} busy={busy}>
          Convert {files.length > 1 ? `${files.length} images` : "image"}
        </ActionButton>
      </div>
      <div className="space-y-3">
        {error && <ErrorPanel message={error} onRestart={restart} />}
        {results.map((r, i) => (
          <ResultPanel
            key={i}
            result={r}
            tool={{ id: "image-convert" } as never}
            onRestart={restart}
            onSendToWorkspace={i === 0 ? () => sendToWorkspace(i) : undefined}
          />
        ))}
        {!error && results.length === 0 && (
          <EmptyState>Your converted images will appear here.</EmptyState>
        )}
      </div>
    </div>
  );
}
