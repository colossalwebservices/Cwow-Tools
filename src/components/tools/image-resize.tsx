import { useState } from "react";
import { FileDropzone, FileChip, formatBytes } from "../file-dropzone";
import { ResultPanel, type ToolResult } from "../../lib/result-panel";
import { resizeImage, type ImageFormat } from "../../lib/image-processors";
import { Loader2 } from "lucide-react";

const formats: { value: ImageFormat; label: string }[] = [
  { value: "png", label: "PNG" },
  { value: "jpeg", label: "JPEG" },
  { value: "webp", label: "WebP" },
];

export function ImageResizeTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<ToolResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"dimensions" | "percent" | "maxEdge">("dimensions");
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [percent, setPercent] = useState(50);
  const [maxEdge, setMaxEdge] = useState(1000);
  const [format, setFormat] = useState<ImageFormat>("png");
  const [quality, setQuality] = useState(85);

  const run = async () => {
    if (!files.length) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      if (files.length === 1) {
        const opts =
          mode === "dimensions"
            ? { width, height, fit: "stretch" as const }
            : mode === "percent"
              ? { percent }
              : { maxEdge };
        const {
          blob,
          width: w,
          height: h,
        } = await resizeImage(files[0], opts, format, quality / 100);
        setResult({
          blob,
          filename: `resized-${w}x${h}.${format}`,
          mimeType: `image/${format}`,
          measurements: [
            { label: "Dimensions", value: `${w} × ${h}` },
            { label: "Size", value: formatBytes(blob.size) },
            { label: "Original", value: formatBytes(files[0].size) },
          ],
          preview: (
            <img src={URL.createObjectURL(blob)} alt="Resized" className="max-h-48 rounded-lg" />
          ),
        });
      } else {
        // batch — produce ZIP
        const JSZip = (await import("jszip")).default;
        const zip = new JSZip();
        for (const file of files) {
          const opts =
            mode === "dimensions"
              ? { width, height, fit: "stretch" as const }
              : mode === "percent"
                ? { percent }
                : { maxEdge };
          const { blob } = await resizeImage(file, opts, format, quality / 100);
          zip.file(file.name.replace(/\.[^.]+$/, "") + `.${format}`, blob);
        }
        const zipBlob = await zip.generateAsync({ type: "blob" });
        setResult({
          blob: zipBlob,
          filename: "resized-images.zip",
          mimeType: "application/zip",
          measurements: [
            { label: "Images", value: String(files.length) },
            { label: "ZIP size", value: formatBytes(zipBlob.size) },
          ],
        });
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {files.length === 0 ? (
        <FileDropzone
          accept="image/*"
          multiple
          onFiles={setFiles}
          hint="PNG, JPEG, WebP — batch supported"
        />
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {files.map((f, i) => (
              <FileChip
                key={i}
                file={f}
                onRemove={() => setFiles(files.filter((_, j) => j !== i))}
              />
            ))}
          </div>
          <button
            onClick={() => setFiles([])}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="mt-4 space-y-3">
        <div className="flex gap-2">
          {(["dimensions", "percent", "maxEdge"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${mode === m ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`}
            >
              {m === "dimensions" ? "Dimensions" : m === "percent" ? "Percent" : "Max edge"}
            </button>
          ))}
        </div>
        {mode === "dimensions" && (
          <div className="flex gap-2">
            <label className="flex-1 text-sm text-muted-foreground">
              Width{" "}
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(+e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus-ring"
              />
            </label>
            <label className="flex-1 text-sm text-muted-foreground">
              Height{" "}
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(+e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus-ring"
              />
            </label>
          </div>
        )}
        {mode === "percent" && (
          <label className="block text-sm text-muted-foreground">
            Percent{" "}
            <input
              type="number"
              value={percent}
              onChange={(e) => setPercent(+e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus-ring"
            />
          </label>
        )}
        {mode === "maxEdge" && (
          <label className="block text-sm text-muted-foreground">
            Max edge (px){" "}
            <input
              type="number"
              value={maxEdge}
              onChange={(e) => setMaxEdge(+e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus-ring"
            />
          </label>
        )}

        <div className="flex gap-2">
          <label className="flex-1 text-sm text-muted-foreground">
            Format
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as ImageFormat)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus-ring"
            >
              {formats.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          {format !== "png" && (
            <label className="flex-1 text-sm text-muted-foreground">
              Quality ({quality}%)
              <input
                type="range"
                min={10}
                max={100}
                value={quality}
                onChange={(e) => setQuality(+e.target.value)}
                className="mt-3 w-full accent-primary"
              />
            </label>
          )}
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      <button
        onClick={run}
        disabled={!files.length || loading}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors focus-ring"
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Resizing…
          </>
        ) : (
          `Resize ${files.length > 1 ? `${files.length} images` : "image"}`
        )}
      </button>
      {result && (
        <div className="mt-4">
          <ResultPanel
            result={result}
            onReset={() => {
              setResult(null);
              setFiles([]);
            }}
          />
        </div>
      )}
    </div>
  );
}
