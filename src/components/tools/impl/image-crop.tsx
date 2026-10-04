import { useState, useRef, useEffect } from "react";
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

const RATIOS: { label: string; value: number | null }[] = [
  { label: "Free", value: null },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "16:9", value: 16 / 9 },
  { label: "3:2", value: 3 / 2 },
  { label: "9:16", value: 9 / 16 },
];

export function ImageCropTool() {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [ratio, setRatio] = useState<number | null>(1);
  const [format, setFormat] = useState<ImageFormat>("image/png");
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [imgDims, setImgDims] = useState({ w: 0, h: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ startX: number; startY: number } | null>(null);
  const { busy, error, results, run, restart } = useToolState();
  const { addItem } = useWorkspace();

  const current = files[0];

  useEffect(() => {
    if (!current) {
      setImgDims({ w: 0, h: 0 });
      setCrop({ x: 0, y: 0, w: 0, h: 0 });
      return;
    }
    loadImage(current.file)
      .then((img) => {
        setImgDims({ w: img.naturalWidth, h: img.naturalHeight });
        // default crop: centered square
        const size = Math.min(img.naturalWidth, img.naturalHeight);
        setCrop({
          x: Math.round((img.naturalWidth - size) / 2),
          y: Math.round((img.naturalHeight - size) / 2),
          w: size,
          h: size,
        });
      })
      .catch(() => {});
  }, [current]);

  function onCanvasDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = (e.clientX - rect.left) / rect.width;
    const sy = (e.clientY - rect.top) / rect.height;
    dragRef.current = { startX: sx * imgDims.w, startY: sy * imgDims.h };
  }
  function onCanvasMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!dragRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = (e.clientX - rect.left) / rect.width;
    const sy = (e.clientY - rect.top) / rect.height;
    const ex = sx * imgDims.w;
    const ey = sy * imgDims.h;
    let w = Math.abs(ex - dragRef.current.startX);
    let h = Math.abs(ey - dragRef.current.startY);
    const x = Math.min(dragRef.current.startX, ex);
    const y = Math.min(dragRef.current.startY, ey);
    if (ratio) {
      h = w / ratio;
    }
    setCrop({ x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) });
  }
  function onCanvasUp() {
    dragRef.current = null;
  }

  async function process() {
    if (!current || crop.w < 1 || crop.h < 1) return;
    await run(async () => {
      const img = await loadImage(current.file);
      const canvas = document.createElement("canvas");
      canvas.width = crop.w;
      canvas.height = crop.h;
      canvas.getContext("2d")!.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);
      const blob = await canvasToBlob(canvas, format, 0.92);
      return [
        {
          blob,
          filename: `${baseName(current.file.name)}-crop.${getExtForMime(format)}`,
          mime: format,
          previewUrl: URL.createObjectURL(blob),
          measurements: [
            { label: "Crop area", value: `${crop.w} × ${crop.h}` },
            { label: "Size", value: formatBytes(blob.size) },
          ],
        },
      ];
    });
  }

  function sendToWorkspace() {
    const r = results[0];
    if (r?.blob)
      addItem({
        name: r.filename,
        mime: r.mime,
        blob: r.blob,
        sourceToolName: "Crop Image",
        preview: r.previewUrl,
      });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <FileDropZone
          accept="image/jpeg,image/png,image/webp"
          files={files}
          onFiles={(nf) => setFiles(nf.map(makeSelectedFile))}
          onRemove={() => setFiles([])}
          hint="JPG, PNG, or WebP"
        />
        {current && imgDims.w > 0 && (
          <div className="rounded-xl border border-border bg-panel p-4">
            <canvas
              ref={canvasRef}
              width={imgDims.w}
              height={imgDims.h}
              onMouseDown={onCanvasDown}
              onMouseMove={onCanvasMove}
              onMouseUp={onCanvasUp}
              onMouseLeave={onCanvasUp}
              className="max-h-80 w-full rounded-lg border border-border bg-[repeating-conic-gradient(#1c1c29_0_25%,#14141d_0_50%)] bg-[length:16px_16px] cursor-crosshair"
              style={{ aspectRatio: `${imgDims.w}/${imgDims.h}` }}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {RATIOS.map((r) => (
                <button
                  key={r.label}
                  onClick={() => setRatio(r.value)}
                  className={`rounded-lg border px-2.5 py-1 text-xs ${ratio === r.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-foreground"}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Drag on the image to select the crop area. Current: {crop.w}×{crop.h}
            </p>
            <div className="mt-3">
              <SelectField
                label="Output format"
                value={format}
                onChange={(v) => setFormat(v as ImageFormat)}
                options={[
                  { value: "image/png", label: "PNG" },
                  { value: "image/jpeg", label: "JPEG" },
                  { value: "image/webp", label: "WebP" },
                ]}
              />
            </div>
          </div>
        )}
        <ActionButton onClick={process} disabled={!current || crop.w < 1} busy={busy}>
          Crop image
        </ActionButton>
      </div>
      <div className="space-y-3">
        {error && <ErrorPanel message={error} onRestart={restart} />}
        {results.map((r, i) => (
          <ResultPanel
            key={i}
            result={r}
            tool={{ id: "image-crop" } as never}
            onRestart={restart}
            onSendToWorkspace={i === 0 ? sendToWorkspace : undefined}
          />
        ))}
        {!error && results.length === 0 && (
          <EmptyState>Drag on the image to select a crop area.</EmptyState>
        )}
      </div>
    </div>
  );
}
