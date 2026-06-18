# Liquid Glass for Web

A reusable, framework-agnostic **liquid glass** (Apple-style refractive glass) effect
library for any web project. It generates physically-based SVG displacement maps and
specular highlights and applies them as CSS `filter` / `backdrop-filter`, exposing a
small API plus framework wrappers and ready-made components.

> Status: **early scaffolding.** See [PROJECT-PLAN.md](PROJECT-PLAN.md) for the roadmap
> and [docs/](docs/) for concepts and API design.

---

## Repository layout

```
liquid-glass-for-web/
├── PROJECT-PLAN.md         Detailed, phased build plan
├── docs/                   Documentation (concepts, guides, API, compatibility)
├── packages/               The library (monorepo)
│   ├── core/               Framework-agnostic engine (TypeScript)
│   ├── react/              React bindings
│   └── web-component/      <liquid-glass> custom element
├── examples/               Runnable demos that consume the library
└── source-reference/       The faithful OFFLINE reproduction of the original
                            article used as a study/reference (not shipped)
```

## What's here today

- **`source-reference/`** — a complete, fully offline reproduction of the original
  article *"Liquid Glass in the Browser: Refraction with CSS and SVG"* by kube.io.
  It is the empirical reference we study to build the library. See
  [source-reference/README.md](source-reference/README.md) to run it.
- **`docs/`** — the distilled technique (refraction math, surface functions,
  displacement maps, specular highlight, compositing) plus the planned public API.
- **`packages/core/`** — the typed skeleton of the engine.

## Quick start (planned API)

```ts
import { liquidGlass } from '@liquid-glass/core';

liquidGlass(document.querySelector('.panel'), {
  radius: 24,        // corner radius (px)
  bezel: 18,         // bezel width (px)
  thickness: 1.5,    // refractive index (glass ≈ 1.5)
  surface: 'convex', // 'convex' | 'concave' | 'lip' | 'flat'
  scale: 1,          // effect strength (0..1)
  specular: { opacity: 0.4, saturation: 6 },
});
```

## Attribution & licensing

The original effect, math write-up, and demos are by **kube.io**. The author has
stated the original code is *not yet open-source licensed*. This repository therefore
treats the article as a **conceptual reference only** and builds a **clean-room**
implementation from the documented physics and techniques (which are not
copyrightable). See [docs/attribution.md](docs/attribution.md) before shipping.
