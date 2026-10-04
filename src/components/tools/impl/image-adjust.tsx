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
import { useToolState, NumberField, ActionButton, EmptyState } from "../tool-primitives";

export function ImageAdjustTool() {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [grayscale, setGrayscale] = useState(false);
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
        const filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) ${grayscale ? "grayscale(100%)" : ""}`;
        ctx.filter = filter;
        ctx.drawImage(img, 0, 0);
        const outFormat: ImageFormat = sf.file.type === "image/png" ? "image/png" : "image/jpeg";
        const blob = await canvasToBlob(canvas, outFormat, 0.92);
        out.push({
          blob,
          filename: `${baseName(sf.file.name)}-adjusted.${getExtForMime(outFormat)}`,
          mime: outFormat,
          previewUrl: URL.createObjectURL(blob),
          measurements: [{ label: "Size", value: formatBytes(blob.size) }],
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
        sourceToolName: "Adjust Image",
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
        <div className="rounded-xl border border-border bg-panel p-4 space-y-3">
          <SliderField
            label="Brightness"
            value={brightness}
            onChange={setBrightness}
            min={0}
            max={200}
          />
          <SliderField label="Contrast" value={contrast} onChange={setContrast} min={0} max={200} />
          <SliderField
            label="Saturation"
            value={saturation}
            onChange={setSaturation}
            min={0}
            max={200}
          />
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={grayscale}
              onChange={(e) => setGrayscale(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            Grayscale
          </label>
        </div>
        <ActionButton onClick={process} disabled={files.length === 0} busy={busy}>
          Apply adjustments
        </ActionButton>
      </div>
      <div className="space-y-3">
        {error && <ErrorPanel message={error} onRestart={restart} />}
        {results.map((r, i) => (
          <ResultPanel
            key={i}
            result={r}
            tool={{ id: "image-adjust" } as never}
            onRestart={restart}
            onSendToWorkspace={i === 0 ? () => sendToWorkspace(i) : undefined}
          />
        ))}
        {!error && results.length === 0 && (
          <EmptyState>Your adjusted image will appear here.</EmptyState>
        )}
      </div>
    </div>
  );
}

function SliderField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground">{label}</label>
        <span className="text-xs text-foreground">{value}%</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-primary"
      />
    </div>
  );
}
