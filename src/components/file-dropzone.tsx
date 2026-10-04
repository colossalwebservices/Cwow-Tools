import { useRef, useState, useCallback, useEffect, type DragEvent } from "react";
import { Upload, FileIcon, X } from "lucide-react";
import { useParams } from "@tanstack/react-router";
import { toast } from "sonner";
import { useWorkspace } from "../lib/workspace";
import { toolMap } from "../lib/registry";

interface FileDropzoneProps {
  accept?: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  label?: string;
  hint?: string;
}

export function FileDropzone({ accept, multiple, onFiles, label, hint }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onFilesRef = useRef(onFiles);
  onFilesRef.current = onFiles;
  const [dragging, setDragging] = useState(false);
  const consumedRef = useRef(false);
  const { consumePendingInput } = useWorkspace();

  // On a tool page, auto-populate from a result handed off by the previous
  // tool (via the workspace) instead of requiring a re-upload. No-op elsewhere.
  const params = useParams({ from: "/tools/$slug", strict: false });
  const slug = (params as { slug?: string }).slug;

  useEffect(() => {
    if (consumedRef.current || !slug) return;
    const tool = toolMap[slug];
    if (!tool) return;
    const pending = consumePendingInput(tool.id);
    if (!pending) return;
    consumedRef.current = true;
    const file = new File([pending.blob], pending.name, { type: pending.mime });
    onFilesRef.current([file]);
    toast.success(`Loaded from previous result`, { description: pending.name });
  }, [slug, consumePendingInput]);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      const files = Array.from(fileList);
      if (files.length) onFilesRef.current(multiple ? files : [files[0]]);
    },
    [multiple],
  );

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors focus-ring ${dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-accent/30"}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => handleFiles(e.target.files)}
        className="sr-only"
      />
      <Upload className="size-8 text-muted-foreground" />
      <p className="mt-3 text-sm font-medium text-foreground">
        {label ?? "Drop files here or click to browse"}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function FileChip({
  file,
  onRemove,
  extra,
}: {
  file: File;
  onRemove?: () => void;
  extra?: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
      <FileIcon className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatBytes(file.size)}
          {extra ? ` · ${extra}` : ""}
        </p>
      </div>
      {onRemove && (
        <button
          onClick={onRemove}
          className="rounded-md p-1 text-muted-foreground hover:text-destructive transition-colors focus-ring"
          aria-label="Remove file"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
}
