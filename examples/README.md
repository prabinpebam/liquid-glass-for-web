# Examples

Runnable demos for the liquid-glass packages.

| Example | Stack | Run |
| --- | --- | --- |
| [`vanilla/`](./vanilla/index.html) | Plain HTML + ESM | Serve via any bundler/dev server that resolves `@liquid-glass/core`, or build the core package and repoint the import to its `dist/index.js`. |
| [`playground/`](./playground/index.html) | Vanilla JS/CSS, no build | `npm run playground:serve` then open http://localhost:8100/ |

The **playground** reproduces the kube.io demos faithfully:

- **Precision Lens** — a draggable SVG displacement capsule that refracts the
  page beneath it, with its own specular / saturation / refraction controls.
- **Searchbox** — a glass search pill with specular / saturation / refraction /
  blur controls and a photo-background toggle.
- **Switch** — a lip-bezel glass toggle that slides on click (or "Force active"),
  with specular opacity / saturation / refraction / blur controls.
- **Slider** — a convex glass thumb you drag along a fill track, with the same
  four controls.
- **Music Player** — a convex glass control bar with play/pause animation and the
  same four controls.

Every demo reuses the kube.io article's own displacement and specular maps
(`assets/maps/`), applied through the exact SVG `<filter>` chain from the article.
See [docs/attribution.md](../docs/attribution.md).

## License

MIT. See [docs/attribution.md](../docs/attribution.md).
