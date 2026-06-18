# Specular highlight

The specular highlight is the bright, shiny rim you see on real glass when light hits
it at certain angles. It is the finishing touch that sells the effect.

## Model

The reference approximates Apple's look as a simple **rim light**: the highlight
appears around the **edges** of the glass object, and its intensity varies with the
angle of the **surface normal** relative to a **fixed light direction**.

Inputs the library exposes:

| Parameter | Meaning |
|---|---|
| `angle` | light direction the rim responds to |
| `opacity` | strength of the highlight (e.g. 0.2–0.5) |
| `saturation` | color saturation of the rim (e.g. 4–9) |

These match the per-component parameters in the article (e.g. *Specular Opacity*,
*Specular Saturation*).

## Generation

Like the displacement map, the specular highlight is rendered to its own image
(another `<feImage>` input). Intensity is computed from the surface normal across the
bezel versus the light angle, concentrated near the rim and falling off toward the
flat interior.

## Why a separate map

Keeping the specular highlight as an independent input means it can be blended on top
of the refracted result and tuned (opacity/saturation/angle) **without** touching the
displacement map. This is the "creative" layer of the effect.

## Implementation

See `packages/core/src/maps/specular-map.ts`. It is combined with the displacement
result in [compositing](compositing.md).

> Concept reference: kube.io, *Liquid Glass in the Browser*. See
> [../attribution.md](../attribution.md).
