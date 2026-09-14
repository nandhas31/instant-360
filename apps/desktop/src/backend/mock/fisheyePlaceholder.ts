/**
 * Generates placeholder thumbnails for the mock backend. Real thumbnails
 * will come from the Rust/SDK side once it exists; these are deterministic
 * per clip id so the same clip always renders the same image.
 *
 * Drawing goes through OffscreenCanvas/canvas when a 2D context is
 * available (any real browser). Headless test environments (jsdom has a
 * `<canvas>` element but no rendering backend) fall back to an equivalent
 * inline SVG data URL so thumbnail generation never throws.
 */

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function hue(seed: number): number {
  return seed % 360;
}

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

function get2dContext(
  canvas: OffscreenCanvas | HTMLCanvasElement,
): OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null {
  return canvas.getContext("2d");
}

function createCanvas(
  width: number,
  height: number,
): { canvas: OffscreenCanvas | HTMLCanvasElement; ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D } | null {
  let canvas: OffscreenCanvas | HTMLCanvasElement;
  if (typeof OffscreenCanvas !== "undefined") {
    canvas = new OffscreenCanvas(width, height);
  } else {
    const el = document.createElement("canvas");
    el.width = width;
    el.height = height;
    canvas = el;
  }

  const ctx = get2dContext(canvas);
  return ctx ? { canvas, ctx } : null;
}

async function canvasToDataUrl(
  canvas: OffscreenCanvas | HTMLCanvasElement,
): Promise<string> {
  if (canvas instanceof HTMLCanvasElement) {
    return canvas.toDataURL("image/png");
  }
  const blob = await canvas.convertToBlob({ type: "image/png" });
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      reject(new Error("Failed to read placeholder blob"));
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Draws two circular "fisheye" lenses side by side on a rectangular frame,
 * matching the composite layout the real backend will produce from an
 * .insv file's two lens tracks.
 */
export async function generateDualFisheyePlaceholder(seed: string): Promise<string> {
  const width = 640;
  const height = 320;
  const seedNum = hashSeed(seed);
  const baseHue = hue(seedNum);

  const canvasResult = createCanvas(width, height);
  if (!canvasResult) return dualFisheyeSvgFallback(width, height, baseHue);

  const { canvas, ctx } = canvasResult;

  ctx.fillStyle = "#111318";
  ctx.fillRect(0, 0, width, height);

  const radius = height / 2 - 12;
  const centers = [width / 4, (3 * width) / 4];

  centers.forEach((cx, index) => {
    const cy = height / 2;
    const lensHue = (baseHue + index * 40) % 360;

    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    gradient.addColorStop(0, `hsl(${lensHue}, 55%, 42%)`);
    gradient.addColorStop(0.7, `hsl(${lensHue}, 50%, 28%)`);
    gradient.addColorStop(1, `hsl(${lensHue}, 45%, 14%)`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  ctx.moveTo(width / 2, 0);
  ctx.lineTo(width / 2, height);
  ctx.stroke();

  return await canvasToDataUrl(canvas);
}

/** Draws a plain flattened-frame placeholder for non-360 (flat) clips. */
export async function generateFlatPlaceholder(seed: string): Promise<string> {
  const width = 640;
  const height = 360;
  const seedNum = hashSeed(seed);
  const baseHue = hue(seedNum);

  const canvasResult = createCanvas(width, height);
  if (!canvasResult) return flatSvgFallback(width, height, baseHue);

  const { canvas, ctx } = canvasResult;

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, `hsl(${baseHue}, 35%, 22%)`);
  gradient.addColorStop(1, `hsl(${(baseHue + 60) % 360}, 35%, 12%)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.beginPath();
  const cx = width / 2;
  const cy = height / 2;
  const r = 34;
  ctx.moveTo(cx - r / 2, cy - r);
  ctx.lineTo(cx - r / 2, cy + r);
  ctx.lineTo(cx + r, cy);
  ctx.closePath();
  ctx.fill();

  return await canvasToDataUrl(canvas);
}

function dualFisheyeSvgFallback(width: number, height: number, baseHue: number): string {
  const radius = height / 2 - 12;
  const cy = height / 2;
  const centers = [width / 4, (3 * width) / 4];
  const circles = centers
    .map((cx, index) => {
      const lensHue = (baseHue + index * 40) % 360;
      return `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="hsl(${lensHue},50%,28%)" stroke="rgba(255,255,255,0.18)" stroke-width="2" />`;
    })
    .join("");

  return svgToDataUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
      `<rect width="${width}" height="${height}" fill="#111318" />${circles}</svg>`,
  );
}

function flatSvgFallback(width: number, height: number, baseHue: number): string {
  const cx = width / 2;
  const cy = height / 2;
  const r = 34;
  const trianglePoints = `${cx - r / 2},${cy - r} ${cx - r / 2},${cy + r} ${cx + r},${cy}`;

  return svgToDataUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0" stop-color="hsl(${baseHue},35%,22%)" />` +
      `<stop offset="1" stop-color="hsl(${(baseHue + 60) % 360},35%,12%)" />` +
      `</linearGradient></defs>` +
      `<rect width="${width}" height="${height}" fill="url(#g)" />` +
      `<polygon points="${trianglePoints}" fill="rgba(255,255,255,0.85)" /></svg>`,
  );
}
