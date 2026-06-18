import type { DisplacementField, PolarVector, SurfaceFn } from '../types.js';
import { surfaceNormal } from '../surface/index.js';
import { refract } from './snell.js';
import { normalizeField } from './normalize.js';

/**
 * Build the normalized displacement field along a single radius (half-slice).
 *
 * For each sampled distance from the border we read the surface normal, refract
 * an orthogonal incident ray through it (Snell's law), and measure how far the
 * refracted ray lands compared with a straight-through ray. The result is a set
 * of polar vectors that are normalized so the largest magnitude is 1, with the
 * original maximum (in px) kept for the SVG filter `scale`.
 *
 * See ../../../docs/concepts/displacement-field.md.
 *
 * @param f          bezel height function (0..1 → height)
 * @param bezelPx    bezel width in pixels (the refractive rim)
 * @param indexRatio refractive index of the glass (ambient air = 1)
 * @param resolution number of radial samples (reference uses 127)
 */
export function buildDisplacementField(
  f: SurfaceFn,
  bezelPx: number,
  indexRatio: number,
  resolution = 127,
): DisplacementField {
  const samples: PolarVector[] = [];

  for (let i = 0; i < resolution; i++) {
    const d = resolution <= 1 ? 0 : i / (resolution - 1); // 0..1 across the bezel
    const normal = surfaceNormal(f, d);

    // Angle between the orthogonal incident ray (pointing along +y/into surface)
    // and the surface normal.
    const incidence = Math.acos(clamp(normal.y, -1, 1));

    const r = refract(incidence, 1, indexRatio);
    if (r.totalInternalReflection || r.angle === null) {
      // No transmission: treat as zero displacement at this sample.
      samples.push({ angle: orthoAngle(normal), magnitude: 0 });
      continue;
    }

    // Lateral shift of the refracted ray as it traverses the bezel thickness.
    // Direction is orthogonal to the border (radial), per the circle symmetry.
    const deviation = incidence - r.angle; // how much the ray turned
    const magnitudePx = Math.tan(deviation) * bezelPx;

    samples.push({ angle: orthoAngle(normal), magnitude: magnitudePx });
  }

  return normalizeField(samples, resolution);
}

/** Direction orthogonal to the border at this normal (radial outward). */
function orthoAngle(normal: { x: number; y: number }): number {
  return Math.atan2(normal.y, normal.x);
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
