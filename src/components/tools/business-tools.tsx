import { useState } from "react";
import { ResultPanel, type ToolResult } from "../../lib/result-panel";
import { Loader2 } from "lucide-react";

function useResultState() {
  const [result, setResult] = useState<ToolResult | null>(null);
  const [loading, setLoading] = useState(false);
  return { result, setResult, loading, setLoading };
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
          <Loader2 className="size-4 animate-spin" /> Calculating…
        </>
      ) : (
        label
      )}
    </button>
  );
}

function NumInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block text-sm text-muted-foreground">
      {label}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus-ring"
      />
    </label>
  );
}

export function PercentageCalcTool() {
  const [mode, setMode] = useState<"of" | "isWhat" | "change">("of");
  const [a, setA] = useState(20);
  const [b, setB] = useState(150);
  const s = useResultState();
  const run = () => {
    let val = 0,
      text = "";
    if (mode === "of") {
      val = (a / 100) * b;
      text = `${a}% of ${b} = ${val.toFixed(2)}`;
    } else if (mode === "isWhat") {
      val = (a / b) * 100;
      text = `${a} is ${val.toFixed(2)}% of ${b}`;
    } else {
      val = ((b - a) / a) * 100;
      text = `Change from ${a} to ${b} = ${val.toFixed(2)}%`;
    }
    s.setResult({
      text,
      filename: "result.txt",
      mimeType: "text/plain",
      measurements: [{ label: "Result", value: val.toFixed(2) }],
    });
  };
  return (
    <div>
      <div className="flex gap-2 mb-3">
        {(
          [
            ["of", "X% of Y"],
            ["isWhat", "X is what % of Y"],
            ["change", "% change"],
          ] as const
        ).map(([m, label]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-lg px-3 py-1.5 text-sm ${mode === m ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumInput label={mode === "change" ? "From" : "Value A"} value={a} onChange={setA} />
        <NumInput label={mode === "change" ? "To" : "Value B"} value={b} onChange={setB} />
      </div>
      <RunButton onClick={run} loading={s.loading} label="Calculate" />
      {s.result && (
        <div className="mt-4">
          <ResultPanel result={s.result} onReset={() => s.setResult(null)} />
        </div>
      )}
    </div>
  );
}

export function DiscountCalcTool() {
  const [price, setPrice] = useState(100);
  const [discount, setDiscount] = useState(25);
  const s = useResultState();
  const savings = (price * discount) / 100;
  const final = price - savings;
  const run = () => {
    s.setResult({
      text: `Original: $${price.toFixed(2)}\nDiscount: ${discount}%\nYou save: $${savings.toFixed(2)}\nFinal price: $${final.toFixed(2)}`,
      filename: "discount.txt",
      mimeType: "text/plain",
      measurements: [
        { label: "Final price", value: `$${final.toFixed(2)}` },
        { label: "You save", value: `$${savings.toFixed(2)}` },
      ],
    });
  };
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <NumInput label="Original price ($)" value={price} onChange={setPrice} />
        <NumInput label="Discount (%)" value={discount} onChange={setDiscount} />
      </div>
      <div className="mt-3 rounded-lg bg-surface px-3 py-3 text-center">
        <p className="text-sm text-muted-foreground">Final price</p>
        <p className="text-2xl font-bold text-foreground">${final.toFixed(2)}</p>
      </div>
      <RunButton onClick={run} loading={s.loading} label="Calculate" />
      {s.result && (
        <div className="mt-4">
          <ResultPanel result={s.result} onReset={() => s.setResult(null)} />
        </div>
      )}
    </div>
  );
}

export function MarginCalcTool() {
  const [cost, setCost] = useState(50);
  const [price, setPrice] = useState(100);
  const s = useResultState();
  const margin = price > 0 ? ((price - cost) / price) * 100 : 0;
  const markup = cost > 0 ? ((price - cost) / cost) * 100 : 0;
  const profit = price - cost;
  const run = () => {
    s.setResult({
      text: `Cost: $${cost.toFixed(2)}\nSelling price: $${price.toFixed(2)}\nProfit: $${profit.toFixed(2)}\n\nMargin = (Price - Cost) / Price × 100 = ${margin.toFixed(2)}%\nMarkup = (Price - Cost) / Cost × 100 = ${markup.toFixed(2)}%`,
      filename: "margin.txt",
      mimeType: "text/plain",
      measurements: [
        { label: "Profit", value: `$${profit.toFixed(2)}` },
        { label: "Margin", value: `${margin.toFixed(2)}%` },
        { label: "Markup", value: `${markup.toFixed(2)}%` },
      ],
    });
  };
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <NumInput label="Cost ($)" value={cost} onChange={setCost} />
        <NumInput label="Selling price ($)" value={price} onChange={setPrice} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { l: "Profit", v: `$${profit.toFixed(2)}` },
          { l: "Margin", v: `${margin.toFixed(1)}%` },
          { l: "Markup", v: `${markup.toFixed(1)}%` },
        ].map((m) => (
          <div key={m.l} className="rounded-lg bg-surface px-2 py-2 text-center">
            <p className="text-xs text-muted-foreground">{m.l}</p>
            <p className="text-sm font-semibold text-foreground">{m.v}</p>
          </div>
        ))}
      </div>
      <RunButton onClick={run} loading={s.loading} label="Calculate" />
      {s.result && (
        <div className="mt-4">
          <ResultPanel result={s.result} onReset={() => s.setResult(null)} />
        </div>
      )}
    </div>
  );
}

