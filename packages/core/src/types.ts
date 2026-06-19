/**
 * Shared types for the liquid-glass engine.
 * See ../../docs/api-reference.md for the documented contract.
 */

/** A 2D vector. */
export interface Vec2 {
  x: number;
  y: number;
}

/** A polar displacement vector: a direction angle (radians) and a magnitude. */
export interface PolarVector {
  angle: number;
  magnitude: number;
}

/**
 * Bezel cross-section height function.
 * @param distanceFromSide normalized distance from the outer edge, 0..1
 *   (0 = outer edge, 1 = end of bezel / start of flat top)
 * @returns glass height at that point (relative units)
 */
export type SurfaceFn = (distanceFromSide: number) => number;

/** Named bezel profiles, or a custom height function. */
export type SurfaceKind = 'convex' | 'concave' | 'lip' | 'flat' | SurfaceFn;

export interface SpecularOptions {
  /** Highlight strength (0..1-ish). */
  opacity?: number;
  /** Highlight color saturation. */
  saturation?: number;
  /** Light direction in radians. */
  angle?: number;
}

export type ApplyMode = 'filter' | 'backdrop';
export type FallbackMode = 'blur' | 'none';

export interface LiquidGlassOptions {
  /** Filter image width (px). Defaults to the element width and auto-syncs. */
  width?: number;
  /** Filter image height (px). Defaults to the element height and auto-syncs. */
  height?: number;
  /** Corner radius (px). */
  radius?: number;
  /** Bezel width (px) — the refractive rim. */
  bezel?: number;
  /** Refractive index (glass ≈ 1.5). */
  thickness?: number;
  /** Bezel cross-section profile or a custom function. */
  surface?: SurfaceKind;
  /** Effect strength, 0..1. */
  scale?: number;
  /** RGB refraction split, normalized against displacement strength. */
  chromatic?: number;
  /** Backdrop blur (px). */
  blur?: number;
  /** Rim-light settings. */
  specular?: SpecularOptions;
  /** Apply mode. `backdrop` is Chromium-only. */
  mode?: ApplyMode;
  /** Behavior when `backdrop` is unsupported. */
  fallback?: FallbackMode;
}

/** Fully-resolved options (all defaults applied). */
export type ResolvedOptions = Required<Omit<LiquidGlassOptions, 'specular'>> & {
  specular: Required<SpecularOptions>;
};

/** A normalized displacement field plus the max displacement (in px). */
export interface DisplacementField {
  /** Normalized polar vectors sampled along one radius (half-slice). */
  samples: PolarVector[];
  /** Maximum displacement in pixels — reused as the SVG filter `scale`. */
  maxDisplacement: number;
  /** Number of radial samples. */
  resolution: number;
}

/** A generated raster map ready to feed an `<feImage>`. */
export interface GeneratedMap {
  dataUrl: string;
  width: number;
  height: number;
}

/** Handle returned by `liquidGlass()` to control an instance. */
export interface LiquidGlassHandle {
  /** Reconfigure; rebuilds maps only when geometry/material changes. */
  update(partial: Partial<LiquidGlassOptions>): void;
  /** Cheap fade — animates the filter `scale`, no map rebuild. */
  setScale(scale: number): void;
  /** Remove the filter, observers, and release shared resources. */
  dispose(): void;
}
