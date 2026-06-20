# Project Plan - Liquid Glass for Web

This project is now organized as a reusable library monorepo plus a public
Design Library site deployable to GitHub Pages.

## Product Goals

- Ship `@liquid-glass/core` as a small framework-agnostic engine for applying
  liquid-glass refraction to DOM elements.
- Ship thin wrappers for React and custom elements.
- Ship `@liquid-glass/ui` as a token-driven design library that composes the
  shared engine instead of reimplementing material effects.
- Host the interactive Design Library from `apps/docs` on GitHub Pages.
- Keep examples small and consumer-focused.

## Current Repository Model

```text
apps/docs          Public docs + Design Library site
apps/playground    Low-level interactive playground
examples/          Minimal integration examples
packages/core      Engine
packages/react     React bindings
packages/element   Custom element wrapper
packages/ui        Tokens and UI components
docs/              Maintainer docs and architecture decisions
```

## Public Package Contract

```ts
type SurfaceKind = 'convex' | 'concave' | 'lip' | 'flat' | SurfaceFn;

interface LiquidGlassOptions {
  width?: number;
  height?: number;
  radius?: number;
  bezel?: number;
  thickness?: number;
  surface?: SurfaceKind;
  scale?: number;
  chromatic?: number;
  blur?: number;
  specular?: { opacity?: number; saturation?: number; angle?: number };
  mode?: 'filter' | 'backdrop';
  fallback?: 'blur' | 'none';
}

interface LiquidGlassHandle {
  update(partial: Partial<LiquidGlassOptions>): void;
  setScale(scale: number): void;
  dispose(): void;
}
```

## Near-Term Work

- Stabilize `@liquid-glass/core` behavior and browser compatibility.
- Add focused tests for displacement maps, specular maps, SVG filter structure,
  and live update behavior.
- Make the React and custom element packages match the final core API.
- Continue moving demo-only code out of packages and reusable code out of apps.
- Add release automation once package names and versioning are final.

## GitHub Pages

The Design Library is hosted from `apps/docs`.

```bash
pnpm docs:build
```

The build writes static output to `apps/docs/dist`, which is uploaded by
`.github/workflows/pages.yml`.

## Definition of Done for 0.1.0

- `pnpm build` succeeds for all packages.
- `pnpm docs:build` produces a working static Pages artifact.
- The Design Library demonstrates the canonical Liquid Glass engine.
- Public READMEs explain installation and browser support.
- Package `files` allowlists include only distributable source/build artifacts.
- Attribution and compatibility docs are current.
