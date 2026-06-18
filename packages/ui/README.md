# @liquid-glass/ui

Token-driven, layered design library for the **liquid glass** effect, built on
top of [`@liquid-glass/core`](../core/README.md).

Specs:
- [Design Spec](../../docs/design-library/design-spec.md) — the rules (tokens,
  layers, principles, anti-patterns).
- [Architecture Spec](../../docs/design-library/architecture-spec.md) — how it is
  assembled (folders, manifest, runtime, build).

## The idea in one paragraph

Every value lives in a **token** (`tokens/*.css`). Every UI piece is classified
into a **layer** — Tokens (L0) → Atoms (L1) → Components (L2) → Compounds (L3) →
Layouts (L4) — and may only use things at or below its level. The signature twist:
the glass **material itself is token-driven** — `core/material.js` reads the
`--lg-surface-*` tokens off the `surface` atom and feeds them to the refraction
engine, so designers tune glass by editing tokens, never the engine.

## Layout

```
tokens/        L0  primitive + semantic scales (radius, spacing, glass, motion…)
themes/            token overrides per mode (dark, light)
contract-tokens.css  stable --lgc-* boundary (swappable library interface)
core/              el() DOM primitive + material binder (tokens → engine)
atoms/         L1  surface (the glass shell + engine attach point), text, icon
components/    L2  button, toggle
compound/      L3  searchbar
layouts/       L4  (added as needed)
library.manifest.json  the inventory + CSS load order
index.js           default export: { primitives, factories, material, personalization }
```

## Quick start (buildless)

```html
<!-- load tokens first, then components, in manifest order -->
<link rel="stylesheet" href="/packages/ui/tokens/index.css" />
<link rel="stylesheet" href="/packages/ui/themes/dark.css" />
<link rel="stylesheet" href="/packages/ui/atoms/surface/surface.css" />
<link rel="stylesheet" href="/packages/ui/compound/searchbar/searchbar.css" />

<script type="module">
  import ui from '/packages/ui/index.js';

  const bar = ui.factories.searchbar({ placeholder: 'Search', action: true });
  document.body.appendChild(bar);
  ui.material.bind(bar);          // light up the glass after mounting

  ui.personalization.applyTheme('light');
  ui.personalization.applyAccent('#ff5470');
</script>
```

## Adding a component

1. Create `{layer}/{name}/{name}.css` + `{name}.js` (one class, factory builds
   with `el()`).
2. Add the CSS path to `styles[]` and the factory to `factories` in
   `library.manifest.json`.
3. Use only tokens for values and only lower layers for composition.

That's the whole contract — see the [Design Spec](../../docs/design-library/design-spec.md).