export function BreakEvenTool() {
  const [fixed, setFixed] = useState(10000);
  const [unit, setUnit] = useState(20);
  const [price, setPrice] = useState(50);
  const s = useResultState();
  const contribution = price - unit;
  const units = contribution > 0 ? fixed / contribution : 0;
  const run = () => {
    s.setResult({
      text: `Fixed costs: $${fixed}\nVariable cost per unit: $${unit}\nPrice per unit: $${price}\nContribution margin: $${contribution.toFixed(2)}\nBreak-even units: ${Math.ceil(units)}\nBreak-even revenue: $${(units * price).toFixed(2)}`,
      filename: "break-even.txt",
      mimeType: "text/plain",
      measurements: [
        { label: "Break-even units", value: String(Math.ceil(units)) },
        { label: "Break-even revenue", value: `$${(units * price).toFixed(2)}` },
      ],
    });
  };
  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        <NumInput label="Fixed costs ($)" value={fixed} onChange={setFixed} />
        <NumInput label="Variable/unit ($)" value={unit} onChange={setUnit} />
        <NumInput label="Price/unit ($)" value={price} onChange={setPrice} />
      </div>
      <div className="mt-3 rounded-lg bg-surface px-3 py-3 text-center">
        <p className="text-sm text-muted-foreground">Break-even point</p>
        <p className="text-2xl font-bold text-foreground">{Math.ceil(units)} units</p>
      </div>
      <RunButton onClick={run} loading={s.loading} label="Calculate" />
      {s.result && (
        <div className="mt-4">
          <ResultPanel result={s.result} onReset={() => s.setResult(null)} />
        </div>
      )}
    </div>
  );
}

export function SalesTaxTool() {
  const [price, setPrice] = useState(100);
  const [rate, setRate] = useState(8.5);
  const s = useResultState();
  const tax = (price * rate) / 100;
  const total = price + tax;
  const run = () => {
    s.setResult({
      text: `Price: $${price.toFixed(2)}\nTax rate: ${rate}%\nTax: $${tax.toFixed(2)}\nTotal: $${total.toFixed(2)}`,
      filename: "sales-tax.txt",
      mimeType: "text/plain",
      measurements: [
        { label: "Tax", value: `$${tax.toFixed(2)}` },
        { label: "Total", value: `$${total.toFixed(2)}` },
      ],
    });
  };
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <NumInput label="Price ($)" value={price} onChange={setPrice} />
        <NumInput label="Tax rate (%)" value={rate} onChange={setRate} />
      </div>
      <div className="mt-3 rounded-lg bg-surface px-3 py-3 text-center">
        <p className="text-sm text-muted-foreground">Total with tax</p>
        <p className="text-2xl font-bold text-foreground">${total.toFixed(2)}</p>
      </div>
      <RunButton onClick={run} loading={s.loading} label="Calculate" />
      {s.result && (
        <div className="mt-4">
          <ResultPanel result={s.result} onReset={() => s.setResult(null)} />
        </div>
      )}
    </div>
  );
}

