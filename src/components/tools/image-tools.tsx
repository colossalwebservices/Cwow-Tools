import { useState } from "react";
import { FileDropzone, FileChip, formatBytes } from "../file-dropzone";
import { ResultPanel, type ToolResult } from "../../lib/result-panel";
import {
  compressImage,
  convertImage,
  rotateImage,
  adjustImage,
  roundCorners,
  extractPalette,
  rgbToHex,
  type ImageFormat,
} from "../../lib/image-processors";
import { Loader2 } from "lucide-react";

function useImageState() {
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<ToolResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return { files, setFiles, result, setResult, loading, setLoading, error, setError };
}

function RunButton({
  onClick,
  loading,
  label,
  disabled,
}: {
  onClick: () => void;
  loading: boolean;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors focus-ring"
    >
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin" /> Processing…
        </>
      ) : (
        label
      )}
    </button>
  );
}

function FileList({ files, setFiles }: { files: File[]; setFiles: (f: File[]) => void }) {
  if (!files.length) return null;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {files.map((f, i) => (
          <FileChip key={i} file={f} onRemove={() => setFiles(files.filter((_, j) => j !== i))} />
        ))}
      </div>
      <button
        onClick={() => setFiles([])}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        Clear all
      </button>
    </div>
  );
}

const formatOpts: { value: ImageFormat; label: string }[] = [
  { value: "png", label: "PNG" },
  { value: "jpeg", label: "JPEG" },
  { value: "webp", label: "WebP" },
];

export function ImageCompressTool() {
  const s = useImageState();
  const [format, setFormat] = useState<ImageFormat>("jpeg");
  const [quality, setQuality] = useState(75);

  const run = async () => {
    if (!s.files.length) return;
    s.setLoading(true);
    s.setError(null);
    s.setResult(null);
    try {
      if (s.files.length === 1) {
        const { blob, width, height } = await compressImage(s.files[0], format, quality / 100);
        const saved = Math.max(0, s.files[0].size - blob.size);
        s.setResult({
          blob,
          filename: s.files[0].name.replace(/\.[^.]+$/, "") + `.${format}`,
          mimeType: `image/${format}`,
          measurements: [
            { label: "Original", value: formatBytes(s.files[0].size) },
            { label: "Compressed", value: formatBytes(blob.size) },
            {
              label: "Saved",
              value: saved > 0 ? `${Math.round((saved / s.files[0].size) * 100)}%` : "0%",
            },
            { label: "Dimensions", value: `${width}×${height}` },
          ],
          preview: (
            <img src={URL.createObjectURL(blob)} alt="Compressed" className="max-h-48 rounded-lg" />
          ),
        });
      } else {
        const JSZip = (await import("jszip")).default;
        const zip = new JSZip();
        for (const file of s.files) {
          const { blob } = await compressImage(file, format, quality / 100);
          zip.file(file.name.replace(/\.[^.]+$/, "") + `.${format}`, blob);
        }
        const zipBlob = await zip.generateAsync({ type: "blob" });
        s.setResult({
          blob: zipBlob,
          filename: "compressed-images.zip",
          mimeType: "application/zip",
          measurements: [
            { label: "Images", value: String(s.files.length) },
            { label: "ZIP size", value: formatBytes(zipBlob.size) },
          ],
        });
      }
    } catch (e) {
      s.setError((e as Error).message);
    } finally {
      s.setLoading(false);
    }
  };

  return (
    <div>
      {s.files.length === 0 ? (
        <FileDropzone accept="image/*" multiple onFiles={s.setFiles} hint="Batch supported" />
      ) : (
        <FileList files={s.files} setFiles={s.setFiles} />
      )}
      <div className="mt-4 space-y-3">
        <label className="block text-sm text-muted-foreground">
          Format
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as ImageFormat)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus-ring"
          >
            {formatOpts.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm text-muted-foreground">
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
      </div>
      {s.error && <p className="mt-3 text-sm text-destructive">{s.error}</p>}
      <RunButton
        onClick={run}
        loading={s.loading}
        label={`Compress ${s.files.length > 1 ? `${s.files.length} images` : "image"}`}
        disabled={!s.files.length}
      />
      {s.result && (
        <div className="mt-4">
          <ResultPanel
            result={s.result}
            onReset={() => {
              s.setResult(null);
              s.setFiles([]);
            }}
          />
        </div>
      )}
    </div>
  );
}

