# Attribution & Licensing

**Read this before publishing or distributing anything from this repository.**

## Original work

The liquid-glass effect, the accompanying write-up, and the demo components originate
from:

> **Liquid Glass in the Browser: Refraction with CSS and SVG** — kube.io
> <https://kube.io/blog/liquid-glass-css-svg/>

The author has publicly stated that the original code *"needs a cleanup pass and perf
work before any possible open-source release"* — i.e. it is **not currently released
under an open-source license**.

## What this means for this project

- **Do not copy** kube.io's source, bundled JavaScript/CSS, or generated assets into
  the published library. The old local source mirror has been removed from this
  repository; future work should rely on documented concepts and independent code.
- The **physics and techniques** described in the article — Snell's law, displacement
  maps, specular rim lighting, the SVG filter approach — are **not copyrightable**.
  The library is built as a **clean-room reimplementation** from these documented
  concepts (see [docs/concepts](concepts/)), not from their code.
- Where we reproduce specific small formulas from the article (e.g. the
  `128 + x * 127` channel encoding), these are standard, functional expressions of the
  technique rather than creative code.

## Playground demo assets (not part of the published library)

The interactive playground in [`../apps/playground/`](../apps/playground/)
reproduces the article's own demos (Precision Lens, Searchbox, Switch, Slider, Music
Player). To stay visually faithful it **reuses kube.io's pre-baked displacement /
specular map PNGs**, copied into `apps/playground/assets/maps/`:

| Demo          | Maps                                            | Base scale |
| ------------- | ----------------------------------------------- | ---------- |
| Precision Lens| `*-w2qrsb.png` + `magnifying-map-q51ggw.png`    | 122.809    |
| Searchbox     | `*-yiydeb.png`                                  | 78.533     |
| Switch        | `*-z1p3yi.png`                                  | 55.652     |
| Slider        | `*-76hifn.png`                                  | 83.881     |
| Music Player  | `*-yr2eh1.png`                                  | 74.652     |

These PNGs are **kube.io's assets** and are included **for the local demo only**. They
must be **excluded from any published package** and must not be redistributed as part of
the library. The library code itself generates its maps at runtime and ships no kube
assets.

## Our license

The clean-room library code in `packages/` is intended to ship under the **MIT**
license (see root `package.json`). Add a top-level `LICENSE` file before release.

## Required attribution

Even though the technique is freely reimplementable, we credit the original author:

> Effect and technique inspired by kube.io's *"Liquid Glass in the Browser:
> Refraction with CSS and SVG."*

Include this credit in the published README and docs.

## Publish checklist

- [ ] No kube.io bundled/minified code in `packages/`.
- [ ] No kube.io map PNGs (`apps/playground/assets/maps/`) bundled into any package.
- [ ] `LICENSE` (MIT) added at repo root.
- [ ] Attribution credit present in README.
- [ ] Third-party font/asset licenses (Inter, KaTeX, etc.) reviewed if any are bundled.
