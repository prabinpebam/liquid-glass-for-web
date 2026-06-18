import type { DisplacementField, GeneratedMap } from '../types.js';

export interface MapGeometry {
  width: number;
  height: number;
  radius: number;
  bezel: number;
}

/**
 * Encode a normalized displacement field into an RGBA displacement-map image
 * (R = X displacement, G = Y displacement, 128 = neutral). The direction at each
 * pixel is the inward border normal; the magnitude is looked up from the field
 * by the pixel's normalized distance into the bezel.
 *
 * See ../../../docs/concepts/displacement-map.md.
 *
 * @remarks Phase 2: raster pipeline. The rounded-rectangle distance field below
 * is a clean-room implementation and is verified by pixel-snapshot tests during
 * Phase 2 (see PROJECT-PLAN.md). Requires a DOM/canvas (or OffscreenCanvas).
 */
export function toDisplacementMap(
  field: DisplacementField,
  geo: MapGeometry,
): GeneratedMap {
  const { ctx, canvas } = createCanvas(geo.width, geo.height);
  const img = ctx.createImageData(geo.width, geo.height);
  const data = img.data;

  const { width, height, radius, bezel } = geo;
  const samples = field.samples;
  const n = samples.length;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const edge = roundedRectEdge(x + 0.5, y + 0.5, width, height, radius);
      // distance into the bezel, normalized 0..1 (0 at outer edge)
      const t = bezel <= 0 ? 1 : clamp(edge.distance / bezel, 0, 1);

      let r = 128;
      let g = 128;
      if (edge.distance >= 0 && edge.distance <= bezel && n > 0) {
        const s = sampleAt(samples, t);
        // direction = inward border normal; magnitude from the field
        const dx = edge.nx * s.magnitude;
        const dy = edge.ny * s.magnitude;
        r = 128 + dx * 127;
        g = 128 + dy * 127;
      }

      data[i] = clamp(Math.round(r), 0, 255);
      data[i + 1] = clamp(Math.round(g), 0, 255);
      data[i + 2] = 128; // Blue ignored
      data[i + 3] = 255; // opaque
    }
  }

  ctx.putImageData(img, 0, 0);
  return { dataUrl: toDataUrl(canvas), width, height };
}

/** Linear sample of the normalized half-slice at t in 0..1. */
function sampleAt(samples: DisplacementField['samples'], t: number) {
  const n = samples.length;
  const f = t * (n - 1);
  const i0 = Math.floor(f);
  const i1 = Math.min(n - 1, i0 + 1);
  const frac = f - i0;
  const a = samples[i0]!;
  const b = samples[i1]!;
  return {
    angle: a.angle + (b.angle - a.angle) * frac,
    magnitude: a.magnitude + (b.magnitude - a.magnitude) * frac,
  };
}

/**
 * Distance from a point to the nearest edge of a rounded rectangle, plus the
 * inward unit normal at that nearest edge. Distance is 0 on the border and grows
 * inward.
 */
function roundedRectEdge(
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
): { distance: number; nx: number; ny: number } {
  const r = Math.min(radius, w / 2, h / 2);
  // signed distance to a rounded rect centered at (w/2, h/2)
  const px = x - w / 2;
  const py = y - h / 2;
  const qx = Math.abs(px) - (w / 2 - r);
  const qy = Math.abs(py) - (h / 2 - r);
  const ax = Math.max(qx, 0);
  const ay = Math.max(qy, 0);
  const outside = Math.hypot(ax, ay);
  const inside = Math.min(Math.max(qx, qy), 0);
  const sdf = outside + inside - r; // negative inside
  const distance = -sdf; // positive inside, 0 on border

  // gradient of the SDF ≈ outward normal; inward normal is its negation
  const gx = sign(px) * (qx > qy ? 1 : 0);
  const gy = sign(py) * (qy >= qx ? 1 : 0);
  let nx = -gx;
  let ny = -gy;
  const len = Math.hypot(nx, ny);
  if (len === 0) {
    nx = 0;
    ny = 0;
  } else {
    nx /= len;
    ny /= len;
  }
  return { distance, nx, ny };
}

function sign(v: number): number {
  return v < 0 ? -1 : 1;
}
function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

// --- canvas helpers (DOM or OffscreenCanvas) ---------------------------------

interface Canvas2D {
  canvas: HTMLCanvasElement | OffscreenCanvas;
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
}

function createCanvas(w: number, h: number): Canvas2D {
  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('liquid-glass: 2D context unavailable');
    return { canvas, ctx };
  }
  if (typeof document === 'undefined') {
    throw new Error('liquid-glass: map generation requires a DOM or OffscreenCanvas');
  }
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('liquid-glass: 2D context unavailable');
  return { canvas, ctx };
}

function toDataUrl(canvas: HTMLCanvasElement | OffscreenCanvas): string {
  if (canvas instanceof HTMLCanvasElement) return canvas.toDataURL('image/png');
  // OffscreenCanvas: convertToBlob is async; for sync data URL we fall back to a
  // DOM canvas when available. Phase 2 will add an async generation path.
  throw new Error('liquid-glass: OffscreenCanvas sync data URL not yet supported (Phase 2)');
}