export function ImageConvertTool() {
  const s = useImageState();
  const [format, setFormat] = useState<ImageFormat>("webp");
  const [bg, setBg] = useState("#ffffff");

  const run = async () => {
    if (!s.files.length) return;
    s.setLoading(true);
    s.setError(null);
    try {
      if (s.files.length === 1) {
        const { blob, width, height } = await convertImage(
          s.files[0],
          format,
          0.92,
          format === "jpeg" ? bg : undefined,
        );
        s.setResult({
          blob,
          filename: s.files[0].name.replace(/\.[^.]+$/, "") + `.${format}`,
          mimeType: `image/${format}`,
          measurements: [
            { label: "Dimensions", value: `${width}×${height}` },
            { label: "Size", value: formatBytes(blob.size) },
          ],
          preview: (
            <img src={URL.createObjectURL(blob)} alt="Converted" className="max-h-48 rounded-lg" />
          ),
        });
      } else {
        const JSZip = (await import("jszip")).default;
        const zip = new JSZip();
        for (const file of s.files) {
          const { blob } = await convertImage(
            file,
            format,
            0.92,
            format === "jpeg" ? bg : undefined,
          );
          zip.file(file.name.replace(/\.[^.]+$/, "") + `.${format}`, blob);
        }
        const zipBlob = await zip.generateAsync({ type: "blob" });
        s.setResult({
          blob: zipBlob,
          filename: "converted-images.zip",
          mimeType: "application/zip",
          measurements: [{ label: "Images", value: String(s.files.length) }],
        });
      }
    } catch (e) {
      s.setError((e as Error).message);
    } finally {
      s.setLoading(false);
    }
  };

  return (
    <div>
      {s.files.length === 0 ? (
        <FileDropzone accept="image/*" multiple onFiles={s.setFiles} hint="Batch supported" />
      ) : (
        <FileList files={s.files} setFiles={s.setFiles} />
      )}
      <div className="mt-4 space-y-3">
        <label className="block text-sm text-muted-foreground">
          Convert to
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as ImageFormat)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus-ring"
          >
            {formatOpts.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        {format === "jpeg" && (
          <label className="block text-sm text-muted-foreground">
            Background (for transparency)
            <input
              type="color"
              value={bg}
              onChange={(e) => setBg(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-border bg-background"
            />
          </label>
        )}
      </div>
      {s.error && <p className="mt-3 text-sm text-destructive">{s.error}</p>}
      <RunButton
        onClick={run}
        loading={s.loading}
        label={`Convert ${s.files.length > 1 ? `${s.files.length} images` : "image"}`}
        disabled={!s.files.length}
      />
      {s.result && (
        <div className="mt-4">
          <ResultPanel
            result={s.result}
            onReset={() => {
              s.setResult(null);
              s.setFiles([]);
            }}
          />
        </div>
      )}
    </div>
  );
}

export function ImageRotateTool() {
  const s = useImageState();
  const [degrees, setDegrees] = useState<90 | 180 | 270>(90);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  const run = async () => {
    if (!s.files.length) return;
    s.setLoading(true);
    s.setError(null);
    try {
      if (s.files.length === 1) {
        const { blob, width, height } = await rotateImage(s.files[0], degrees, flipH, flipV);
        s.setResult({
          blob,
          filename: "rotated.png",
          mimeType: "image/png",
          measurements: [
            { label: "Dimensions", value: `${width}×${height}` },
            { label: "Size", value: formatBytes(blob.size) },
          ],
          preview: (
            <img src={URL.createObjectURL(blob)} alt="Rotated" className="max-h-48 rounded-lg" />
          ),
        });
      } else {
        const JSZip = (await import("jszip")).default;
        const zip = new JSZip();
        for (const file of s.files) {
          const { blob } = await rotateImage(file, degrees, flipH, flipV);
          zip.file(file.name.replace(/\.[^.]+$/, "") + ".png", blob);
        }
        const zipBlob = await zip.generateAsync({ type: "blob" });
        s.setResult({
          blob: zipBlob,
          filename: "rotated-images.zip",
          mimeType: "application/zip",
          measurements: [{ label: "Images", value: String(s.files.length) }],
        });
      }
    } catch (e) {
      s.setError((e as Error).message);
    } finally {
      s.setLoading(false);
    }
  };

  return (
    <div>
      {s.files.length === 0 ? (
        <FileDropzone accept="image/*" multiple onFiles={s.setFiles} hint="Batch supported" />
      ) : (
        <FileList files={s.files} setFiles={s.setFiles} />
      )}
      <div className="mt-4 space-y-3">
        <div className="flex gap-2">
          {([90, 180, 270] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDegrees(d)}
              className={`rounded-lg px-3 py-1.5 text-sm ${degrees === d ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`}
            >
              {d}°
            </button>
          ))}
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={flipH}
              onChange={(e) => setFlipH(e.target.checked)}
              className="accent-primary"
            />{" "}
            Flip horizontal
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={flipV}
              onChange={(e) => setFlipV(e.target.checked)}
              className="accent-primary"
            />{" "}
            Flip vertical
          </label>
        </div>
      </div>
      {s.error && <p className="mt-3 text-sm text-destructive">{s.error}</p>}
      <RunButton
        onClick={run}
        loading={s.loading}
        label="Rotate / flip"
        disabled={!s.files.length}
      />
      {s.result && (
        <div className="mt-4">
          <ResultPanel
            result={s.result}
            onReset={() => {
              s.setResult(null);
              s.setFiles([]);
            }}
          />
        </div>
      )}
    </div>
  );
}

