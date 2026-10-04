import { createFileRoute } from "@tanstack/react-router";
import { Layers, Download, X, Send } from "lucide-react";
import { useWorkspace } from "../lib/workspace";
import { formatBytes } from "../components/file-dropzone";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/workspace")({
  head: () => ({
    meta: [
      { title: "Workspace — C Wow" },
      {
        name: "description",
        content:
          "Your session workspace holds current inputs and outputs so you can continue into the next task without reuploading.",
      },
      { property: "og:title", content: "Workspace — C Wow" },
      { property: "og:description", content: "Your session workspace for connected workflows." },
    ],
  }),
  component: WorkspacePage,
});

function WorkspacePage() {
  const { items, remove, clear, count } = useWorkspace();

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Layers className="size-7 text-primary" /> Workspace
          </h1>
          <p className="mt-1 text-muted-foreground">
            {count} item{count !== 1 ? "s" : ""} in this session.
          </p>
        </div>
        {count > 0 && (
          <button
            onClick={clear}
            className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-destructive transition-colors focus-ring"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        <p>
          The workspace holds your current inputs and outputs in memory so you can run compatible
          tools in sequence without reuploading. Refreshing or closing this tab discards unsaved
          files — nothing is stored on a server.
        </p>
      </div>

      {count === 0 ? (
        <div className="mt-12 text-center">
          <Layers className="mx-auto size-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">Your workspace is empty.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Run any tool and use "Send to workspace" to keep its result here.
          </p>
          <Link
            to="/tools"
            className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors focus-ring"
          >
            Browse tools
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.mimeType} · {formatBytes(item.size)}
                  </p>
                  {item.sourceTool && (
                    <p className="mt-1 text-xs text-primary">From: {item.sourceTool}</p>
                  )}
                </div>
                <button
                  onClick={() => remove(item.id)}
                  className="rounded-md p-1 text-muted-foreground hover:text-destructive transition-colors focus-ring"
                  aria-label="Remove"
                >
                  <X className="size-4" />
                </button>
              </div>
              {item.mimeType.startsWith("image/") && (
                <img src={item.url} alt={item.name} className="mt-3 max-h-32 rounded-lg" />
              )}
              <div className="mt-3 flex gap-2">
                <a
                  href={item.url}
                  download={item.name}
                  className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors focus-ring"
                >
                  <Download className="size-3.5" /> Download
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
