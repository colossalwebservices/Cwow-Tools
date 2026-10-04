import { useRef, useState, type DragEvent } from "react";
import { Upload, X, FileIcon } from "lucide-react";
import { cn } from "../../lib/utils";

export interface SelectedFile {
  id: string;
  file: File;
  previewUrl?: string;
}

let fid = 0;

export function FileDropZone({
  accept,
  multiple = false,
  label = "Drop files here or click to browse",
  hint,
  files,
  onFiles,
  onRemove,
}: {
  accept?: string;
  multiple?: boolean;
  label?: string;
  hint?: string;
  files: SelectedFile[];
  onFiles: (newFiles: File[]) => void;
  onRemove: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length) onFiles(multiple ? dropped : [dropped[0]]);
  }

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length) onFiles(multiple ? selected : [selected.slice(-1)[0]]);
    e.target.value = "";
  }

  return (
    <div className="space-y-3">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border bg-surface hover:border-primary/40",
        )}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <Upload className="h-8 w-8 text-muted-foreground" />
        <p className="mt-3 text-sm font-medium text-foreground">{label}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleSelect}
          className="sr-only"
        />
      </div>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-panel px-3 py-2"
            >
              {f.previewUrl ? (
                <img src={f.previewUrl} alt="" className="h-10 w-10 rounded object-cover" />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                  <FileIcon className="h-4 w-4 text-muted-foreground" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{f.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(f.file.size)} · {f.file.type || "unknown"}
                </p>
              </div>
              <button
                onClick={() => onRemove(f.id)}
                className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label={`Remove ${f.file.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function makeSelectedFile(file: File): SelectedFile {
  fid += 1;
  const isImage = file.type.startsWith("image/");
  return {
    id: `f-${Date.now()}-${fid}`,
    file,
    previewUrl: isImage ? URL.createObjectURL(file) : undefined,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