export function ImageAdjustTool() {
  const s = useImageState();
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [grayscale, setGrayscale] = useState(false);

  const run = async () => {
    if (!s.files.length) return;
    s.setLoading(true);
    s.setError(null);
    try {
      const { blob, width, height } = await adjustImage(s.files[0], {
        brightness,
        contrast,
        saturation,
        grayscale,
      });
      s.setResult({
        blob,
        filename: "adjusted.png",
        mimeType: "image/png",
        measurements: [
          { label: "Dimensions", value: `${width}×${height}` },
          { label: "Size", value: formatBytes(blob.size) },
        ],
        preview: (
          <img src={URL.createObjectURL(blob)} alt="Adjusted" className="max-h-48 rounded-lg" />
        ),
      });
    } catch (e) {
      s.setError((e as Error).message);
    } finally {
      s.setLoading(false);
    }
  };

  return (
    <div>
      {s.files.length === 0 ? (
        <FileDropzone accept="image/*" onFiles={(f) => s.setFiles(f)} />
      ) : (
        <FileList files={s.files} setFiles={s.setFiles} />
      )}
      <div className="mt-4 space-y-3">
        <label className="block text-sm text-muted-foreground">
          Brightness ({brightness}%)
          <input
            type="range"
            min={0}
            max={200}
            value={brightness}
            onChange={(e) => setBrightness(+e.target.value)}
            className="mt-2 w-full accent-primary"
          />
        </label>
        <label className="block text-sm text-muted-foreground">
          Contrast ({contrast}%)
          <input
            type="range"
            min={0}
            max={200}
            value={contrast}
            onChange={(e) => setContrast(+e.target.value)}
            className="mt-2 w-full accent-primary"
          />
        </label>
        <label className="block text-sm text-muted-foreground">
          Saturation ({saturation}%)
          <input
            type="range"
            min={0}
            max={200}
            value={saturation}
            onChange={(e) => setSaturation(+e.target.value)}
            className="mt-2 w-full accent-primary"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={grayscale}
            onChange={(e) => setGrayscale(e.target.checked)}
            className="accent-primary"
          />{" "}
          Grayscale
        </label>
      </div>
      {s.error && <p className="mt-3 text-sm text-destructive">{s.error}</p>}
      <RunButton
        onClick={run}
        loading={s.loading}
        label="Adjust image"
        disabled={!s.files.length}
      />
      {s.result && (
        <div className="mt-4">
          <ResultPanel
            result={s.result}
            onReset={() => {
              s.setResult(null);
              s.setFiles([]);
            }}
          />
        </div>
      )}
    </div>
  );
}

