import { useState } from "react";
import { ResultPanel, type ToolResult } from "../../lib/result-panel";
import { Loader2 } from "lucide-react";

function useResultState() {
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

// ---- Color conversions ----
function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace("#", "").match(/.{2}/g);
  if (!m || m.length < 3) return [0, 0, 0];
  return [parseInt(m[0], 16), parseInt(m[1], 16), parseInt(m[2], 16)];
}
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}
function relLum(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}
function contrastRatio(hex1: string, hex2: string): number {
  const [r1, g1, b1] = hexToRgb(hex1),
    [r2, g2, b2] = hexToRgb(hex2);
  const l1 = relLum(r1, g1, b1),
    l2 = relLum(r2, g2, b2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export function ColorPickerTool() {
  const [color, setColor] = useState("#7C3AED");
  const s = useResultState();
  const [r, g, b] = hexToRgb(color);
  const [h, sat, l] = rgbToHsl(r, g, b);
  const run = () => {
    const text = `HEX: ${color}\nRGB: rgb(${r}, ${g}, ${b})\nHSL: hsl(${h}, ${sat}%, ${l}%)\nRGB values: ${r}, ${g}, ${b}`;
    s.setResult({
      text,
      filename: "color.txt",
      mimeType: "text/plain",
      measurements: [
        { label: "HEX", value: color.toUpperCase() },
        { label: "RGB", value: `${r}, ${g}, ${b}` },
        { label: "HSL", value: `${h}, ${sat}%, ${l}%` },
      ],
      preview: (
        <div
          className="size-20 rounded-lg border border-border"
          style={{ backgroundColor: color }}
        />
      ),
    });
  };
  return (
    <div>
      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        className="h-32 w-full rounded-lg border border-border bg-background cursor-pointer"
      />
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { l: "HEX", v: color.toUpperCase() },
          { l: "RGB", v: `${r}, ${g}, ${b}` },
          { l: "HSL", v: `${h}, ${sat}%, ${l}%` },
        ].map((m) => (
          <div key={m.l} className="rounded-lg bg-surface px-3 py-2">
            <p className="text-xs text-muted-foreground">{m.l}</p>
            <p className="text-sm font-mono text-foreground">{m.v}</p>
          </div>
        ))}
      </div>
      <RunButton onClick={run} loading={s.loading} label="Export color" />
      {s.result && (
        <div className="mt-4">
          <ResultPanel result={s.result} onReset={() => s.setResult(null)} />
        </div>
      )}
    </div>
  );
}

export function ContrastCheckerTool() {
  const [fg, setFg] = useState("#FFFFFF");
  const [bg, setBg] = useState("#7C3AED");
  const s = useResultState();
  const ratio = contrastRatio(fg, bg);
  const run = () => {
    const passAA = ratio >= 4.5 ? "Pass" : "Fail";
    const passAALarge = ratio >= 3 ? "Pass" : "Fail";
    const passAAA = ratio >= 7 ? "Pass" : "Fail";
    const text = `Contrast ratio: ${ratio.toFixed(2)}:1\nNormal text (AA 4.5:1): ${passAA}\nLarge text (AA 3:1): ${passAALarge}\nNormal text (AAA 7:1): ${passAAA}`;
    s.setResult({
      text,
      filename: "contrast.txt",
      mimeType: "text/plain",
      measurements: [
        { label: "Ratio", value: `${ratio.toFixed(2)}:1` },
        { label: "AA normal", value: passAA },
        { label: "AA large", value: passAALarge },
        { label: "AAA", value: passAAA },
      ],
      preview: (
        <div
          className="rounded-lg p-6 text-center text-2xl font-bold"
          style={{ backgroundColor: bg, color: fg }}
        >
          Sample text
        </div>
      ),
    });
  };
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm text-muted-foreground">
          Foreground{" "}
          <input
            type="color"
            value={fg}
            onChange={(e) => setFg(e.target.value)}
            className="mt-1 h-16 w-full rounded-lg border border-border bg-background"
          />
        </label>
        <label className="text-sm text-muted-foreground">
          Background{" "}
          <input
            type="color"
            value={bg}
            onChange={(e) => setBg(e.target.value)}
            className="mt-1 h-16 w-full rounded-lg border border-border bg-background"
          />
        </label>
      </div>
      <div className="mt-3 rounded-lg p-4 text-center" style={{ backgroundColor: bg, color: fg }}>
        <p className="text-xl font-bold">The quick brown fox</p>
        <p className="text-sm mt-1">Contrast: {ratio.toFixed(2)}:1</p>
      </div>
      <RunButton onClick={run} loading={s.loading} label="Check contrast" />
      {s.result && (
        <div className="mt-4">
          <ResultPanel result={s.result} onReset={() => s.setResult(null)} />
        </div>
      )}
    </div>
  );
}

