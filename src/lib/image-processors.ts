// Image processors using Canvas — all run locally in the browser.
export async function loadImage(file: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export type ImageFormat = "png" | "jpeg" | "webp";

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: ImageFormat,
  quality = 0.92,
): Promise<Blob> {
  const mime = format === "png" ? "image/png" : format === "jpeg" ? "image/jpeg" : "image/webp";
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas encoding failed"))),
      mime,
      quality,
    );
  });
}

export function getCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  return canvas;
}

export async function resizeImage(
  file: Blob,
  opts: {
    width?: number;
    height?: number;
    percent?: number;
    maxEdge?: number;
    fit?: "stretch" | "contain";
  },
  format: ImageFormat = "png",
  quality = 0.92,
): Promise<{ blob: Blob; width: number; height: number }> {
  const img = await loadImage(file);
  let w = img.naturalWidth;
  let h = img.naturalHeight;

  if (opts.percent) {
    w = Math.round((w * opts.percent) / 100);
    h = Math.round((h * opts.percent) / 100);
  } else if (opts.maxEdge) {
    const scale = Math.min(1, opts.maxEdge / Math.max(w, h));
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  } else if (opts.width && opts.height) {
    if (opts.fit === "contain") {
      const scale = Math.min(opts.width / w, opts.height / h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    } else {
      w = opts.width;
      h = opts.height;
    }
  } else if (opts.width) {
    const scale = opts.width / w;
    w = opts.width;
    h = Math.round(h * scale);
  } else if (opts.height) {
    const scale = opts.height / h;
    h = opts.height;
    w = Math.round(w * scale);
  }

  w = Math.max(1, w);
  h = Math.max(1, h);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  if (format === "jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
  }
  ctx.drawImage(img, 0, 0, w, h);
  const blob = await canvasToBlob(canvas, format, quality);
  return { blob, width: w, height: h };
}

export async function compressImage(
  file: Blob,
  format: ImageFormat,
  quality: number,
): Promise<{ blob: Blob; width: number; height: number }> {
  const img = await loadImage(file);
  const canvas = getCanvas(img);
  if (format === "jpeg") {
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  }
  const blob = await canvasToBlob(canvas, format, quality);
  return { blob, width: canvas.width, height: canvas.height };
}

export async function convertImage(
  file: Blob,
  format: ImageFormat,
  quality = 0.92,
  bg?: string,
): Promise<{ blob: Blob; width: number; height: number }> {
  const img = await loadImage(file);
  const canvas = getCanvas(img);
  if (format === "jpeg" && bg) {
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  }
  const blob = await canvasToBlob(canvas, format, quality);
  return { blob, width: canvas.width, height: canvas.height };
}

export async function rotateImage(
  file: Blob,
  degrees: 90 | 180 | 270,
  flipH?: boolean,
  flipV?: boolean,
  format: ImageFormat = "png",
): Promise<{ blob: Blob; width: number; height: number }> {
  const img = await loadImage(file);
  const w = degrees === 90 || degrees === 270 ? img.naturalHeight : img.naturalWidth;
  const h = degrees === 90 || degrees === 270 ? img.naturalWidth : img.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.translate(w / 2, h / 2);
  ctx.rotate((degrees * Math.PI) / 180);
  if (flipH) ctx.scale(-1, 1);
  if (flipV) ctx.scale(1, -1);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  const blob = await canvasToBlob(canvas, format);
  return { blob, width: w, height: h };
}

export async function adjustImage(
  file: Blob,
  opts: { brightness: number; contrast: number; saturation: number; grayscale: boolean },
  format: ImageFormat = "png",
): Promise<{ blob: Blob; width: number; height: number }> {
  const img = await loadImage(file);
  const canvas = getCanvas(img);
  const ctx = canvas.getContext("2d")!;
  ctx.filter = `brightness(${opts.brightness}%) contrast(${opts.contrast}%) saturate(${opts.saturation}%)${opts.grayscale ? " grayscale(100%)" : ""}`;
  ctx.drawImage(img, 0, 0);
  const blob = await canvasToBlob(canvas, format);
  return { blob, width: canvas.width, height: canvas.height };
}

export async function roundCorners(
  file: Blob,
  radius: number,
  format: ImageFormat = "png",
): Promise<{ blob: Blob; width: number; height: number }> {
  const img = await loadImage(file);
  const canvas = getCanvas(img);
  const ctx = canvas.getContext("2d")!;
  const r = radius === -1 ? Math.min(canvas.width, canvas.height) / 2 : radius;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.arcTo(canvas.width, 0, canvas.width, canvas.height, r);
  ctx.arcTo(canvas.width, canvas.height, 0, canvas.height, r);
  ctx.arcTo(0, canvas.height, 0, 0, r);
  ctx.arcTo(0, 0, canvas.width, 0, r);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, 0, 0);
  ctx.restore();
  const blob = await canvasToBlob(canvas, format);
  return { blob, width: canvas.width, height: canvas.height };
}

export async function extractPalette(file: Blob, count = 6): Promise<string[]> {
  const img = await loadImage(file);
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, 100 / Math.max(img.naturalWidth, img.naturalHeight));
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const buckets: Record<string, { count: number; r: number; g: number; b: number }> = {};
  for (let i = 0; i < data.length; i += 4) {
    const r = Math.round(data[i] / 32) * 32;
    const g = Math.round(data[i + 1] / 32) * 32;
    const b = Math.round(data[i + 2] / 32) * 32;
    const key = `${r},${g},${b}`;
    if (!buckets[key]) buckets[key] = { count: 0, r, g, b };
    buckets[key].count++;
  }
  return Object.values(buckets)
    .sort((a, b) => b.count - a.count)
    .slice(0, count)
    .map((c) => rgbToHex(c.r, c.g, c.b));
}

export function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" + [r, g, b].map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, "0")).join("")
  );
}

export function getImageMetadata(file: File): {
  width: number;
  height: number;
  type: string;
  size: number;
} {
  // Synchronous-ish metadata from file; dimensions resolved async by caller
  return { width: 0, height: 0, type: file.type, size: file.size };
}
