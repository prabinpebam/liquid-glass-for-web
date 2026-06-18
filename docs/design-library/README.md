# Liquid Glass Design Library — Docs

The plan for turning the liquid glass effect into a **token-driven, layered,
reusable UI library** (`@liquid-glass/ui`), adapted (and simplified) from the
token + atomic-layer model proven in the `win11-fluent` design system.

- [Design Spec](design-spec.md) — the rules: token hierarchy, the L0–L4 layer
  model, the ten principles (`LG-P*`), the material contract, anti-patterns, and
  success criteria.
- [Architecture Spec](architecture-spec.md) — how it is assembled: folders, the
  manifest, the tokens→engine runtime, the data/render boundary, theming, build,
  testing, and the playground migration path.

Implementation scaffold: [`packages/ui/`](../../packages/ui/README.md).
