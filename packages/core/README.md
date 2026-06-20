# @liquid-glass/core

Framework-agnostic engine for the **liquid glass** refraction effect — physically
based displacement maps driven by SVG filters, applied via `filter` or
`backdrop-filter`.

> Part of the [liquid-glass-for-web](../../README.md) project. For the full
> conceptual background see the [docs](../../docs/reference/README.md).

## Install

```bash
pnpm add @liquid-glass/core
```

## Quick start

```ts
import { liquidGlass } from '@liquid-glass/core';

const card = document.querySelector('.glass') as HTMLElement;

const handle = liquidGlass(card, {
  radius: 24,
  bezel: 16,
  thickness: 1.5,   // refractive index (glass ≈ 1.5)
   surface: 'convex',
   chromatic: 1,     // visible RGB split; +/-20% channel spread by default
  blur: 2,
  mode: 'backdrop', // Chromium-only; falls back to blur elsewhere
});

// Live tweaks
handle.update({ bezel: 24 });
handle.setScale(0.5); // cheap fade — no map rebuild
handle.dispose();     // remove filter + release shared resources
```

## How it works

1. **Surface** — a bezel cross-section height function (`convex`, `concave`,
   `lip`, `flat`, or custom).
2. **Refraction** — Snell's law deflects rays through the bezel to build a
   normalized displacement field.
3. **Maps** — the field is rasterized into an RGBA displacement map (R = X,
   G = Y) plus an optional specular rim-light map.
4. **Filter** — an SVG `<filter>` graph (`feImage` → `feDisplacementMap` or
   RGB-split displacement → `feBlend`) is generated and shared in a single
   hidden `<defs>` host.
5. **Apply** — the filter is attached via `backdrop-filter: url(#id)` (Chromium)
   or `filter: url(#id)` (cross-browser).

See [docs/reference/architecture.md](../../docs/reference/architecture.md).

## API

| Export | Purpose |
| --- | --- |
| `liquidGlass(el, options)` | Apply the effect; returns a `LiquidGlassHandle`. |
| `surfaces`, `resolveSurface`, `surfaceNormal` | Bezel profiles + normals. |
| `refract` | Snell's-law primitive. |
| `buildDisplacementField` | Surface → normalized displacement field. |
| `toDisplacementMap`, `toSpecularMap` | Field → RGBA maps. |
| `buildFilter`, `nextFilterId` | Field/maps → SVG `<filter>`. |

Full reference: [docs/reference/api-reference.md](../../docs/reference/api-reference.md).

## Status

Phase 1 (pure refraction math) is implemented. Phase 2 (raster map tuning +
pixel-snapshot verification against the reference) is in progress — see
[PROJECT-PLAN.md](../../PROJECT-PLAN.md).

## License

MIT. Clean-room implementation from documented concepts; see
[docs/reference/attribution.md](../../docs/reference/attribution.md).
