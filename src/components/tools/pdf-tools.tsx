import { useState } from "react";
import { FileDropzone, FileChip, formatBytes } from "../file-dropzone";
import { ResultPanel, type ToolResult } from "../../lib/result-panel";
import { Loader2 } from "lucide-react";

function usePdfState() {
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

export function PdfMergeTool() {
  const s = usePdfState();
  const run = async () => {
    if (s.files.length < 2) {
      s.setError("Add at least 2 PDFs to merge.");
      return;
    }
    s.setLoading(true);
    s.setError(null);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const out = await PDFDocument.create();
      for (const file of s.files) {
        const bytes = await file.arrayBuffer();
        const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach((p) => out.addPage(p));
      }
      const blob = new Blob([await out.save()], { type: "application/pdf" });
      s.setResult({
        blob,
        filename: "merged.pdf",
        mimeType: "application/pdf",
        measurements: [
          { label: "Pages", value: String(out.getPageCount()) },
          { label: "Source files", value: String(s.files.length) },
          { label: "Size", value: formatBytes(blob.size) },
        ],
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
        <FileDropzone
          accept="application/pdf"
          multiple
          onFiles={s.setFiles}
          hint="Add 2 or more PDFs"
        />
      ) : (
        <FileList files={s.files} setFiles={s.setFiles} />
      )}
      {s.error && <p className="mt-3 text-sm text-destructive">{s.error}</p>}
      <RunButton onClick={run} loading={s.loading} label="Merge PDFs" disabled={!s.files.length} />
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

export function PdfSplitTool() {
  const s = usePdfState();
  const [ranges, setRanges] = useState("1-1");
  const run = async () => {
    if (!s.files.length) return;
    s.setLoading(true);
    s.setError(null);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const JSZip = (await import("jszip")).default;
      const bytes = await s.files[0].arrayBuffer();
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const total = src.getPageCount();
      const parsed = parseRanges(ranges, total);
      const zip = new JSZip();
      for (const [idx, range] of parsed.entries()) {
        const out = await PDFDocument.create();
        const pages = await out.copyPages(src, range);
        pages.forEach((p) => out.addPage(p));
        const blob = await out.save();
        zip.file(`split-${idx + 1}-pages-${range[0] + 1}-${range[range.length - 1] + 1}.pdf`, blob);
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });
      s.setResult({
        blob: zipBlob,
        filename: "split-pdfs.zip",
        mimeType: "application/zip",
        measurements: [
          { label: "Total pages", value: String(total) },
          { label: "Output files", value: String(parsed.length) },
          { label: "ZIP size", value: formatBytes(zipBlob.size) },
        ],
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
        <FileDropzone accept="application/pdf" onFiles={(f) => s.setFiles(f)} />
      ) : (
        <FileList files={s.files} setFiles={s.setFiles} />
      )}
      <div className="mt-4">
        <label className="block text-sm text-muted-foreground">
          Page ranges (e.g. 1-3, 5, 8-10)
          <input
            value={ranges}
            onChange={(e) => setRanges(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus-ring"
          />
        </label>
      </div>
      {s.error && <p className="mt-3 text-sm text-destructive">{s.error}</p>}
      <RunButton onClick={run} loading={s.loading} label="Split PDF" disabled={!s.files.length} />
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

export function PdfRotateTool() {
  const s = usePdfState();
  const [angle, setAngle] = useState<90 | 180 | 270>(90);
  const run = async () => {
    if (!s.files.length) return;
    s.setLoading(true);
    s.setError(null);
    try {
      const { PDFDocument, degrees } = await import("pdf-lib");
      const bytes = await s.files[0].arrayBuffer();
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      pdf.getPages().forEach((p) => p.setRotation(degrees((p.getRotation().angle + angle) % 360)));
      const blob = new Blob([await pdf.save()], { type: "application/pdf" });
      s.setResult({
        blob,
        filename: "rotated.pdf",
        mimeType: "application/pdf",
        measurements: [
          { label: "Pages", value: String(pdf.getPageCount()) },
          { label: "Rotation", value: `${angle}°` },
          { label: "Size", value: formatBytes(blob.size) },
        ],
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
        <FileDropzone accept="application/pdf" onFiles={(f) => s.setFiles(f)} />
      ) : (
        <FileList files={s.files} setFiles={s.setFiles} />
      )}
      <div className="mt-4 flex gap-2">
        {([90, 180, 270] as const).map((d) => (
          <button
            key={d}
            onClick={() => setAngle(d)}
            className={`rounded-lg px-3 py-1.5 text-sm ${angle === d ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`}
          >
            {d}°
          </button>
        ))}
      </div>
      {s.error && <p className="mt-3 text-sm text-destructive">{s.error}</p>}
      <RunButton onClick={run} loading={s.loading} label="Rotate PDF" disabled={!s.files.length} />
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

export function ImageToPdfTool() {
  const s = usePdfState();
  const run = async () => {
    if (!s.files.length) return;
    s.setLoading(true);
    s.setError(null);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const pdf = await PDFDocument.create();
      for (const file of s.files) {
        const bytes = await file.arrayBuffer();
        let img;
        if (file.type === "image/jpeg" || file.name.match(/\.jpe?g$/i))
          img = await pdf.embedJpg(bytes);
        else if (file.type === "image/png" || file.name.match(/\.png$/i))
          img = await pdf.embedPng(bytes);
        else {
          // convert via canvas
          const url = URL.createObjectURL(file);
          const image = new Image();
          await new Promise((res, rej) => {
            image.onload = res;
            image.onerror = rej;
            image.src = url;
          });
          const canvas = document.createElement("canvas");
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          canvas.getContext("2d")!.drawImage(image, 0, 0);
          const pngBytes = await new Promise<Uint8Array>((res) =>
            canvas.toBlob(
              (b) => b?.arrayBuffer().then((ab) => res(new Uint8Array(ab))),
              "image/png",
            ),
          );
          img = await pdf.embedPng(pngBytes);
          URL.revokeObjectURL(url);
        }
        const page = pdf.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      }
      const blob = new Blob([await pdf.save()], { type: "application/pdf" });
      s.setResult({
        blob,
        filename: "images.pdf",
        mimeType: "application/pdf",
        measurements: [
          { label: "Pages", value: String(pdf.getPageCount()) },
          { label: "Images", value: String(s.files.length) },
          { label: "Size", value: formatBytes(blob.size) },
        ],
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
        <FileDropzone accept="image/*" multiple onFiles={s.setFiles} hint="JPG, PNG, WebP" />
      ) : (
        <FileList files={s.files} setFiles={s.setFiles} />
      )}
      {s.error && <p className="mt-3 text-sm text-destructive">{s.error}</p>}
      <RunButton onClick={run} loading={s.loading} label="Create PDF" disabled={!s.files.length} />
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

export function TextToPdfTool() {
  const [text, setText] = useState("");
  const s = usePdfState();
  const run = async () => {
    if (!text.trim()) {
      s.setError("Enter some text first.");
      return;
    }
    s.setLoading(true);
    s.setError(null);
    try {
      const { PDFDocument, StandardFonts } = await import("pdf-lib");
      const pdf = await PDFDocument.create();
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const fontSize = 11;
      const margin = 50;
      const pageW = 595,
        pageH = 842; // A4
      const maxWidth = pageW - margin * 2;
      const lines = wrapText(text, font, fontSize, maxWidth);
      let page = pdf.addPage([pageW, pageH]);
      let y = pageH - margin;
      for (const line of lines) {
        if (y < margin) {
          page = pdf.addPage([pageW, pageH]);
          y = pageH - margin;
        }
        page.drawText(line, { x: margin, y, size: fontSize, font });
        y -= fontSize + 4;
      }
      const blob = new Blob([await pdf.save()], { type: "application/pdf" });
      s.setResult({
        blob,
        filename: "text.pdf",
        mimeType: "application/pdf",
        measurements: [
          { label: "Pages", value: String(pdf.getPageCount()) },
          { label: "Characters", value: String(text.length) },
        ],
      });
    } catch (e) {
      s.setError((e as Error).message);
    } finally {
      s.setLoading(false);
    }
  };
  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your text here…"
        className="min-h-[200px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-ring resize-y"
      />
      <p className="mt-1 text-xs text-muted-foreground">{text.length} characters</p>
      {s.error && <p className="mt-3 text-sm text-destructive">{s.error}</p>}
      <RunButton onClick={run} loading={s.loading} label="Create PDF" disabled={!text.trim()} />
      {s.result && (
        <div className="mt-4">
          <ResultPanel
            result={s.result}
            onReset={() => {
              s.setResult(null);
              setText("");
            }}
          />
        </div>
      )}
    </div>
  );
}

function wrapText(
  text: string,
  font: { widthOfText: (s: string, n: number) => number },
  fontSize: number,
  maxWidth: number,
): string[] {
  const out: string[] = [];
  for (const paragraph of text.split("\n")) {
    if (!paragraph) {
      out.push("");
      continue;
    }
    const words = paragraph.split(/\s+/);
    let line = "";
    for (const word of words) {
      const test = line ? line + " " + word : word;
      if (font.widthOfText(test, fontSize) > maxWidth && line) {
        out.push(line);
        line = word;
      } else line = test;
    }
    if (line) out.push(line);
  }
  return out;
}

function parseRanges(input: string, total: number): number[][] {
  const parts = input
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const result: number[][] = [];
  for (const part of parts) {
    if (part.includes("-")) {
      const [a, b] = part.split("-").map((n) => parseInt(n, 10));
      if (!isNaN(a) && !isNaN(b)) {
        const start = Math.max(0, a - 1),
          end = Math.min(total, b);
        result.push(Array.from({ length: end - start }, (_, i) => start + i));
      }
    } else {
      const n = parseInt(part, 10);
      if (!isNaN(n) && n >= 1 && n <= total) result.push([n - 1]);
    }
  }
  return result;
}
