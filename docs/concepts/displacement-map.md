# Displacement map

A displacement map is an image whose pixel colors tell the browser how far to fetch
the actual pixel value from each position. SVG's `<feDisplacementMap>` reads it from a
32-bit RGBA image where each channel encodes one axis of displacement.

## Channel encoding

- **Red → X displacement**
- **Green → Y displacement**
- Blue and Alpha are ignored by `<feDisplacementMap>`.

Each channel is 8-bit, so displacement is limited to **−128…127 px** per axis, with
**128 = neutral** (no displacement).

## Vector → Red/Green values

The field stores polar vectors `{ angle, magnitude }`. Convert to Cartesian, then map
to the 0–255 channel range (magnitude is already normalized to 0–1):

```ts
const x = Math.cos(angle) * magnitude;
const y = Math.sin(angle) * magnitude;

const result = {
  r: 128 + x * 127, // Red  = X component  → 0..255
  g: 128 + y * 127, // Green = Y component → 0..255
  b: 128,           // Blue ignored
  a: 255,           // fully opaque
};
```

Writing every vector to the image yields a map usable by the SVG filter.

## Scale (decoding back to pixels)

Channels map linearly to a normalized displacement in **[−1, 1]** (128 = 0). The
filter's `scale` multiplies that normalized amount:

```
0   ↦ −scale
128 ↦  0
255 ↦ +scale
```

Because the field was normalized by the **maximum displacement in pixels**, that same
maximum is reused directly as the filter `scale`:

```html
<feDisplacementMap
  in="SourceGraphic"
  in2="displacement_map"
  scale="{maximumDisplacement}"  <!-- max displacement (px) → real pixel shift -->
  xChannelSelector="R"
  yChannelSelector="G" />
```

`scale` can also be **animated** to fade the effect in/out without recomputing the
map — useful for cheap artistic control (not physically exact).

## Resolution

The map resolution constrains how many distinct displacement steps exist. The
reference uses **127 samples** along the radius to match the 8-bit channel budget.

## Implementation

See `packages/core/src/maps/displacement-map.ts`.

> Concept reference: kube.io, *Liquid Glass in the Browser*. See
> [../attribution.md](../attribution.md).