export function GradientBuilderTool() {
  const [c1, setC1] = useState("#7C3AED");
  const [c2, setC2] = useState("#A78BFA");
  const [angle, setAngle] = useState(135);
  const s = useResultState();
  const css = `linear-gradient(${angle}deg, ${c1}, ${c2})`;
  const run = () => {
    s.setResult({
      text: `background: ${css};`,
      filename: "gradient.css",
      mimeType: "text/css",
      preview: <div className="h-24 rounded-lg" style={{ background: css }} />,
    });
  };
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm text-muted-foreground">
          Color 1{" "}
          <input
            type="color"
            value={c1}
            onChange={(e) => setC1(e.target.value)}
            className="mt-1 h-12 w-full rounded-lg border border-border bg-background"
          />
        </label>
        <label className="text-sm text-muted-foreground">
          Color 2{" "}
          <input
            type="color"
            value={c2}
            onChange={(e) => setC2(e.target.value)}
            className="mt-1 h-12 w-full rounded-lg border border-border bg-background"
          />
        </label>
      </div>
      <label className="mt-3 block text-sm text-muted-foreground">
        Angle ({angle}°){" "}
        <input
          type="range"
          min={0}
          max={360}
          value={angle}
          onChange={(e) => setAngle(+e.target.value)}
          className="mt-2 w-full accent-primary"
        />
      </label>
      <div className="mt-3 h-24 rounded-lg" style={{ background: css }} />
      <p className="mt-2 rounded-lg bg-surface px-3 py-2 font-mono text-xs text-foreground">
        background: {css};
      </p>
      <RunButton onClick={run} loading={s.loading} label="Export CSS" />
      {s.result && (
        <div className="mt-4">
          <ResultPanel result={s.result} onReset={() => s.setResult(null)} />
        </div>
      )}
    </div>
  );
}

