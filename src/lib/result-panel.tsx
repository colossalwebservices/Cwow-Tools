// Result panel + download helpers shared across tool pages.
import { useState, type ReactNode } from "react";
import { Download, Copy, RotateCcw, Send, Check, ArrowRight } from "lucide-react";
import { Link, useParams } from "@tanstack/react-router";
import { useWorkspace } from "./workspace";
import { formatBytes } from "../components/file-dropzone";
import { suggestNextTools } from "./next-tools";
import { toolMap } from "./registry";

export interface ToolResult {
  blob?: Blob;
  text?: string;
  filename: string;
  mimeType: string;
  measurements?: { label: string; value: string }[];
  preview?: ReactNode;
  warnings?: string[];
  nextActions?: { label: string; toolSlug: string }[];
}

export function ResultPanel({
  result,
  onReset,
  toolId,
}: {
  result: ToolResult | null;
  onReset: () => void;
  toolId?: string;
}) {
  const { add, sendToTool } = useWorkspace();
  const [copied, setCopied] = useState(false);

  // Stage the current result as the input for the chosen next tool so its
  // FileDropzone auto-populates on mount — no re-upload required.
  const handoffTo = (toolId: string) => {
    const blob = result.blob ?? new Blob([result.text ?? ""], { type: result.mimeType });
    sendToTool({ blob, name: result.filename, mime: result.mimeType, targetToolId: toolId });
  };

  if (!result) {
    return (
      <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-center text-muted-foreground">
        <p className="text-sm">Your result will appear here.</p>
      </div>
    );
  }

  // Resolve the current tool from the explicit prop, or fall back to the
  // /tools/$slug route param so every tool page gets self-exclusion and the
  // related-tools fallback without threading the id through each call site.
  let currentToolId = toolId;
  if (!currentToolId) {
    try {
      const { slug } = useParams({ from: "/tools/$slug", strict: false });
      currentToolId = toolMap[slug as string]?.id;
    } catch {
      /* not on a tool route — no self-exclusion available */
    }
  }

  // Suggest compatible next tools from the actual output MIME type.
  const nextTools = suggestNextTools(result.mimeType, currentToolId, 6);
  const current = currentToolId ? toolMap[currentToolId] : undefined;
  const fallback = current?.related ?? [];
  const fallbackTools = fallback
    .map((id) => toolMap[id])
    .filter((t): t is NonNullable<typeof t> => Boolean(t))
    .slice(0, 4);
  const showNext = nextTools.length > 0;
  const nextActions = showNext ? nextTools : fallbackTools;

  const download = () => {
    const url = URL.createObjectURL(
      result.blob ?? new Blob([result.text ?? ""], { type: result.mimeType }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = result.filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const copy = () => {
    if (result.text) {
      navigator.clipboard.writeText(result.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const sendToWorkspace = () => {
    if (result.blob) {
      add({
        name: result.filename,
        mimeType: result.mimeType,
        size: result.blob.size,
        blob: result.blob,
        sourceTool: "result",
      });
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-foreground">Result</h3>
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors focus-ring rounded-md"
        >
          <RotateCcw className="size-3.5" /> Start over
        </button>
      </div>

      {result.preview && (
        <div className="mb-3 rounded-lg border border-border bg-background p-3 overflow-auto max-h-64">
          {result.preview}
        </div>
      )}

      {result.measurements && result.measurements.length > 0 && (
        <div className="mb-3 grid grid-cols-2 gap-2">
          {result.measurements.map((m, i) => (
            <div key={i} className="rounded-lg bg-surface px-3 py-2">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className="text-sm font-semibold text-foreground">{m.value}</p>
            </div>
          ))}
        </div>
      )}

      {result.warnings && result.warnings.length > 0 && (
        <div className="mb-3 space-y-1">
          {result.warnings.map((w, i) => (
            <p key={i} className="rounded-lg bg-cat-dev/10 px-3 py-2 text-xs text-cat-dev">
              ⚠ {w}
            </p>
          ))}
        </div>
      )}

      <div className="mt-auto flex flex-wrap gap-2">
        <button
          onClick={download}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors focus-ring"
        >
          <Download className="size-4" /> Download
        </button>
        {result.text && (
          <button
            onClick={copy}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors focus-ring"
          >
            {copied ? <Check className="size-4 text-cat-business" /> : <Copy className="size-4" />}{" "}
            Copy
          </button>
        )}
        {result.blob && (
          <button
            onClick={sendToWorkspace}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors focus-ring"
          >
            <Send className="size-4" /> Send to workspace
          </button>
        )}
      </div>
      {result.blob && (
        <p className="mt-2 text-xs text-muted-foreground">
          {result.filename} · {formatBytes(result.blob.size)}
        </p>
      )}

      {nextActions.length > 0 && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Send className="size-3" />
            {showNext ? "Send to next tool" : "Next step"}
          </p>
          <p className="mb-2 text-[11px] text-muted-foreground/80">
            {showNext
              ? `Compatible with ${result.mimeType} output.`
              : "Related tools you can use next."}
          </p>
          <div className="flex flex-wrap gap-2">
            {nextActions.map((r) => (
              <Link
                key={r.id}
                to="/tools/$slug"
                params={{ slug: r.slug }}
                onClick={() => handoffTo(r.id)}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-accent focus-ring"
              >
                {r.name} <ArrowRight className="size-3" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
