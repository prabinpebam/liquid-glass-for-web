# API Reference

> Target API for `@liquid-glass/core`. Signatures may evolve until `0.1.0`
> (see [../PROJECT-PLAN.md](../PROJECT-PLAN.md)).

## `liquidGlass(element, options?) → LiquidGlassHandle`

Applies the effect to `element` and returns a handle to control it.

```ts
function liquidGlass(
  element: HTMLElement,
  options?: LiquidGlassOptions
): LiquidGlassHandle;
```

## `LiquidGlassOptions`

| Option | Type | Default | Description |
|---|---|---|---|
| `width` | `number` | element width | Filter image width (px). Auto-synced if omitted. |
| `height` | `number` | element height | Filter image height (px). |
| `radius` | `number` | `24` | Corner radius (px). |
| `bezel` | `number` | `18` | Bezel width (px) — the refractive rim. |
| `thickness` | `number` | `1.5` | Refractive index (glass ≈ 1.5). |
| `surface` | `SurfaceKind` | `'convex'` | Bezel cross-section profile or custom fn. |
| `scale` | `number` | `1` | Effect strength, `0..1`. |
| `chromatic` | `number` | `1` | RGB refraction split. The default maps red/blue to +/-20% of the displacement strength. |
| `blur` | `number` | `0` | Backdrop blur (px). |
| `specular` | `SpecularOptions` | see below | Rim-light settings. |
| `mode` | `'filter' \| 'backdrop'` | `'backdrop'` | Apply mode. `backdrop` is Chromium-only. |
| `fallback` | `'blur' \| 'none'` | `'blur'` | Behavior when `backdrop` unsupported. |

### `SurfaceKind`

```ts
type SurfaceKind = 'convex' | 'concave' | 'lip' | 'flat' | SurfaceFn;
type SurfaceFn = (distanceFromSide: number /* 0..1 */) => number /* height */;
```

### `SpecularOptions`

| Field | Type | Default | Description |
|---|---|---|---|
| `opacity` | `number` | `0.4` | Highlight strength. |
| `saturation` | `number` | `6` | Highlight color saturation. |
| `angle` | `number` | `Math.PI/3` | Light direction (radians). |

## `LiquidGlassHandle`

```ts
interface LiquidGlassHandle {
  /** Reconfigure; rebuilds maps only when geometry/material changes. */
  update(partial: Partial<LiquidGlassOptions>): void;
  /** Cheap fade — animates filter `scale`, no map rebuild. */
  setScale(scale: number): void;
  /** Remove filter, observers, and release shared resources. */
  dispose(): void;
}
```

## React — `@liquid-glass/react`

```ts
function useLiquidGlass(
  ref: RefObject<HTMLElement>,
  options?: LiquidGlassOptions
): LiquidGlassHandle | null;

const LiquidGlass: React.FC<LiquidGlassOptions & { as?: keyof JSX.IntrinsicElements }>;
```

## Web component — `@liquid-glass/web-component`

`<liquid-glass>` reflects options as attributes: `radius`, `bezel`, `thickness`,
`surface`, `scale`, `chromatic`, `blur`, `mode`, `specular-opacity`, `specular-saturation`,
`specular-angle`.

## Low-level (advanced)

The pure building blocks are exported for custom pipelines:

```ts
import {
  refract,                 // Snell's law
  surfaces,                // named height functions
  buildDisplacementField,  // → normalized field + maxDisplacement
  toDisplacementMap,       // field → RGBA data URL
  toSpecularMap,           // → RGBA data URL
  buildFilter,             // → <filter> element + id
} from '@liquid-glass/core';
```
