import { useState } from "react";
import {
  FileDropZone,
  makeSelectedFile,
  formatBytes,
  type SelectedFile,
} from "../../site/file-drop-zone";
import { ResultPanel, ErrorPanel, type ToolResult } from "../../site/result-panel";
import { useWorkspace } from "../../workspace/workspace-provider";
import { loadImage, canvasToBlob, baseName } from "../../../lib/image-utils";
import { useToolState, NumberField, ActionButton, EmptyState } from "../tool-primitives";

export function ImageRoundCornersTool() {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [radius, setRadius] = useState(40);
  const [circle, setCircle] = useState(false);
  const { busy, error, results, run, restart } = useToolState();
  const { addItem } = useWorkspace();

  async function process() {
    await run(async () => {
      const out: ToolResult[] = [];
      for (const sf of files) {
        const img = await loadImage(sf.file);
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.clearRect(0, 0, w, h);
        ctx.save();
        if (circle) {
          ctx.beginPath();
          ctx.arc(w / 2, h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
        } else {
          const r = Math.min(radius, Math.min(w, h) / 2);
          roundRect(ctx, 0, 0, w, h, r);
          ctx.clip();
        }
        ctx.drawImage(img, 0, 0);
        ctx.restore();
        const blob = await canvasToBlob(canvas, "image/png");
        out.push({
          blob,
          filename: `${baseName(sf.file.name)}-rounded.png`,
          mime: "image/png",
          previewUrl: URL.createObjectURL(blob),
          measurements: [
            { label: "Size", value: formatBytes(blob.size) },
            { label: "Transparency", value: "Yes (PNG)" },
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
        sourceToolName: "Round Corners",
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
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={circle}
              onChange={(e) => setCircle(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            Circle crop
          </label>
          {!circle && (
            <div className="mt-3">
              <NumberField label="Corner radius (px)" value={radius} onChange={setRadius} min={0} />
            </div>
          )}
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
            tool={{ id: "image-round-corners" } as never}
            onRestart={restart}
            onSendToWorkspace={i === 0 ? () => sendToWorkspace(i) : undefined}
          />
        ))}
        {!error && results.length === 0 && (
          <EmptyState>Your image with rounded corners or circle crop will appear here.</EmptyState>
        )}
      </div>
    </div>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
