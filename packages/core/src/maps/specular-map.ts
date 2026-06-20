import type { DisplacementField, GeneratedMap, SpecularOptions } from '../types.js';
import type { MapGeometry } from './displacement-map.js';

/**
 * Render the specular rim-light highlight to its own RGBA image (used as a
 * second `<feImage>` input and blended over the refracted result).
 *
 * Intensity is concentrated near the rim and modulated by the surface normal
 * versus the configured light `angle`. See
 * ../../../docs/reference/concepts/specular-highlight.md.
 *
 * @remarks Phase 2: this is a clean-room placeholder of the documented rim-light
 * model. The exact falloff/curve is tuned during Phase 2 against the reference
 * (see PROJECT-PLAN.md). Requires a DOM/canvas.
 */
export function toSpecularMap(
  _field: DisplacementField,
  geo: MapGeometry,
  specular: Required<SpecularOptions>,
): GeneratedMap {
  if (typeof document === 'undefined') {
    throw new Error('liquid-glass: specular map generation requires a DOM');
  }
  const canvas = document.createElement('canvas');
  canvas.width = geo.width;
  canvas.height = geo.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('liquid-glass: 2D context unavailable');

  // TODO(phase-2): compute per-pixel rim intensity from the surface normal vs
  // `specular.angle`, scaled by `specular.opacity`/`specular.saturation`.
  // Placeholder: transparent map (no highlight) so the pipeline composes.
  ctx.clearRect(0, 0, geo.width, geo.height);

  return { dataUrl: canvas.toDataURL('image/png'), width: geo.width, height: geo.height };
}
