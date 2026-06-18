# Liquid Glass Design Library — Docs

The plan for turning the liquid glass effect into a **token-driven, layered,
reusable UI library** (`@liquid-glass/ui`), adapted (and simplified) from the
token + atomic-layer model proven in the `win11-fluent` design system.

- [Design Spec](design-spec.md) — the rules: token hierarchy, the L0–L4 layer
  model, the ten principles (`LG-P*`), the material contract, anti-patterns, and
  success criteria.
- [Motion Spec](motion-spec.md) — the motion half: spring families, the shared
  activation transition, velocity/squash + rubber-band rules, motion tokens, the
  global motion dial + presets, and the physics runtime (the detailed form of
  LG-P8).
- [Architecture Spec](architecture-spec.md) — how it is assembled: folders, the
  manifest, the tokens→engine runtime, the data/render boundary, theming, build,
  testing, and the playground migration path.
- [Component Inventory](component-inventory.md) — the exhaustive **build
  reference**: every atom, element, component, compound, and layout (mapped to
  L0–L4) needed to cover the majority of modern web UIs, with build status.

Implementation scaffold: [`packages/ui/`](../../packages/ui/README.md).
