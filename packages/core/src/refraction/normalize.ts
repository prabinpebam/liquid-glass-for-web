import type { DisplacementField, PolarVector } from '../types.js';

/**
 * Normalize a set of polar displacement vectors so the maximum magnitude is 1,
 * keeping the original maximum (in px) so the displacement map can be decoded
 * back to real pixel shifts via the SVG filter `scale`.
 *
 * See ../../../docs/reference/concepts/displacement-field.md.
 */
export function normalizeField(samples: PolarVector[], resolution: number): DisplacementField {
  const maxDisplacement = samples.reduce((m, v) => Math.max(m, Math.abs(v.magnitude)), 0);
  const safeMax = maxDisplacement || 1;

  const normalized: PolarVector[] = samples.map((v) => ({
    angle: v.angle,
    magnitude: v.magnitude / safeMax,
  }));

  return { samples: normalized, maxDisplacement, resolution };
}
