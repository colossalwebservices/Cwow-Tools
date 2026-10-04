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
import {
  useToolState,
  NumberField,
  SelectField,
  ActionButton,
  EmptyState,
} from "../tool-primitives";

export function ImageCompressTool() {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [quality, setQuality] = useState(75);
  const [format, setFormat] = useState<ImageFormat | "auto">("auto");
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
        canvas.getContext("2d")!.drawImage(img, 0, 0);
        const outFormat: ImageFormat =
          format === "auto"
            ? sf.file.type === "image/png"
              ? "image/png"
              : sf.file.type === "image/webp"
                ? "image/webp"
                : "image/jpeg"
            : format;
        const blob = await canvasToBlob(canvas, outFormat, quality / 100);
        const saved = sf.file.size - blob.size;
        out.push({
          blob,
          filename: `${baseName(sf.file.name)}-compressed.${getExtForMime(outFormat)}`,
          mime: outFormat,
          previewUrl: URL.createObjectURL(blob),
          measurements: [
            { label: "Original", value: formatBytes(sf.file.size) },
            { label: "Compressed", value: formatBytes(blob.size) },
            {
              label: "Saved",
              value: saved > 0 ? `${Math.round((saved / sf.file.size) * 100)}%` : "0%",
            },
          ],
          warnings:
            saved <= 0
              ? [
                  "This image could not be made smaller at the chosen quality. Try a lower quality setting.",
                ]
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
        sourceToolName: "Compress Image",
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
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Output format"
              value={format}
              onChange={(v) => setFormat(v as ImageFormat | "auto")}
              options={[
                { value: "auto", label: "Keep original" },
                { value: "image/jpeg", label: "JPEG" },
                { value: "image/webp", label: "WebP" },
              ]}
            />
            <NumberField
              label="Quality (1–100)"
              value={quality}
              onChange={setQuality}
              min={1}
              max={100}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Lower quality = smaller file. 75 is a good default for photos.
          </p>
        </div>
        <ActionButton onClick={process} disabled={files.length === 0} busy={busy}>
          Compress {files.length > 1 ? `${files.length} images` : "image"}
        </ActionButton>
      </div>
      <div className="space-y-3">
        {error && <ErrorPanel message={error} onRestart={restart} />}
        {results.map((r, i) => (
          <ResultPanel
            key={i}
            result={r}
            tool={{ id: "image-compress" } as never}
            onRestart={restart}
            onSendToWorkspace={i === 0 ? () => sendToWorkspace(i) : undefined}
          />
        ))}
        {!error && results.length === 0 && (
          <EmptyState>Your compressed images and size savings will appear here.</EmptyState>
        )}
      </div>
    </div>
  );
}
