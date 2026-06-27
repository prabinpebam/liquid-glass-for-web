# Liquid Glass for Web

Reusable, framework-agnostic **liquid glass** for web projects. This monorepo
generates physically based SVG displacement maps and specular highlights, then
applies them through CSS `filter` / `backdrop-filter` with small APIs for vanilla
JavaScript, React, custom elements, and token-driven UI.

**Live Design Library:** https://prabinpebam.github.io/liquid-glass-for-web/

## Repository Layout

```text
liquid-glass-for-web/
├── docs/                  GitHub Pages site (live Design Library) + reference docs
│   ├── index.html         Design Library app (Pages entry point)
│   ├── js/glass.js        Buildless runtime engine (port of @liquid-glass/core)
│   ├── js/ css/ assets/   Live components, styling, backgrounds
│   └── reference/         Architecture notes, concepts, API reference
├── apps/
│   └── playground/        Interactive low-level engine playground
├── examples/              Minimal consumer integration examples
├── packages/
│   ├── core/              Framework-agnostic TypeScript engine
│   ├── react/             React hook/component bindings
│   ├── element/           <liquid-glass> custom element
│   └── ui/                Token-driven Liquid Glass design library package
├── .github/workflows/     CI
├── package.json
└── pnpm-workspace.yaml
```

## Packages

- [`@liquid-glass/core`](packages/core/README.md): the engine and public
  `liquidGlass()` API.
- [`@liquid-glass/react`](packages/react/README.md): React bindings.
- [`@liquid-glass/element`](packages/element/README.md): custom element wrapper.
- [`@liquid-glass/ui`](packages/ui/README.md): tokens, atoms, components, and
  compound UI built on the shared engine.

## Apps

- [`docs`](docs): the public documentation and Design Library site.
- [`apps/playground`](apps/playground): interactive playground for low-level
  refraction parameters and engine experiments.

## Design Library

The hosted site is an interactive catalog of every glass surface — foundations,
atoms, elements, components, compounds, and layouts — rendered with the live
engine (no build step). It includes:

- A **Material Options** lab with live sliders for refraction inset, refraction,
  chromatic aberration, inner shadow, caustic glow, shadow angle, and tint.
- Theme switching (dark / light) and selectable backdrops (Stripes by default,
  Grid, and photos) to test refraction over different content.

Every glass element — buttons, cards, fields, toggles, the hero lens — is built
from a single canonical mechanism (`attachGlass()` in
[`docs/js/glass.js`](docs/js/glass.js)); components never reimplement the filter.

## Material model

Each material composes the same layered effect:

- **Refraction** — an SVG displacement map generated from a bezel surface
  function (Snell refraction), applied as `backdrop-filter`.
- **Specular rim** — the bright edge highlight is a generated specular map, never
  a CSS border.
- **Chromatic aberration** — RGB channel split, on by default.
- **Inner shadow + caustic glow** — a radius-scaled dark inset shadow (NW) and a
  white caustic glow (SE) that simulate glass thickness and light concentrating
  below the surface.
- **Frost** — gaussian blur of the refracted backdrop.
- **Tint** — optional accent color composited via `background-blend-mode`.

Named presets (`clear`, `optic`, `softFrost`, `satin`, `deepFrost`, `milk`) vary
only size-driven parameters; all share the one engine.

## Deployment

The Design Library is served from the `master` branch `/docs` folder via GitHub
Pages. `docs/index.html` is the committed entry point and `docs/.nojekyll`
disables Jekyll processing.

## Development

```bash
pnpm install
pnpm build
pnpm docs:dev
pnpm playground:dev
```

Build the GitHub Pages artifact locally:

```bash
pnpm docs:build
pnpm docs:preview
```

## Quick Start

```ts
import { liquidGlass } from '@liquid-glass/core';

const handle = liquidGlass(document.querySelector('.panel') as HTMLElement, {
  radius: 24,
  bezel: 18,
  thickness: 1.5,
  surface: 'convex',
  scale: 1,
  chromatic: 1,
  specular: { opacity: 0.4, saturation: 6 },
});

handle.setScale(0.6);
handle.dispose();
```

## Attribution

This project is a clean-room implementation inspired by public writing and demos
about browser-based refraction with CSS and SVG. See
[`docs/reference/attribution.md`](docs/reference/attribution.md) for the attribution and licensing
notes that govern releases.
