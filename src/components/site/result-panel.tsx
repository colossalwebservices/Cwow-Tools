import { Download, Copy, RotateCcw, ArrowRight, Trash2, Send } from "lucide-react";
import { toast } from "sonner";
import type { ToolDefinition } from "../../lib/tools";
import { relatedTools, suggestNextTools } from "../../lib/tools";
import { Link } from "@tanstack/react-router";

export interface ToolResult {
  blob?: Blob;
  text?: string;
  filename: string;
  mime: string;
  measurements?: { label: string; value: string }[];
  warnings?: string[];
  previewUrl?: string;
}

export function ResultPanel({
  result,
  onRestart,
  onSendToWorkspace,
  tool,
}: {
  result: ToolResult;
  onRestart: () => void;
  onSendToWorkspace?: () => void;
  tool: ToolDefinition;
}) {
  const related = relatedTools(tool).slice(0, 4);
  // Suggest compatible next tools based on the actual output MIME type.
  // Falls back to the tool's static related list when no MIME match exists.
  const nextTools = suggestNextTools(result.mime, tool.id, 6);
  const nextActions = nextTools.length > 0 ? nextTools : related;

  function download() {
    if (!result.blob && result.text === undefined) return;
    const blob = result.blob ?? new Blob([result.text ?? ""], { type: result.mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function copyText() {
    if (result.text === undefined) return;
    try {
      await navigator.clipboard.writeText(result.text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }

  return (
    <div className="rounded-xl border border-border bg-panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Result</h3>
        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
          Done
        </span>
      </div>

      {result.previewUrl && (
        <div className="mb-3 overflow-hidden rounded-lg border border-border bg-surface">
          <img src={result.previewUrl} alt="Preview" className="max-h-64 w-full object-contain" />
        </div>
      )}

      {result.measurements && result.measurements.length > 0 && (
        <dl className="mb-3 grid grid-cols-2 gap-2">
          {result.measurements.map((m) => (
            <div key={m.label} className="rounded-lg bg-surface px-3 py-2">
              <dt className="text-[11px] text-muted-foreground">{m.label}</dt>
              <dd className="text-sm font-semibold text-foreground">{m.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {result.warnings && result.warnings.length > 0 && (
        <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2">
          {result.warnings.map((w, i) => (
            <p key={i} className="text-xs text-amber-600 dark:text-amber-400">
              {w}
            </p>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={download}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Download className="h-4 w-4" /> Download
        </button>
        {result.text !== undefined && (
          <button
            onClick={copyText}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <Copy className="h-4 w-4" /> Copy
          </button>
        )}
        {onSendToWorkspace && (
          <button
            onClick={onSendToWorkspace}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <ArrowRight className="h-4 w-4" /> Send to workspace
          </button>
        )}
        <button
          onClick={onRestart}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          <RotateCcw className="h-4 w-4" /> Start over
        </button>
      </div>

      {nextActions.length > 0 && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Send className="h-3 w-3" />
            {nextTools.length > 0 ? "Send to next tool" : "Next step"}
          </p>
          <p className="mb-2 text-[11px] text-muted-foreground/80">
            {nextTools.length > 0
              ? `Compatible with ${result.mime} output.`
              : "Related tools you can use next."}
          </p>
          <div className="flex flex-wrap gap-2">
            {nextActions.map((r) => (
              <Link
                key={r.id}
                to="/tools/$slug"
                params={{ slug: r.slug }}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-accent"
              >
                {r.name} <ArrowRight className="h-3 w-3" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ErrorPanel({ message, onRestart }: { message: string; onRestart: () => void }) {
  return (
    <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4">
      <div className="flex items-start gap-2">
        <Trash2 className="mt-0.5 h-4 w-4 text-destructive" />
        <div className="flex-1">
          <p className="text-sm font-medium text-destructive">{message}</p>
          <button
            onClick={onRestart}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Try again
          </button>
        </div>
      </div>
    </div>
  );
}
