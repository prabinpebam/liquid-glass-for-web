# Liquid Glass for Web

Reusable, framework-agnostic **liquid glass** for web projects. The packages in
this monorepo generate physically based SVG displacement maps and specular
highlights, then apply them through CSS `filter` / `backdrop-filter` with small
APIs for vanilla JavaScript, React, custom elements, and token-driven UI.

The public Design Library is hosted from the docs app and is designed to deploy
to GitHub Pages.

## Repository Layout

```text
liquid-glass-for-web/
├── apps/
│   ├── docs/              GitHub Pages site + live Design Library
│   └── playground/        Interactive low-level engine playground
├── docs/                  Maintainer docs, architecture notes, decisions
├── examples/              Small consumer-facing integration examples
├── packages/
│   ├── core/              Framework-agnostic TypeScript engine
│   ├── react/             React hook/component bindings
│   ├── element/           <liquid-glass> custom element
│   └── ui/                Token-driven Liquid Glass design library package
├── .github/workflows/     CI and GitHub Pages automation
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

- [`apps/docs`](apps/docs): the public documentation and Design Library site.
- [`apps/playground`](apps/playground): interactive playground for low-level
  refraction parameters and engine experiments.

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
[`docs/attribution.md`](docs/attribution.md) for the attribution and licensing
notes that govern releases.
