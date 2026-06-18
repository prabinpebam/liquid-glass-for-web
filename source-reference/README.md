# Source Reference — Offline reproduction of the original article

This folder contains a **faithful, fully offline reproduction** of:

> **Liquid Glass in the Browser: Refraction with CSS and SVG** — kube.io
> <https://kube.io/blog/liquid-glass-css-svg/>

It is kept **only as an empirical study reference** for building the library. It is
**not** part of the published package and its code must not be copied verbatim into
the library (see [../docs/attribution.md](../docs/attribution.md)).

## What's inside

```
source-reference/
├── site/kube.io/            Mirrored site (served as web root '/')
│   ├── blog/liquid-glass-css-svg/index.html   The article (SSR HTML)
│   ├── assets/              JS bundles, CSS, displacement/specular PNG maps
│   └── _ext/                Mirrored cross-origin assets (fonts, KaTeX, images)
├── mirror.mjs               The capture/download + URL-rewrite script
├── serve.mjs               Zero-dependency local static server
├── urls.json               Resource list captured from the live page
└── mirror-report.json      Download report (per-URL status)
```

## Run it

```powershell
# from the repo root
node source-reference/serve.mjs
# then open:
#   http://localhost:8099/blog/liquid-glass-css-svg/
```

Use a Chromium-based browser to see the final `backdrop-filter` glass components.

## How the mirror was built

`mirror.mjs` seeds from `urls.json` (the exact resources the live page loaded),
downloads each, recursively resolves CSS `@font-face`/`url()` references, rewrites
cross-origin asset hosts into a local `/_ext/` tree, strips broken Subresource
Integrity hashes, and neutralizes analytics — producing a self-contained copy.

## Known online-only bits (by design)

- **Music player album art** is fetched live from the **iTunes Search API**
  (a dynamic endpoint that cannot be mirrored as static files).
- A decorative GIF served via GitHub's image proxy.

Neither affects the **liquid glass refraction effect**, which runs entirely offline.