export function ImageRoundedTool() {
  const s = useImageState();
  const [radius, setRadius] = useState(20);
  const [circular, setCircular] = useState(false);

  const run = async () => {
    if (!s.files.length) return;
    s.setLoading(true);
    s.setError(null);
    try {
      if (s.files.length === 1) {
        const { blob, width, height } = await roundCorners(s.files[0], circular ? -1 : radius);
        s.setResult({
          blob,
          filename: "rounded.png",
          mimeType: "image/png",
          measurements: [
            { label: "Dimensions", value: `${width}×${height}` },
            { label: "Size", value: formatBytes(blob.size) },
          ],
          preview: (
            <img
              src={URL.createObjectURL(blob)}
              alt="Rounded"
              className="max-h-48 rounded-lg"
              style={{
                background: "repeating-conic-gradient(#888 0 25%, #555 0 50%) 50% / 16px 16px",
              }}
            />
          ),
        });
      } else {
        const JSZip = (await import("jszip")).default;
        const zip = new JSZip();
        for (const file of s.files) {
          const { blob } = await roundCorners(file, circular ? -1 : radius);
          zip.file(file.name.replace(/\.[^.]+$/, "") + ".png", blob);
        }
        const zipBlob = await zip.generateAsync({ type: "blob" });
        s.setResult({
          blob: zipBlob,
          filename: "rounded-images.zip",
          mimeType: "application/zip",
          measurements: [{ label: "Images", value: String(s.files.length) }],
        });
      }
    } catch (e) {
      s.setError((e as Error).message);
    } finally {
      s.setLoading(false);
    }
  };

  return (
    <div>
      {s.files.length === 0 ? (
        <FileDropzone accept="image/*" multiple onFiles={s.setFiles} hint="Batch supported" />
      ) : (
        <FileList files={s.files} setFiles={s.setFiles} />
      )}
      <div className="mt-4 space-y-3">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={circular}
            onChange={(e) => setCircular(e.target.checked)}
            className="accent-primary"
          />{" "}
          Circular crop
        </label>
        {!circular && (
          <label className="block text-sm text-muted-foreground">
            Corner radius ({radius}px)
            <input
              type="range"
              min={0}
              max={200}
              value={radius}
              onChange={(e) => setRadius(+e.target.value)}
              className="mt-2 w-full accent-primary"
            />
          </label>
        )}
      </div>
      {s.error && <p className="mt-3 text-sm text-destructive">{s.error}</p>}
      <RunButton
        onClick={run}
        loading={s.loading}
        label="Round corners"
        disabled={!s.files.length}
      />
      {s.result && (
        <div className="mt-4">
          <ResultPanel
            result={s.result}
            onReset={() => {
              s.setResult(null);
              s.setFiles([]);
            }}
          />
        </div>
      )}
    </div>
  );
}

export function ImagePaletteTool() {
  const s = useImageState();
  const [count, setCount] = useState(6);

  const run = async () => {
    if (!s.files.length) return;
    s.setLoading(true);
    s.setError(null);
    try {
      const colors = await extractPalette(s.files[0], count);
      const text = colors.join("\n");
      s.setResult({
        text,
        filename: "palette.txt",
        mimeType: "text/plain",
        measurements: [{ label: "Colors", value: String(colors.length) }],
        preview: (
          <div className="flex flex-wrap gap-2">
            {colors.map((c, i) => (
              <div key={i} className="text-center">
                <div
                  className="size-16 rounded-lg border border-border"
                  style={{ backgroundColor: c }}
                />
                <p className="mt-1 text-xs font-mono text-muted-foreground">{c}</p>
              </div>
            ))}
          </div>
        ),
      });
    } catch (e) {
      s.setError((e as Error).message);
    } finally {
      s.setLoading(false);
    }
  };

  return (
    <div>
      {s.files.length === 0 ? (
        <FileDropzone accept="image/*" onFiles={(f) => s.setFiles(f)} />
      ) : (
        <FileList files={s.files} setFiles={s.setFiles} />
      )}
      <div className="mt-4">
        <label className="block text-sm text-muted-foreground">
          Number of colors ({count})
          <input
            type="range"
            min={3}
            max={12}
            value={count}
            onChange={(e) => setCount(+e.target.value)}
            className="mt-2 w-full accent-primary"
          />
        </label>
      </div>
      {s.error && <p className="mt-3 text-sm text-destructive">{s.error}</p>}
      <RunButton
        onClick={run}
        loading={s.loading}
        label="Extract palette"
        disabled={!s.files.length}
      />
      {s.result && (
        <div className="mt-4">
          <ResultPanel
            result={s.result}
            onReset={() => {
              s.setResult(null);
              s.setFiles([]);
            }}
          />
        </div>
      )}
    </div>
  );
}
