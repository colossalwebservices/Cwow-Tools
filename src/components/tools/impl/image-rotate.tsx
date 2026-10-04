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

export function ImageRotateTool() {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [rotation, setRotation] = useState(90);
  const [flip, setFlip] = useState<"none" | "h" | "v">("none");
  const [format, setFormat] = useState<ImageFormat | "auto">("auto");
  const { busy, error, results, run, restart } = useToolState();
  const { addItem } = useWorkspace();

  async function process() {
    await run(async () => {
      const out: ToolResult[] = [];
      for (const sf of files) {
        const img = await loadImage(sf.file);
        const swap = rotation === 90 || rotation === 270;
        const w = swap ? img.naturalHeight : img.naturalWidth;
        const h = swap ? img.naturalWidth : img.naturalHeight;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.translate(w / 2, h / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        if (flip === "h") ctx.scale(-1, 1);
        if (flip === "v") ctx.scale(1, -1);
        ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
        const outFormat: ImageFormat =
          format === "auto" ? (sf.file.type as ImageFormat) || "image/png" : format;
        const blob = await canvasToBlob(canvas, outFormat, 0.92);
        out.push({
          blob,
          filename: `${baseName(sf.file.name)}-rotated.${getExtForMime(outFormat)}`,
          mime: outFormat,
          previewUrl: URL.createObjectURL(blob),
          measurements: [
            { label: "Dimensions", value: `${w} × ${h}` },
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
      addItem({
        name: r.filename,
        mime: r.mime,
        blob: r.blob,
        sourceToolName: "Rotate Image",
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
          <label className="text-xs font-medium text-muted-foreground">Rotation</label>
          <div className="mt-2 flex gap-2">
            {[0, 90, 180, 270].map((r) => (
              <button
                key={r}
                onClick={() => setRotation(r)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${rotation === r ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-foreground"}`}
              >
                {r}°
              </button>
            ))}
          </div>
          <label className="mt-3 block text-xs font-medium text-muted-foreground">Flip</label>
          <div className="mt-2 flex gap-2">
            {(["none", "h", "v"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFlip(f)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${flip === f ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-foreground"}`}
              >
                {f === "none" ? "None" : f === "h" ? "Horizontal" : "Vertical"}
              </button>
            ))}
          </div>
          <div className="mt-3">
            <SelectField
              label="Output format"
              value={format}
              onChange={(v) => setFormat(v as ImageFormat | "auto")}
              options={[
                { value: "auto", label: "Keep original" },
                { value: "image/jpeg", label: "JPEG" },
                { value: "image/png", label: "PNG" },
                { value: "image/webp", label: "WebP" },
              ]}
            />
          </div>
        </div>
        <ActionButton onClick={process} disabled={files.length === 0} busy={busy}>
          Apply
        </ActionButton>
      </div>
      <div className="space-y-3">
        {error && <ErrorPanel message={error} onRestart={restart} />}
        {results.map((r, i) => (
          <ResultPanel
            key={i}
            result={r}
            tool={{ id: "image-rotate" } as never}
            onRestart={restart}
            onSendToWorkspace={i === 0 ? () => sendToWorkspace(i) : undefined}
          />
        ))}
        {!error && results.length === 0 && (
          <EmptyState>Your rotated image will appear here.</EmptyState>
        )}
      </div>
    </div>
  );
}
