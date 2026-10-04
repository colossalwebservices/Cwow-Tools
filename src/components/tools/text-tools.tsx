import { useState } from "react";
import { ResultPanel, type ToolResult } from "../../lib/result-panel";
import { Loader2 } from "lucide-react";

function useTextState() {
  const [result, setResult] = useState<ToolResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return { result, setResult, loading, setLoading, error, setError };
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

export function WordCountTool() {
  const [text, setText] = useState("");
  const s = useTextState();
  const stats = (() => {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const sentences = text.trim() ? (text.match(/[.!?]+/g) || []).length || 1 : 0;
    const lines = text ? text.split("\n").length : 0;
    const readingTime = Math.max(1, Math.round(words / 200));
    return { words, chars, sentences, lines, readingTime };
  })();
  const run = () => {
    s.setLoading(true);
    const report = `Words: ${stats.words}\nCharacters: ${stats.chars}\nSentences: ${stats.sentences}\nLines: ${stats.lines}\nReading time: ~${stats.readingTime} min`;
    s.setResult({
      text: report,
      filename: "word-count.txt",
      mimeType: "text/plain",
      measurements: [
        { label: "Words", value: String(stats.words) },
        { label: "Characters", value: String(stats.chars) },
        { label: "Sentences", value: String(stats.sentences) },
        { label: "Lines", value: String(stats.lines) },
        { label: "Reading time", value: `~${stats.readingTime} min` },
      ],
    });
    s.setLoading(false);
  };
  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste text to analyze…"
        className="min-h-[160px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-ring resize-y"
      />
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
        {[
          { l: "Words", v: stats.words },
          { l: "Chars", v: stats.chars },
          { l: "Sentences", v: stats.sentences },
          { l: "Lines", v: stats.lines },
          { l: "Read time", v: `${stats.readingTime}m` },
        ].map((m) => (
          <div key={m.l} className="rounded-lg bg-surface px-2 py-2 text-center">
            <p className="text-xs text-muted-foreground">{m.l}</p>
            <p className="text-sm font-semibold text-foreground">{m.v}</p>
          </div>
        ))}
      </div>
      <RunButton onClick={run} loading={s.loading} label="Download report" disabled={!text} />
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

export function CaseConvertTool() {
  const [text, setText] = useState("");
  const s = useTextState();
  const convert = (mode: string) => {
    let out = text;
    switch (mode) {
      case "upper":
        out = text.toUpperCase();
        break;
      case "lower":
        out = text.toLowerCase();
        break;
      case "title":
        out = text.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
        break;
      case "camel":
        out = text
          .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
          .replace(/^./, (c) => c.toLowerCase());
        break;
      case "snake":
        out = text
          .replace(/([a-z])([A-Z])/g, "$1_$2")
          .replace(/[^a-zA-Z0-9]+/g, "_")
          .toLowerCase();
        break;
      case "kebab":
        out = text
          .replace(/([a-z])([A-Z])/g, "$1-$2")
          .replace(/[^a-zA-Z0-9]+/g, "-")
          .toLowerCase();
        break;
      case "sentence":
        out = text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
        break;
    }
    s.setResult({
      text: out,
      filename: "converted.txt",
      mimeType: "text/plain",
      preview: (
        <pre className="whitespace-pre-wrap text-sm text-foreground">{out.slice(0, 2000)}</pre>
      ),
    });
  };
  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text…"
        className="min-h-[140px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-ring resize-y"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {["upper", "lower", "title", "sentence", "camel", "snake", "kebab"].map((m) => (
          <button
            key={m}
            onClick={() => convert(m)}
            disabled={!text}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground hover:border-primary/40 disabled:opacity-50 transition-colors focus-ring"
          >
            {m}
          </button>
        ))}
      </div>
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

export function TextCleanTool() {
  const [text, setText] = useState("");
  const [dedupe, setDedupe] = useState(true);
  const [trim, setTrim] = useState(true);
  const [sort, setSort] = useState(false);
  const s = useTextState();
  const run = () => {
    let lines = text.split("\n");
    if (trim) lines = lines.map((l) => l.trim());
    if (dedupe) {
      const seen = new Set<string>();
      lines = lines.filter((l) => {
        if (seen.has(l)) return false;
        seen.add(l);
        return true;
      });
    }
    if (sort) lines.sort();
    const out = lines.join("\n");
    s.setResult({
      text: out,
      filename: "cleaned.txt",
      mimeType: "text/plain",
      measurements: [
        { label: "Lines before", value: String(text.split("\n").length) },
        { label: "Lines after", value: String(lines.length) },
      ],
      preview: (
        <pre className="whitespace-pre-wrap text-sm text-foreground">{out.slice(0, 2000)}</pre>
      ),
    });
  };
  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="One line per row…"
        className="min-h-[140px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-ring resize-y"
      />
      <div className="mt-3 space-y-2">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={dedupe}
            onChange={(e) => setDedupe(e.target.checked)}
            className="accent-primary"
          />{" "}
          Remove duplicate lines
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={trim}
            onChange={(e) => setTrim(e.target.checked)}
            className="accent-primary"
          />{" "}
          Trim whitespace
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={sort}
            onChange={(e) => setSort(e.target.checked)}
            className="accent-primary"
          />{" "}
          Sort lines
        </label>
      </div>
      <RunButton onClick={run} loading={s.loading} label="Clean text" disabled={!text} />
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

export function FindReplaceTool() {
  const [text, setText] = useState("");
  const [find, setFind] = useState("");
  const [replace, setReplace] = useState("");
  const [useRegex, setUseRegex] = useState(false);
  const s = useTextState();
  const run = () => {
    try {
      let out: string;
      if (useRegex) {
        const re = new RegExp(find, "g");
        out = text.replace(re, replace);
      } else {
        out = text.split(find).join(replace);
      }
      const count = useRegex
        ? (text.match(new RegExp(find, "g")) || []).length
        : text.split(find).length - 1;
      s.setResult({
        text: out,
        filename: "replaced.txt",
        mimeType: "text/plain",
        measurements: [{ label: "Replacements", value: String(count) }],
        preview: (
          <pre className="whitespace-pre-wrap text-sm text-foreground">{out.slice(0, 2000)}</pre>
        ),
      });
    } catch (e) {
      s.setError((e as Error).message);
    }
  };
  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Your text…"
        className="min-h-[120px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-ring resize-y"
      />
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <input
          value={find}
          onChange={(e) => setFind(e.target.value)}
          placeholder="Find"
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-ring"
        />
        <input
          value={replace}
          onChange={(e) => setReplace(e.target.value)}
          placeholder="Replace with"
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-ring"
        />
      </div>
      <label className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={useRegex}
          onChange={(e) => setUseRegex(e.target.checked)}
          className="accent-primary"
        />{" "}
        Use regex
      </label>
      {s.error && <p className="mt-3 text-sm text-destructive">{s.error}</p>}
      <RunButton onClick={run} loading={s.loading} label="Replace all" disabled={!text || !find} />
      {s.result && (
        <div className="mt-4">
          <ResultPanel
            result={s.result}
            onReset={() => {
              s.setResult(null);
            }}
          />
        </div>
      )}
    </div>
  );
}

export function TextDiffTool() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const s = useTextState();
  const run = () => {
    const linesA = a.split("\n"),
      linesB = b.split("\n");
    const html = diffLines(linesA, linesB);
    s.setResult({
      text: html,
      filename: "diff.html",
      mimeType: "text/html",
      preview: <div className="text-xs font-mono" dangerouslySetInnerHTML={{ __html: html }} />,
    });
  };
  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-2">
        <textarea
          value={a}
          onChange={(e) => setA(e.target.value)}
          placeholder="Original text"
          className="min-h-[140px] rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-ring resize-y"
        />
        <textarea
          value={b}
          onChange={(e) => setB(e.target.value)}
          placeholder="Changed text"
          className="min-h-[140px] rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-ring resize-y"
        />
      </div>
      <RunButton onClick={run} loading={s.loading} label="Compare" disabled={!a && !b} />
      {s.result && (
        <div className="mt-4">
          <ResultPanel
            result={s.result}
            onReset={() => {
              s.setResult(null);
              setA("");
              setB("");
            }}
          />
        </div>
      )}
    </div>
  );
}

export function JsonFormatTool() {
  const [text, setText] = useState("");
  const [indent, setIndent] = useState(2);
  const s = useTextState();
  const format = (minify: boolean) => {
    try {
      const parsed = JSON.parse(text);
      const out = minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, indent);
      s.setResult({
        text: out,
        filename: minify ? "minified.json" : "formatted.json",
        mimeType: "application/json",
        preview: (
          <pre className="max-h-48 overflow-auto text-xs font-mono text-foreground">
            {out.slice(0, 2000)}
            {out.length > 2000 ? "…" : ""}
          </pre>
        ),
      });
    } catch (e) {
      s.setError((e as Error).message);
    }
  };
  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder='{"key":"value"}'
        className="min-h-[140px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus-ring resize-y"
      />
      <div className="mt-3 flex items-center gap-3">
        <label className="text-sm text-muted-foreground">
          Indent
          <select
            value={indent}
            onChange={(e) => setIndent(+e.target.value)}
            className="ml-2 rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground focus-ring"
          >
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
            <option value={0}>Tab</option>
          </select>
        </label>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => format(false)}
          disabled={!text}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors focus-ring"
        >
          Format
        </button>
        <button
          onClick={() => format(true)}
          disabled={!text}
          className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-accent disabled:opacity-50 transition-colors focus-ring"
        >
          Minify
        </button>
      </div>
      {s.error && <p className="mt-3 text-sm text-destructive">{s.error}</p>}
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

