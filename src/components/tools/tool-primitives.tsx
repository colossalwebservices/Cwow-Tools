import { useState, useCallback } from "react";
import type { ToolResult } from "../site/result-panel";

// Shared state hook for tool components: tracks busy, error, and results.
export function useToolState() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ToolResult[]>([]);

  const run = useCallback(async (fn: () => Promise<ToolResult[]>) => {
    setBusy(true);
    setError(null);
    try {
      const out = await fn();
      setResults(out);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong processing your input.");
    } finally {
      setBusy(false);
    }
  }, []);

  const restart = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return { busy, error, results, run, restart, setResults };
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="mt-1 h-9 w-full rounded-lg border border-input bg-surface px-3 text-sm text-foreground"
      />
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  mono = false,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  mono?: boolean;
}) {
  return (
    <div>
      {label && <label className="text-xs font-medium text-muted-foreground">{label}</label>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`mt-1 w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none ${
          mono ? "font-mono" : ""
        }`}
      />
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-9 w-full rounded-lg border border-input bg-surface px-2 text-sm text-foreground"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ActionButton({
  onClick,
  disabled,
  busy,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || busy}
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
    >
      {busy && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
      )}
      {children}
    </button>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
