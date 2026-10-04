import { useState } from "react";
import { ErrorPanel, ResultPanel, type ToolResult } from "../../site/result-panel";
import { useWorkspace } from "../../workspace/workspace-provider";
import { useToolState, ActionButton, EmptyState, TextField } from "../tool-primitives";

export function TextToPdfTool() {
  const [text, setText] = useState("");
  const [title, setTitle] = useState("Document");
  const { busy, error, results, run, restart } = useToolState();
  const { addItem } = useWorkspace();

  async function process() {
    if (!text.trim()) return;
    await run(async () => {
      const { PDFDocument, StandardFonts, PDFFont } = await import("pdf-lib");
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pageW = 612;
      const pageH = 792;
      const margin = 50;
      const maxWidth = pageW - margin * 2;
      const fontSize = 12;
      const lineHeight = fontSize * 1.4;

      // Word-wrap
      const paragraphs = text.split("\n");
      const lines: string[] = [];
      for (const para of paragraphs) {
        if (para.trim() === "") {
          lines.push("");
          continue;
        }
        const words = para.split(/\s+/);
        let current = "";
        for (const word of words) {
          const test = current ? current + " " + word : word;
          if (font.widthOfTextAtSize(test, fontSize) > maxWidth) {
            if (current) lines.push(current);
            current = word;
          } else {
            current = test;
          }
        }
        if (current) lines.push(current);
      }

      let page = doc.addPage([pageW, pageH]);
      let y = pageH - margin;
      page.drawText(title, { x: margin, y, size: 16, font });
      y -= lineHeight * 1.5;

      for (const line of lines) {
        if (y < margin) {
          page = doc.addPage([pageW, pageH]);
          y = pageH - margin;
        }
        page.drawText(line, { x: margin, y, size: fontSize, font });
        y -= lineHeight;
      }

      const data = await doc.save();
      const blob = new Blob([data], { type: "application/pdf" });
      return [
        {
          blob,
          filename: `${title.replace(/[^a-z0-9]/gi, "-").toLowerCase() || "document"}.pdf`,
          mime: "application/pdf",
          previewUrl: URL.createObjectURL(blob),
          measurements: [
            { label: "Pages", value: String(doc.getPageCount()) },
            { label: "Words", value: String(text.trim().split(/\s+/).length) },
          ],
        },
      ] as ToolResult[];
    });
  }

  function sendToWorkspace() {
    const r = results[0];
    if (r?.blob)
      addItem({ name: r.filename, mime: r.mime, blob: r.blob, sourceToolName: "Text to PDF" });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Document title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 h-9 w-full rounded-lg border border-input bg-surface px-3 text-sm text-foreground"
          />
        </div>
        <TextField
          label="Text content"
          value={text}
          onChange={setText}
          rows={10}
          placeholder="Paste or type your text here…"
        />
        <ActionButton onClick={process} disabled={!text.trim()} busy={busy}>
          Create PDF
        </ActionButton>
      </div>
      <div className="space-y-3">
        {error && <ErrorPanel message={error} onRestart={restart} />}
        {results.map((r, i) => (
          <ResultPanel
            key={i}
            result={r}
            tool={{ id: "text-to-pdf" } as never}
            onRestart={restart}
            onSendToWorkspace={i === 0 ? sendToWorkspace : undefined}
          />
        ))}
        {!error && results.length === 0 && (
          <EmptyState>Your generated PDF will appear here.</EmptyState>
        )}
      </div>
    </div>
  );
}
