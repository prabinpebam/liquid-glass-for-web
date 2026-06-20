# Compatibility

The effect has two apply modes with very different support.

## Mode support

| Mode | What it distorts | Support |
|---|---|---|
| `filter: url(#id)` | the element's **own content** | Chrome, Safari, Firefox |
| `backdrop-filter: url(#id)` | the content **behind** the element | **Chromium only** |

Using an **SVG filter** as `backdrop-filter` is not part of the CSS spec; only
Chromium currently exposes it. This is the mode required for the true "glass panel"
look. In Electron / Chromium-based runtimes it works out of the box.

## Detection

The library feature-detects support for SVG-filter `backdrop-filter` at runtime and,
when missing, applies the configured `fallback`.

```ts
// conceptual
const supportsBackdropSvg = /* probe an offscreen element */;
```

## Fallbacks

| `fallback` | Behavior when `backdrop` unsupported |
|---|---|
| `'blur'` | Apply a layered `backdrop-filter: blur()` + subtle tint (soft glass) |
| `'none'` | No effect; element renders normally |

You can also explicitly choose `mode: 'filter'` for a cross-browser (content-distort)
variant where appropriate.

## Other considerations

- **Sizing:** `backdrop-filter` images don't auto-size to the element; the library
  syncs them via `ResizeObserver`.
- **Performance:** map generation is the costly step; the library generates once and
  animates `scale`. Large elements may use OffscreenCanvas generation.
- **Reduced motion:** animated `scale` transitions respect `prefers-reduced-motion`.
- **Color management:** the filter uses `color-interpolation-filters="sRGB"` to match
  the reference's channel math.

## Test matrix (tracked toward 0.1.0)

| Browser | `filter` | `backdrop-filter(svg)` |
|---|---|---|
| Chrome / Edge / Electron | ✅ | ✅ |
| Safari | ✅ | ❌ → fallback |
| Firefox | ✅ | ❌ → fallback |