export function Base64Tool() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const s = useTextState();
  const run = () => {
    try {
      let out = "";
      if (mode === "encode") {
        out = btoa(unescape(encodeURIComponent(text)));
      } else {
        out = decodeURIComponent(escape(atob(text.trim())));
      }
      s.setResult({
        text: out,
        filename: mode === "encode" ? "encoded.txt" : "decoded.txt",
        mimeType: "text/plain",
        preview: (
          <pre className="whitespace-pre-wrap break-all text-sm text-foreground">
            {out.slice(0, 2000)}
          </pre>
        ),
      });
    } catch (e) {
      s.setError("Invalid Base64 input.");
    }
  };
  return (
    <div>
      <div className="flex gap-2 mb-3">
        {(["encode", "decode"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-lg px-3 py-1.5 text-sm ${mode === m ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`}
          >
            {m === "encode" ? "Encode" : "Decode"}
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={mode === "encode" ? "Text to encode" : "Base64 to decode"}
        className="min-h-[120px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus-ring resize-y"
      />
      {s.error && <p className="mt-3 text-sm text-destructive">{s.error}</p>}
      <RunButton
        onClick={run}
        loading={s.loading}
        label={mode === "encode" ? "Encode" : "Decode"}
        disabled={!text}
      />
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

export function UrlEncodeTool() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const s = useTextState();
  const run = () => {
    try {
      const out = mode === "encode" ? encodeURIComponent(text) : decodeURIComponent(text);
      s.setResult({
        text: out,
        filename: "converted.txt",
        mimeType: "text/plain",
        preview: (
          <pre className="whitespace-pre-wrap break-all text-sm text-foreground">
            {out.slice(0, 2000)}
          </pre>
        ),
      });
    } catch (e) {
      s.setError("Invalid URL-encoded input.");
    }
  };
  return (
    <div>
      <div className="flex gap-2 mb-3">
        {(["encode", "decode"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-lg px-3 py-1.5 text-sm ${mode === m ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`}
          >
            {m === "encode" ? "Encode" : "Decode"}
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={mode === "encode" ? "Text to encode" : "URL to decode"}
        className="min-h-[120px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus-ring resize-y"
      />
      {s.error && <p className="mt-3 text-sm text-destructive">{s.error}</p>}
      <RunButton
        onClick={run}
        loading={s.loading}
        label={mode === "encode" ? "Encode" : "Decode"}
        disabled={!text}
      />
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

export function HtmlEntitiesTool() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const s = useTextState();
  const run = () => {
    const out =
      mode === "encode"
        ? text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;")
        : text
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&amp;/g, "&");
    s.setResult({
      text: out,
      filename: "converted.txt",
      mimeType: "text/plain",
      preview: (
        <pre className="whitespace-pre-wrap text-sm text-foreground">{out.slice(0, 2000)}</pre>
      ),
    });
  };
  return (
    <div>
      <div className="flex gap-2 mb-3">
        {(["encode", "decode"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-lg px-3 py-1.5 text-sm ${mode === m ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`}
          >
            {m === "encode" ? "Encode" : "Decode"}
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text…"
        className="min-h-[120px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus-ring resize-y"
      />
      <RunButton
        onClick={run}
        loading={s.loading}
        label={mode === "encode" ? "Encode" : "Decode"}
        disabled={!text}
      />
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

export function NumberBaseTool() {
  const [value, setValue] = useState("");
  const [base, setBase] = useState(10);
  const s = useTextState();
  const run = () => {
    try {
      const n = parseInt(value.trim(), base);
      if (isNaN(n)) throw new Error("Invalid number");
      s.setResult({
        text: `Binary: ${n.toString(2)}\nOctal: ${n.toString(8)}\nDecimal: ${n.toString(10)}\nHex: ${n.toString(16).toUpperCase()}`,
        filename: "converted.txt",
        mimeType: "text/plain",
        measurements: [
          { label: "Decimal", value: n.toString(10) },
          { label: "Hex", value: n.toString(16).toUpperCase() },
          { label: "Binary", value: n.toString(2) },
        ],
      });
    } catch (e) {
      s.setError((e as Error).message);
    }
  };
  return (
    <div>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter number"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono text-foreground focus-ring"
        />
        <select
          value={base}
          onChange={(e) => setBase(+e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-ring"
        >
          <option value={2}>Binary</option>
          <option value={8}>Octal</option>
          <option value={10}>Decimal</option>
          <option value={16}>Hex</option>
        </select>
      </div>
      {s.error && <p className="mt-3 text-sm text-destructive">{s.error}</p>}
      <RunButton onClick={run} loading={s.loading} label="Convert" disabled={!value} />
      {s.result && (
        <div className="mt-4">
          <ResultPanel
            result={s.result}
            onReset={() => {
              s.setResult(null);
              setValue("");
            }}
          />
        </div>
      )}
    </div>
  );
}

export function TimestampTool() {
  const [input, setInput] = useState(String(Math.floor(Date.now() / 1000)));
  const [unit, setUnit] = useState<"s" | "ms">("s");
  const s = useTextState();
  const run = () => {
    try {
      const n = parseInt(input, 10);
      const ms = unit === "s" ? n * 1000 : n;
      const d = new Date(ms);
      if (isNaN(d.getTime())) throw new Error("Invalid timestamp");
      const text = `Unix: ${n}\nUnit: ${unit}\nUTC: ${d.toUTCString()}\nLocal: ${d.toLocaleString()}\nISO: ${d.toISOString()}`;
      s.setResult({
        text,
        filename: "converted.txt",
        mimeType: "text/plain",
        measurements: [
          { label: "UTC", value: d.toUTCString() },
          { label: "ISO", value: d.toISOString() },
        ],
      });
    } catch (e) {
      s.setError((e as Error).message);
    }
  };
  return (
    <div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Timestamp"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono text-foreground focus-ring"
        />
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value as "s" | "ms")}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-ring"
        >
          <option value="s">Seconds</option>
          <option value="ms">Milliseconds</option>
        </select>
      </div>
      {s.error && <p className="mt-3 text-sm text-destructive">{s.error}</p>}
      <RunButton onClick={run} loading={s.loading} label="Convert" disabled={!input} />
      {s.result && (
        <div className="mt-4">
          <ResultPanel
            result={s.result}
            onReset={() => {
              s.setResult(null);
            }}
          />
        </div>
      )}
    </div>
  );
}

export function UuidGenTool() {
  const [count, setCount] = useState(1);
  const s = useTextState();
  const run = () => {
    const uuids: string[] = [];
    for (let i = 0; i < count; i++) uuids.push(crypto.randomUUID());
    s.setResult({
      text: uuids.join("\n"),
      filename: "uuids.txt",
      mimeType: "text/plain",
      measurements: [{ label: "Generated", value: String(count) }],
      preview: (
        <pre className="text-xs font-mono text-foreground">{uuids.join("\n").slice(0, 2000)}</pre>
      ),
    });
  };
  return (
    <div>
      <label className="block text-sm text-muted-foreground">
        Count
        <input
          type="number"
          min={1}
          max={100}
          value={count}
          onChange={(e) => setCount(Math.min(100, Math.max(1, +e.target.value)))}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus-ring"
        />
      </label>
      <RunButton onClick={run} loading={s.loading} label="Generate UUIDs" />
      {s.result && (
        <div className="mt-4">
          <ResultPanel
            result={s.result}
            onReset={() => {
              s.setResult(null);
            }}
          />
        </div>
      )}
    </div>
  );
}

export function PasswordGenTool() {
  const [length, setLength] = useState(16);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const s = useTextState();
  const run = () => {
    let chars = "";
    if (upper) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (lower) chars += "abcdefghijklmnopqrstuvwxyz";
    if (numbers) chars += "0123456789";
    if (symbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";
    if (!chars) {
      s.setError("Select at least one character set.");
      return;
    }
    const arr = new Uint32Array(length);
    crypto.getRandomValues(arr);
    let pw = "";
    for (let i = 0; i < length; i++) pw += chars[arr[i] % chars.length];
    s.setResult({
      text: pw,
      filename: "password.txt",
      mimeType: "text/plain",
      measurements: [
        { label: "Length", value: String(length) },
        { label: "Entropy", value: `${Math.round(length * Math.log2(chars.length))} bits` },
      ],
      preview: <p className="font-mono text-lg text-foreground">{pw}</p>,
    });
  };
  return (
    <div>
      <label className="block text-sm text-muted-foreground">
        Length ({length})
        <input
          type="range"
          min={4}
          max={64}
          value={length}
          onChange={(e) => setLength(+e.target.value)}
          className="mt-2 w-full accent-primary"
        />
      </label>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={upper}
            onChange={(e) => setUpper(e.target.checked)}
            className="accent-primary"
          />{" "}
          Uppercase
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={lower}
            onChange={(e) => setLower(e.target.checked)}
            className="accent-primary"
          />{" "}
          Lowercase
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={numbers}
            onChange={(e) => setNumbers(e.target.checked)}
            className="accent-primary"
          />{" "}
          Numbers
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={symbols}
            onChange={(e) => setSymbols(e.target.checked)}
            className="accent-primary"
          />{" "}
          Symbols
        </label>
      </div>
      {s.error && <p className="mt-3 text-sm text-destructive">{s.error}</p>}
      <RunButton onClick={run} loading={s.loading} label="Generate password" />
      {s.result && (
        <div className="mt-4">
          <ResultPanel
            result={s.result}
            onReset={() => {
              s.setResult(null);
            }}
          />
        </div>
      )}
    </div>
  );
}

export function HashSha256Tool() {
  const [text, setText] = useState("");
  const s = useTextState();
  const run = async () => {
    s.setLoading(true);
    s.setError(null);
    try {
      const data = new TextEncoder().encode(text);
      const hash = await crypto.subtle.digest("SHA-256", data);
      const hex = Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      s.setResult({
        text: hex,
        filename: "sha256.txt",
        mimeType: "text/plain",
        measurements: [{ label: "Length", value: `${hex.length} chars` }],
        preview: <p className="font-mono text-sm break-all text-foreground">{hex}</p>,
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
        placeholder="Text to hash…"
        className="min-h-[120px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus-ring resize-y"
      />
      <RunButton onClick={run} loading={s.loading} label="Hash" disabled={!text} />
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

export function JwtInspectTool() {
  const [token, setToken] = useState("");
  const s = useTextState();
  const run = () => {
    try {
      const parts = token.trim().split(".");
      if (parts.length < 2) throw new Error("Invalid JWT format");
      const header = JSON.parse(atob(parts[0].replace(/-/g, "+").replace(/_/g, "/")));
      const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
      const out = JSON.stringify({ header, payload }, null, 2);
      s.setResult({
        text: out,
        filename: "jwt-payload.json",
        mimeType: "application/json",
        warnings: [
          "This decodes the payload only — it does not verify the signature or authenticity.",
        ],
        preview: (
          <pre className="max-h-48 overflow-auto text-xs font-mono text-foreground">{out}</pre>
        ),
      });
    } catch (e) {
      s.setError("Invalid JWT token.");
    }
  };
  return (
    <div>
      <textarea
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="Paste JWT token…"
        className="min-h-[100px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus-ring resize-y"
      />
      {s.error && <p className="mt-3 text-sm text-destructive">{s.error}</p>}
      <RunButton onClick={run} loading={s.loading} label="Decode" disabled={!token} />
      {s.result && (
        <div className="mt-4">
          <ResultPanel
            result={s.result}
            onReset={() => {
              s.setResult(null);
              setToken("");
            }}
          />
        </div>
      )}
    </div>
  );
}

export function RegexTesterTool() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("g");
  const [text, setText] = useState("");
  const s = useTextState();
  const run = () => {
    try {
      const re = new RegExp(pattern, flags);
      const matches: string[] = [];
      let m: RegExpExecArray | null;
      let count = 0;
      while ((m = re.exec(text)) !== null && count < 1000) {
        matches.push(m[0]);
        count++;
        if (!re.global) break;
        if (m.index === re.lastIndex) re.lastIndex++;
      }
      const html = text.replace(
        re,
        (match) =>
          `<mark style="background:var(--violet-glow);color:var(--color-foreground);border-radius:2px">${escapeHtml(match)}</mark>`,
      );
      s.setResult({
        text: `Matches: ${matches.length}\n\n${matches.join("\n")}`,
        filename: "regex-results.txt",
        mimeType: "text/plain",
        measurements: [{ label: "Matches", value: String(matches.length) }],
        preview: (
          <div
            className="text-sm text-foreground"
            dangerouslySetInnerHTML={{
              __html: escapeHtml(text).replace(
                re,
                (match) =>
                  `<mark style="background:var(--violet-glow);border-radius:2px">${match}</mark>`,
              ),
            }}
          />
        ),
      });
    } catch (e) {
      s.setError((e as Error).message);
    }
  };
  return (
    <div>
      <div className="flex gap-2">
        <input
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          placeholder="Regex pattern"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono text-foreground focus-ring"
        />
        <input
          value={flags}
          onChange={(e) => setFlags(e.target.value)}
          placeholder="flags"
          className="w-20 rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono text-foreground focus-ring"
        />
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Test text…"
        className="mt-2 min-h-[120px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus-ring resize-y"
      />
      {s.error && <p className="mt-3 text-sm text-destructive">{s.error}</p>}
      <RunButton onClick={run} loading={s.loading} label="Test regex" disabled={!pattern} />
      {s.result && (
        <div className="mt-4">
          <ResultPanel
            result={s.result}
            onReset={() => {
              s.setResult(null);
            }}
          />
        </div>
      )}
    </div>
  );
}

export function LoremIpsumTool() {
  const [count, setCount] = useState(3);
  const [type, setType] = useState<"paragraphs" | "sentences" | "words">("paragraphs");
  const s = useTextState();
  const run = () => {
    const words =
      "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum".split(
        " ",
      );
    let out = "";
    if (type === "words") {
      out = Array.from(
        { length: count },
        () => words[Math.floor(Math.random() * words.length)],
      ).join(" ");
    } else if (type === "sentences") {
      out = Array.from({ length: count }, () => {
        const len = 8 + Math.floor(Math.random() * 12);
        const s = Array.from(
          { length: len },
          () => words[Math.floor(Math.random() * words.length)],
        ).join(" ");
        return s.charAt(0).toUpperCase() + s.slice(1) + ".";
      }).join(" ");
    } else {
      out = Array.from({ length: count }, () => {
        const len = 4 + Math.floor(Math.random() * 4);
        return (
          Array.from({ length: len }, () => {
            const slen = 3 + Math.floor(Math.random() * 8);
            return Array.from(
              { length: slen },
              () => words[Math.floor(Math.random() * words.length)],
            ).join(" ");
          }).join(". ") + "."
        );
      }).join("\n\n");
    }
    s.setResult({
      text: out,
      filename: "lorem-ipsum.txt",
      mimeType: "text/plain",
      measurements: [{ label: type, value: String(count) }],
      preview: (
        <pre className="whitespace-pre-wrap text-sm text-foreground">{out.slice(0, 2000)}</pre>
      ),
    });
  };
  return (
    <div>
      <div className="flex gap-2">
        <label className="flex-1 text-sm text-muted-foreground">
          Count
          <input
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(Math.min(100, +e.target.value))}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus-ring"
          />
        </label>
        <label className="flex-1 text-sm text-muted-foreground">
          Type
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus-ring"
          >
            <option value="paragraphs">Paragraphs</option>
            <option value="sentences">Sentences</option>
            <option value="words">Words</option>
          </select>
        </label>
      </div>
      <RunButton onClick={run} loading={s.loading} label="Generate" />
      {s.result && (
        <div className="mt-4">
          <ResultPanel
            result={s.result}
            onReset={() => {
              s.setResult(null);
            }}
          />
        </div>
      )}
    </div>
  );
}

// ---- helpers ----
function diffLines(a: string[], b: string[]): string {
  const setA = new Set(a),
    setB = new Set(b);
  let html = "";
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i++) {
    if (i < a.length && !setB.has(a[i]))
      html += `<div style="background:color-mix(in oklab,var(--color-destructive) 15%,transparent);color:var(--color-foreground)">- ${escapeHtml(a[i])}</div>`;
    else if (i < b.length && !setA.has(b[i]))
      html += `<div style="background:color-mix(in oklab,var(--color-cat-business) 15%,transparent);color:var(--color-foreground)">+ ${escapeHtml(b[i])}</div>`;
    else if (i < a.length)
      html += `<div style="color:var(--color-muted-foreground)">  ${escapeHtml(a[i])}</div>`;
  }
  return html;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
