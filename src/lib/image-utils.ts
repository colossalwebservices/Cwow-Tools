// Browser-only image helpers using Canvas. All functions must be called
// after hydration (they touch document/canvas).

export async function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () =>
        reject(new Error("Could not load image. The format may not be supported by this browser."));
      img.src = url;
    });
  } finally {
    // revoke after the image has decoded
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }
}

export type ImageFormat = "image/jpeg" | "image/png" | "image/webp";

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: ImageFormat,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("This browser could not encode the image in the requested format."));
      },
      type,
      quality,
    );
  });
}

export function getExtForMime(mime: string): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "png";
}

export function baseName(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot > 0 ? filename.slice(0, dot) : filename;
}

// Compute resize dimensions preserving aspect ratio.
export function computeResize(
  srcW: number,
  srcH: number,
  opts: {
    mode: "dimensions" | "percent" | "maxEdge";
    width?: number;
    height?: number;
    percent?: number;
    maxEdge?: number;
  },
): { width: number; height: number } {
  if (opts.mode === "dimensions" && opts.width && opts.height) {
    return { width: Math.round(opts.width), height: Math.round(opts.height) };
  }
  if (opts.mode === "percent" && opts.percent) {
    return {
      width: Math.max(1, Math.round((srcW * opts.percent) / 100)),
      height: Math.max(1, Math.round((srcH * opts.percent) / 100)),
    };
  }
  if (opts.mode === "maxEdge" && opts.maxEdge) {
    const longest = Math.max(srcW, srcH);
    if (longest <= opts.maxEdge) return { width: srcW, height: srcH };
    const scale = opts.maxEdge / longest;
    return {
      width: Math.max(1, Math.round(srcW * scale)),
      height: Math.max(1, Math.round(srcH * scale)),
    };
  }
  return { width: srcW, height: srcH };
}
