import type { SurfaceFn, SurfaceKind, Vec2 } from '../types.js';

/**
 * Named bezel cross-section profiles.
 *
 * Each takes a normalized distance from the side (0 = outer edge, 1 = end of
 * bezel) and returns the glass height in 0..1. See
 * ../../../docs/reference/concepts/surface-functions.md.
 *
 * NOTE: these profiles are a clean-room expression of the documented technique;
 * exact curves are tuned during Phase 1 against the reference simulation.
 */
export const surfaces: Record<'convex' | 'concave' | 'lip' | 'flat', SurfaceFn> = {
  /** Bulges outward — keeps refracted rays inside the object (default). */
  convex: (d) => Math.sqrt(Math.max(0, 1 - (1 - d) * (1 - d))),
  /** Caves inward — pushes rays outside the object. */
  concave: (d) => 1 - Math.sqrt(Math.max(0, 1 - d * d)),
  /** Convex outside + concave middle — switch-style lip. */
  lip: (d) => {
    const convex = Math.sqrt(Math.max(0, 1 - (1 - d) * (1 - d)));
    const dip = 0.5 - 0.5 * Math.cos(Math.PI * d);
    return 0.6 * convex + 0.4 * dip;
  },
  /** Linear ramp — subtle effect. */
  flat: (d) => d,
};

/** Resolve a {@link SurfaceKind} to a concrete height function. */
export function resolveSurface(kind: SurfaceKind): SurfaceFn {
  return typeof kind === 'function' ? kind : surfaces[kind];
}

/**
 * Surface normal at a distance, via a numerical derivative of the height
 * function rotated by −90°. See docs/reference/concepts/surface-functions.md.
 */
export function surfaceNormal(f: SurfaceFn, distanceFromSide: number, delta = 0.001): Vec2 {
  const y1 = f(distanceFromSide - delta);
  const y2 = f(distanceFromSide + delta);
  const derivative = (y2 - y1) / (2 * delta);
  // derivative vector (1, derivative) rotated by -90° → (-derivative, 1), normalized
  const nx = -derivative;
  const ny = 1;
  const len = Math.hypot(nx, ny) || 1;
  return { x: nx / len, y: ny / len };
}
