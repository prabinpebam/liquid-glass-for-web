# Surface functions

The glass "surface function" describes the **cross-section** of the bezel — how thick
the glass is from its outer edge inward to where the flat top begins. It is the shape
that determines how light bends across the rim.

## Definition

The function takes a normalized distance from the side, $d \in [0, 1]$ (0 = outer
edge, 1 = end of the bezel / start of the flat surface) and returns the glass height
at that point:

```ts
const height = f(distanceFromSide); // d in [0,1] -> height
```

## From height to surface normal

The **angle of incidence** at a point depends on the surface normal, which is the
derivative of the height function rotated by −90°. The derivative is approximated
numerically:

```ts
const delta = 0.001;                 // small step for the derivative
const y1 = f(d - delta);
const y2 = f(d + delta);
const derivative = (y2 - y1) / (2 * delta);
const normal = { x: -derivative, y: 1 }; // derivative rotated by -90°
```

That normal feeds Snell's law (see [refraction](refraction.md)) to compute the
refracted direction and therefore the displacement at distance $d$.

## Profiles shipped by the library

The article uses four height functions to show how the bezel shape changes the
refraction. The library exposes them as named presets plus a custom function escape
hatch:

| Profile | Character | Use |
|---|---|---|
| `convex` | bulges outward | default; keeps rays **inside** the object |
| `concave` | caves inward | pushes rays **outside** (needs sampling beyond edges) |
| `lip` | convex outside + concave middle | switch-style: zoomed center, refractive edges |
| `flat` | minimal/linear | subtle effect |

> Convex profiles are preferred because concave surfaces push rays **outside** the
> object, which requires sampling background beyond its bounds. Apple's Liquid Glass
> appears to favor convex profiles (except the Switch).

## Symmetry insight (performance)

For a circle, displacement is always **orthogonal to the border** and **symmetric**
around the bezel: two points at the same distance from the edge share the same
displacement magnitude. So the field is computed **once on a single radius**
(a half-slice) and **rotated** around the center — O(radius), not O(area).

## Implementation

See `packages/core/src/surface/index.ts`.

> Concept reference: kube.io, *Liquid Glass in the Browser*. See
> [../attribution.md](../attribution.md).
