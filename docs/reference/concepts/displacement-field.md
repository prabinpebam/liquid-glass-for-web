# Displacement field

The displacement field describes, for every position on the glass surface, **how far**
a light ray is shifted from its original landing point and **in which direction**. For
a circle, the displacement is always orthogonal to the border.

## Pre-calculating magnitude on one radius

Because displacement magnitude is **symmetric** around the bezel (see
[surface functions](surface-functions.md)), it is pre-computed for a range of
distances from the border along a **single radius** (a half-slice), then rotated
around the center.

The reference samples **127 ray simulations** along the radius — a count dictated by
the SVG displacement-map resolution (see [displacement map](displacement-map.md)).

For each sampled distance $d$:
1. Evaluate the surface normal from the height function `f`.
2. Apply Snell's law to get the refracted direction.
3. Compute the displacement magnitude (how far the refracted ray lands vs. the
   straight-through ray).

This yields an array of `{ angle, magnitude }` vectors along the radius.

## Normalizing the vectors

To store the field in an 8-bit image, the vectors are normalized so the **maximum**
magnitude becomes 1:

```ts
const maximumDisplacement = Math.max(...displacementMagnitudes);

const displacementVector_normalized = {
  angle: normalAtBorder,
  magnitude: magnitude / maximumDisplacement,
};
```

`maximumDisplacement` (in **pixels**) is kept — it becomes the SVG filter's `scale`
so the map can be decoded back to real pixel shifts (see
[displacement map](displacement-map.md) and [compositing](compositing.md)).

## Building the full field

The normalized half-slice is rotated around the center to fill the 2D field for the
whole bezel. The flat interior contributes zero displacement (neutral).

## Implementation

See `packages/core/src/refraction/displacement-field.ts` and `normalize.ts`.

> Concept reference: kube.io, *Liquid Glass in the Browser*. See
> [../attribution.md](../attribution.md).
