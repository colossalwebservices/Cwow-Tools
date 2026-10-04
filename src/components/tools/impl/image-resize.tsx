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
  computeResize,
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

type Mode = "dimensions" | "percent" | "maxEdge";

export function ImageResizeTool() {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [mode, setMode] = useState<Mode>("maxEdge");
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [percent, setPercent] = useState(50);
  const [maxEdge, setMaxEdge] = useState(1600);
  const [format, setFormat] = useState<ImageFormat>("image/jpeg");
  const [quality, setQuality] = useState(85);
  const { busy, error, results, run, restart } = useToolState();
  const { addItem } = useWorkspace();

  async function process() {
    await run(async () => {
      const out: ToolResult[] = [];
      for (const sf of files) {
        const img = await loadImage(sf.file);
        const { width: w, height: h } = computeResize(img.naturalWidth, img.naturalHeight, {
          mode,
          width,
          height,
          percent,
          maxEdge,
        });
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, w, h);
        const blob = await canvasToBlob(canvas, format, quality / 100);
        out.push({
          blob,
          filename: `${baseName(sf.file.name)}-${w}x${h}.${getExtForMime(format)}`,
          mime: format,
          previewUrl: URL.createObjectURL(blob),
          measurements: [
            { label: "Dimensions", value: `${w} × ${h}` },
            { label: "Size", value: formatBytes(blob.size) },
            { label: "Original", value: formatBytes(sf.file.size) },
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
        sourceToolName: "Resize Image",
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
          <label className="text-xs font-medium text-muted-foreground">Resize mode</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["maxEdge", "dimensions", "percent"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${mode === m ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-foreground"}`}
              >
                {m === "maxEdge" ? "Max edge" : m === "dimensions" ? "Dimensions" : "Percent"}
              </button>
            ))}
          </div>
          {mode === "maxEdge" && (
            <div className="mt-3">
              <NumberField label="Maximum edge (px)" value={maxEdge} onChange={setMaxEdge} />
            </div>
          )}
          {mode === "dimensions" && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <NumberField label="Width (px)" value={width} onChange={setWidth} />
              <NumberField label="Height (px)" value={height} onChange={setHeight} />
            </div>
          )}
          {mode === "percent" && (
            <div className="mt-3">
              <NumberField label="Percent (%)" value={percent} onChange={setPercent} />
            </div>
          )}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <SelectField
              label="Output format"
              value={format}
              onChange={(v) => setFormat(v as ImageFormat)}
              options={[
                { value: "image/jpeg", label: "JPEG" },
                { value: "image/png", label: "PNG" },
                { value: "image/webp", label: "WebP" },
              ]}
            />
            <NumberField label="Quality (1–100)" value={quality} onChange={setQuality} />
          </div>
        </div>
        <ActionButton onClick={process} disabled={files.length === 0} busy={busy}>
          Resize {files.length > 1 ? `${files.length} images` : "image"}
        </ActionButton>
      </div>
      <div className="space-y-3">
        {error && <ErrorPanel message={error} onRestart={restart} />}
        {results.map((r, i) => (
          <ResultPanel
            key={i}
            result={r}
            tool={{ id: "image-resize" } as never}
            onRestart={restart}
            onSendToWorkspace={i === 0 ? () => sendToWorkspace(i) : undefined}
          />
        ))}
        {!error && results.length === 0 && (
          <EmptyState>Your resized images will appear here.</EmptyState>
        )}
      </div>
    </div>
  );
}
