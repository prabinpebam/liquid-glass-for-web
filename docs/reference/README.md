# Documentation

Documentation for the **Liquid Glass for Web** library.

## Start here
- [Getting Started](getting-started.md) — install and apply the effect.
- [Architecture](architecture.md) — how the pipeline fits together.
- [API Reference](api-reference.md) — the public surface.
- [Compatibility](compatibility.md) — browser support and fallbacks.
- [Attribution & Licensing](attribution.md) — read before shipping.

## Concepts (the technique)
These distill the physics/technique behind the effect. They are the conceptual
basis for a clean-room implementation.

1. [Refraction](concepts/refraction.md) — Snell's law, the core of the effect.
2. [Surface functions](concepts/surface-functions.md) — the glass bezel profile.
3. [Displacement field](concepts/displacement-field.md) — per-pixel ray displacement.
4. [Displacement map](concepts/displacement-map.md) — encoding the field as an image.
5. [Specular highlight](concepts/specular-highlight.md) — the rim light.
6. [Compositing](concepts/compositing.md) — combining into one SVG filter.

## Roadmap
See [../PROJECT-PLAN.md](../PROJECT-PLAN.md).