export function ShadowBuilderTool() {
  const [x, setX] = useState(0);
  const [y, setY] = useState(10);
  const [blur, setBlur] = useState(30);
  const [spread, setSpread] = useState(-10);
  const [color, setColor] = useState("#7C3AED");
  const [opacity, setOpacity] = useState(40);
  const s = useResultState();
  const rgba = (() => {
    const [r, g, b] = hexToRgb(color);
    return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
  })();
  const css = `box-shadow: ${x}px ${y}px ${blur}px ${spread}px ${rgba};`;
  const run = () => {
    s.setResult({
      text: css,
      filename: "shadow.css",
      mimeType: "text/css",
      preview: (
        <div className="flex h-24 items-center justify-center">
          <div
            className="size-16 rounded-xl bg-card"
            style={{ boxShadow: `${x}px ${y}px ${blur}px ${spread}px ${rgba}` }}
          />
        </div>
      ),
    });
  };
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm text-muted-foreground">
          X ({x}px){" "}
          <input
            type="range"
            min={-50}
            max={50}
            value={x}
            onChange={(e) => setX(+e.target.value)}
            className="mt-2 w-full accent-primary"
          />
        </label>
        <label className="text-sm text-muted-foreground">
          Y ({y}px){" "}
          <input
            type="range"
            min={-50}
            max={50}
            value={y}
            onChange={(e) => setY(+e.target.value)}
            className="mt-2 w-full accent-primary"
          />
        </label>
        <label className="text-sm text-muted-foreground">
          Blur ({blur}px){" "}
          <input
            type="range"
            min={0}
            max={100}
            value={blur}
            onChange={(e) => setBlur(+e.target.value)}
            className="mt-2 w-full accent-primary"
          />
        </label>
        <label className="text-sm text-muted-foreground">
          Spread ({spread}px){" "}
          <input
            type="range"
            min={-50}
            max={50}
            value={spread}
            onChange={(e) => setSpread(+e.target.value)}
            className="mt-2 w-full accent-primary"
          />
        </label>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-10 w-16 rounded-lg border border-border bg-background"
        />
        <label className="flex-1 text-sm text-muted-foreground">
          Opacity ({opacity}%){" "}
          <input
            type="range"
            min={0}
            max={100}
            value={opacity}
            onChange={(e) => setOpacity(+e.target.value)}
            className="mt-2 w-full accent-primary"
          />
        </label>
      </div>
      <div className="mt-3 flex h-24 items-center justify-center">
        <div
          className="size-16 rounded-xl bg-card"
          style={{ boxShadow: `${x}px ${y}px ${blur}px ${spread}px ${rgba}` }}
        />
      </div>
      <p className="mt-2 rounded-lg bg-surface px-3 py-2 font-mono text-xs text-foreground">
        {css}
      </p>
      <RunButton onClick={run} loading={s.loading} label="Export CSS" />
      {s.result && (
        <div className="mt-4">
          <ResultPanel result={s.result} onReset={() => s.setResult(null)} />
        </div>
      )}
    </div>
  );
}