export function UnitConvertTool() {
  const [category, setCategory] = useState<"length" | "weight" | "temperature">("length");
  const [value, setValue] = useState(1);
  const [from, setFrom] = useState("m");
  const [to, setTo] = useState("ft");
  const s = useResultState();
  const units: Record<string, Record<string, number>> = {
    length: {
      m: 1,
      km: 1000,
      cm: 0.01,
      mm: 0.001,
      mi: 1609.344,
      ft: 0.3048,
      in: 0.0254,
      yd: 0.9144,
    },
    weight: { kg: 1, g: 0.001, mg: 0.000001, lb: 0.453592, oz: 0.0283495, t: 1000 },
  };
  const run = () => {
    let result = 0;
    if (category === "temperature") {
      let c = 0;
      if (from === "C") c = value;
      else if (from === "F") c = ((value - 32) * 5) / 9;
      else c = value - 273.15;
      if (to === "C") result = c;
      else if (to === "F") result = (c * 9) / 5 + 32;
      else result = c + 273.15;
    } else {
      const base = value * units[category][from];
      result = base / units[category][to];
    }
    s.setResult({
      text: `${value} ${from} = ${result.toFixed(4)} ${to}`,
      filename: "conversion.txt",
      mimeType: "text/plain",
      measurements: [{ label: "Result", value: `${result.toFixed(4)} ${to}` }],
    });
  };
  const unitList = category === "temperature" ? ["C", "F", "K"] : Object.keys(units[category]);
  return (
    <div>
      <div className="flex gap-2 mb-3">
        {(["length", "weight", "temperature"] as const).map((c) => (
          <button
            key={c}
            onClick={() => {
              setCategory(c);
              setFrom(Object.keys(units[c])[0]);
              setTo(Object.keys(units[c])[1]);
            }}
            className={`rounded-lg px-3 py-1.5 text-sm capitalize ${category === c ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <NumInput label="Value" value={value} onChange={setValue} />
        <label className="text-sm text-muted-foreground">
          From
          <select
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus-ring"
          >
            {unitList.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-muted-foreground">
          To
          <select
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus-ring"
          >
            {unitList.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </label>
      </div>
      <RunButton onClick={run} loading={s.loading} label="Convert" />
      {s.result && (
        <div className="mt-4">
          <ResultPanel result={s.result} onReset={() => s.setResult(null)} />
        </div>
      )}
    </div>
  );
}

export function TimezoneCompareTool() {
  const [time, setTime] = useState(() => new Date().toISOString().slice(0, 16));
  const zones = [
    "UTC",
    "America/New_York",
    "America/Los_Angeles",
    "Europe/London",
    "Asia/Tokyo",
    "Australia/Sydney",
  ];
  const s = useResultState();
  const run = () => {
    const d = new Date(time);
    const lines = zones.map(
      (z) =>
        `${z}: ${d.toLocaleString("en-US", { timeZone: z, dateStyle: "medium", timeStyle: "short" })}`,
    );
    s.setResult({
      text: lines.join("\n"),
      filename: "timezones.txt",
      mimeType: "text/plain",
      preview: (
        <div className="space-y-1 text-sm text-foreground">
          {lines.map((l, i) => (
            <p key={i}>{l}</p>
          ))}
        </div>
      ),
    });
  };
  return (
    <div>
      <label className="block text-sm text-muted-foreground">
        Date & time
        <input
          type="datetime-local"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus-ring"
        />
      </label>
      <div className="mt-3 space-y-1">
        {zones.map((z) => {
          const d = new Date(time);
          return (
            <div key={z} className="flex justify-between rounded-lg bg-surface px-3 py-2 text-sm">
              <span className="text-muted-foreground">{z}</span>
              <span className="text-foreground">
                {d.toLocaleString("en-US", {
                  timeZone: z,
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </div>
          );
        })}
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

export function InvoiceGenTool() {
  const [from, setFrom] = useState("Your Business\n123 Main St");
  const [to, setTo] = useState("Client Name\n456 Client Ave");
  const [number, setNumber] = useState("INV-001");
  const [items, setItems] = useState([{ desc: "Service", qty: 1, price: 100 }]);
  const [taxRate, setTaxRate] = useState(0);
  const s = useResultState();
  const subtotal = items.reduce((a, i) => a + i.qty * i.price, 0);
  const tax = (subtotal * taxRate) / 100;
  const total = subtotal + tax;

  const run = async () => {
    s.setLoading(true);
    try {
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const pdf = await PDFDocument.create();
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
      const page = pdf.addPage([595, 842]);
      let y = 800;
      page.drawText("INVOICE", { x: 50, y, size: 28, font: bold, color: rgb(0.49, 0.23, 0.93) });
      y -= 30;
      page.drawText(`Invoice #${number}`, { x: 50, y, size: 12, font });
      y -= 40;
      page.drawText("From:", { x: 50, y, size: 11, font: bold });
      from
        .split("\n")
        .forEach((line, i) => page.drawText(line, { x: 50, y: y - 15 - i * 14, size: 10, font }));
      page.drawText("Bill To:", { x: 320, y, size: 11, font: bold });
      to.split("\n").forEach((line, i) =>
        page.drawText(line, { x: 320, y: y - 15 - i * 14, size: 10, font }),
      );
      y -= 90;
      page.drawText("Description", { x: 50, y, size: 10, font: bold });
      page.drawText("Qty", { x: 350, y, size: 10, font: bold });
      page.drawText("Price", { x: 420, y, size: 10, font: bold });
      page.drawText("Amount", { x: 500, y, size: 10, font: bold });
      y -= 5;
      page.drawLine({
        start: { x: 50, y },
        end: { x: 545, y },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });
      y -= 18;
      items.forEach((item) => {
        page.drawText(item.desc.slice(0, 40), { x: 50, y, size: 10, font });
        page.drawText(String(item.qty), { x: 350, y, size: 10, font });
        page.drawText(`$${item.price.toFixed(2)}`, { x: 420, y, size: 10, font });
        page.drawText(`$${(item.qty * item.price).toFixed(2)}`, { x: 500, y, size: 10, font });
        y -= 18;
      });
      y -= 10;
      page.drawText(`Subtotal: $${subtotal.toFixed(2)}`, { x: 420, y, size: 10, font });
      y -= 16;
      if (taxRate > 0) {
        page.drawText(`Tax (${taxRate}%): $${tax.toFixed(2)}`, { x: 420, y, size: 10, font });
        y -= 16;
      }
      page.drawText(`Total: $${total.toFixed(2)}`, { x: 420, y, size: 12, font: bold });
      const blob = new Blob([await pdf.save()], { type: "application/pdf" });
      s.setResult({
        blob,
        filename: `${number}.pdf`,
        mimeType: "application/pdf",
        measurements: [
          { label: "Subtotal", value: `$${subtotal.toFixed(2)}` },
          { label: "Tax", value: `$${tax.toFixed(2)}` },
          { label: "Total", value: `$${total.toFixed(2)}` },
        ],
      });
    } catch (e) {
      console.error(e);
    } finally {
      s.setLoading(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-sm text-muted-foreground">
          From{" "}
          <textarea
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-ring resize-y"
          />
        </label>
        <label className="text-sm text-muted-foreground">
          Bill To{" "}
          <textarea
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-ring resize-y"
          />
        </label>
      </div>
      <label className="mt-2 block text-sm text-muted-foreground">
        Invoice #{" "}
        <input
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus-ring"
        />
      </label>
      <div className="mt-3 space-y-2">
        {items.map((item, i) => (
          <div key={i} className="grid grid-cols-12 gap-2">
            <input
              value={item.desc}
              onChange={(e) =>
                setItems(items.map((it, j) => (j === i ? { ...it, desc: e.target.value } : it)))
              }
              placeholder="Description"
              className="col-span-6 rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground focus-ring"
            />
            <input
              type="number"
              value={item.qty}
              onChange={(e) =>
                setItems(items.map((it, j) => (j === i ? { ...it, qty: +e.target.value } : it)))
              }
              className="col-span-2 rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground focus-ring"
            />
            <input
              type="number"
              value={item.price}
              onChange={(e) =>
                setItems(items.map((it, j) => (j === i ? { ...it, price: +e.target.value } : it)))
              }
              className="col-span-3 rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground focus-ring"
            />
            <button
              onClick={() => setItems(items.filter((_, j) => j !== i))}
              className="col-span-1 rounded-lg text-muted-foreground hover:text-destructive"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={() => setItems([...items, { desc: "", qty: 1, price: 0 }])}
        className="mt-2 text-sm text-primary hover:underline"
      >
        + Add line item
      </button>
      <label className="mt-3 block text-sm text-muted-foreground">
        Tax rate (%){" "}
        <input
          type="number"
          value={taxRate}
          onChange={(e) => setTaxRate(+e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus-ring"
        />
      </label>
      <div className="mt-3 rounded-lg bg-surface px-3 py-3 text-right">
        <p className="text-sm text-muted-foreground">Total</p>
        <p className="text-2xl font-bold text-foreground">${total.toFixed(2)}</p>
      </div>
      <RunButton onClick={run} loading={s.loading} label="Generate PDF" />
      {s.result && (
        <div className="mt-4">
          <ResultPanel result={s.result} onReset={() => s.setResult(null)} />
        </div>
      )}
    </div>
  );
}
