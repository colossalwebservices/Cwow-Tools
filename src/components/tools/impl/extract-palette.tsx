import { useState } from "react";
import { FileDropZone, makeSelectedFile, type SelectedFile } from "../../site/file-drop-zone";
import { ErrorPanel } from "../../site/result-panel";
import { loadImage } from "../../../lib/image-utils";
import { useToolState, ActionButton, EmptyState } from "../tool-primitives";
import { copyToClipboard } from "../../../lib/clipboard";

export function ExtractPaletteTool() {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const { busy, error, run, restart } = useToolState();

  async function process() {
    if (!files[0]) return;
    await run(async () => {
      const img = await loadImage(files[0].file);
      const canvas = document.createElement("canvas");
      const size = 100;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;
      const buckets = new Map<string, number>();
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i],
          g = data[i + 1],
          b = data[i + 2],
          a = data[i + 3];
        if (a < 128) continue;
        // quantize to 5-bit per channel
        const key = `${r >> 4},${g >> 4},${b >> 4}`;
        buckets.set(key, (buckets.get(key) ?? 0) + 1);
      }
      const sorted = [...buckets.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
      const hex = sorted.map(([,]) => "");
      const result = sorted.map(([key]) => {
        const [r, g, b] = key.split(",").map((n) => parseInt(n) * 16 + 8);
        return rgbToHex(r, g, b);
      });
      setColors(result);
      return [];
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
        <ActionButton onClick={process} disabled={!files[0]} busy={busy}>
          Extract palette
        </ActionButton>
      </div>
      <div className="space-y-3">
        {error && <ErrorPanel message={error} onRestart={restart} />}
        {colors.length > 0 && (
          <div className="rounded-xl border border-border bg-panel p-4">
            <h3 className="text-sm font-semibold text-foreground">Color palette</h3>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => copyToClipboard(c)}
                  className="group flex flex-col items-center gap-1 rounded-lg border border-border p-2 hover:bg-accent"
                >
                  <span className="h-12 w-full rounded-md" style={{ backgroundColor: c }} />
                  <span className="font-mono text-xs text-foreground">{c}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => copyToClipboard(colors.join("\n"))}
              className="mt-3 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
            >
              Copy all hex codes
            </button>
          </div>
        )}
        {!error && colors.length === 0 && (
          <EmptyState>Drop an image to extract its dominant colors.</EmptyState>
        )}
      </div>
    </div>
  );
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}
