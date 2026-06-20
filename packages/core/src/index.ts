/**
 * @liquid-glass/core — framework-agnostic liquid glass refraction engine.
 *
 * Public entry point. See ../../docs/reference/api-reference.md.
 */

// Orchestration
export { liquidGlass } from './glass.js';

// Building blocks (advanced / custom pipelines)
export { surfaces, resolveSurface, surfaceNormal } from './surface/index.js';
export { refract } from './refraction/snell.js';
export { buildDisplacementField } from './refraction/displacement-field.js';
export { normalizeField } from './refraction/normalize.js';
export { toDisplacementMap } from './maps/displacement-map.js';
export { toSpecularMap } from './maps/specular-map.js';
export { buildFilter, nextFilterId } from './filter/svg-filter.js';

// Types
export type {
  Vec2,
  PolarVector,
  SurfaceFn,
  SurfaceKind,
  SpecularOptions,
  ApplyMode,
  FallbackMode,
  LiquidGlassOptions,
  ResolvedOptions,
  DisplacementField,
  GeneratedMap,
  LiquidGlassHandle,
} from './types.js';
export type { RefractResult } from './refraction/snell.js';
export type { MapGeometry } from './maps/displacement-map.js';
export type { FilterSpec } from './filter/svg-filter.js';