export function QrGeneratorTool() {
  const [text, setText] = useState("https://cwow.example");
  const [size, setSize] = useState(256);
  const [color, setColor] = useState("#000000");
  const [bg, setBg] = useState("#FFFFFF");
  const s = useResultState();
  const run = async () => {
    s.setLoading(true);
    s.setError(null);
    try {
      const QRCode = (await import("qrcode")).default;
      const canvas = document.createElement("canvas");
      await QRCode.toCanvas(canvas, text || " ", {
        width: size,
        color: { dark: color, light: bg },
        margin: 1,
      });
      const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), "image/png"));
      const svg = await QRCode.toString(text || " ", {
        type: "svg",
        color: { dark: color, light: bg },
        margin: 1,
      });
      s.setResult({
        blob,
        filename: "qr-code.png",
        mimeType: "image/png",
        measurements: [
          { label: "Size", value: `${size}×${size}` },
          { label: "Content", value: text.slice(0, 30) },
        ],
        preview: (
          <img src={URL.createObjectURL(blob)} alt="QR code" className="max-h-48 rounded-lg" />
        ),
        warnings: ["QR payloads are never stored or logged."],
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
        placeholder="URL, text, email, phone, Wi-Fi…"
        className="min-h-[80px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-ring resize-y"
      />
      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="text-sm text-muted-foreground">
          Size ({size}px){" "}
          <input
            type="range"
            min={128}
            max={512}
            value={size}
            onChange={(e) => setSize(+e.target.value)}
            className="mt-2 w-full accent-primary"
          />
        </label>
        <div className="flex gap-2">
          <label className="text-sm text-muted-foreground">
            FG{" "}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-border bg-background"
            />
          </label>
          <label className="text-sm text-muted-foreground">
            BG{" "}
            <input
              type="color"
              value={bg}
              onChange={(e) => setBg(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-border bg-background"
            />
          </label>
        </div>
      </div>
      {s.error && <p className="mt-3 text-sm text-destructive">{s.error}</p>}
      <RunButton onClick={run} loading={s.loading} label="Generate QR" disabled={!text} />
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

export function UtmBuilderTool() {
  const [url, setUrl] = useState("https://example.com");
  const [source, setSource] = useState("newsletter");
  const [medium, setMedium] = useState("email");
  const [campaign, setCampaign] = useState("launch");
  const [term, setTerm] = useState("");
  const [content, setContent] = useState("");
  const s = useResultState();
  const run = () => {
    const params = new URLSearchParams();
    if (source) params.set("utm_source", source);
    if (medium) params.set("utm_medium", medium);
    if (campaign) params.set("utm_campaign", campaign);
    if (term) params.set("utm_term", term);
    if (content) params.set("utm_content", content);
    const sep = url.includes("?") ? "&" : "?";
    const full = url + sep + params.toString();
    s.setResult({
      text: full,
      filename: "utm-url.txt",
      mimeType: "text/plain",
      preview: <p className="break-all text-sm text-foreground">{full}</p>,
    });
  };
  return (
    <div>
      <label className="block text-sm text-muted-foreground">
        URL{" "}
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus-ring"
        />
      </label>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="text-sm text-muted-foreground">
          Source{" "}
          <input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus-ring"
          />
        </label>
        <label className="text-sm text-muted-foreground">
          Medium{" "}
          <input
            value={medium}
            onChange={(e) => setMedium(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus-ring"
          />
        </label>
        <label className="text-sm text-muted-foreground">
          Campaign{" "}
          <input
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus-ring"
          />
        </label>
        <label className="text-sm text-muted-foreground">
          Term{" "}
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus-ring"
          />
        </label>
      </div>
      <label className="mt-2 block text-sm text-muted-foreground">
        Content{" "}
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus-ring"
        />
      </label>
      <RunButton onClick={run} loading={s.loading} label="Build URL" disabled={!url} />
      {s.result && (
        <div className="mt-4">
          <ResultPanel result={s.result} onReset={() => s.setResult(null)} />
        </div>
      )}
    </div>
  );
}

export function AspectRatioTool() {
  const [ratio, setRatio] = useState("16:9");
  const [width, setWidth] = useState(1920);
  const s = useResultState();
  const [rw, rh] = ratio.split(":").map(Number);
  const height = rw && rh ? Math.round((width / rw) * rh) : 0;
  const run = () => {
    s.setResult({
      text: `Aspect ratio: ${ratio}\nWidth: ${width}px\nHeight: ${height}px`,
      filename: "dimensions.txt",
      mimeType: "text/plain",
      measurements: [
        { label: "Width", value: `${width}px` },
        { label: "Height", value: `${height}px` },
        { label: "Ratio", value: ratio },
      ],
    });
  };
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm text-muted-foreground">
          Aspect ratio
          <select
            value={ratio}
            onChange={(e) => setRatio(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus-ring"
          >
            <option value="16:9">16:9</option>
            <option value="4:3">4:3</option>
            <option value="1:1">1:1</option>
            <option value="9:16">9:16</option>
            <option value="3:2">3:2</option>
            <option value="21:9">21:9</option>
          </select>
        </label>
        <label className="text-sm text-muted-foreground">
          Width (px){" "}
          <input
            type="number"
            value={width}
            onChange={(e) => setWidth(+e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus-ring"
          />
        </label>
      </div>
      <div className="mt-3 rounded-lg bg-surface px-3 py-3 text-center">
        <p className="text-sm text-muted-foreground">Result height</p>
        <p className="text-2xl font-bold text-foreground">{height}px</p>
      </div>
      <RunButton onClick={run} loading={s.loading} label="Export" />
      {s.result && (
        <div className="mt-4">
          <ResultPanel result={s.result} onReset={() => s.setResult(null)} />
        </div>
      )}
    </div>
  );
}
