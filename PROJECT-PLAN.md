# Project Plan — Liquid Glass for Web

A phased plan to turn the offline reproduction in [`source-reference/`](source-reference/)
into a reusable, framework-agnostic liquid-glass effect library.

---

## 1. Vision & scope

**Goal:** ship a small, dependency-light library that lets any web project apply an
Apple-style "liquid glass" refractive effect to a DOM element with one call, while
keeping the physically-based pipeline configurable.

**In scope**
- Framework-agnostic core engine (TypeScript, zero runtime deps).
- Physically-based displacement-map + specular-highlight generation.
- SVG filter builder/injector with lifecycle management (create, update, dispose).
- Thin wrappers: React hook/component, and a `<liquid-glass>` web component.
- Prebuilt recipes: panel, magnifier, search box, switch, slider.
- Graceful degradation for browsers without SVG-filter `backdrop-filter`.

**Out of scope (initially)**
- Non-circular base shapes beyond rounded rectangles (documented as future work).
- 3D/perspective refraction, multiple refraction events.
- A visual editor app (a playground example is in scope; a full app is not).

**Non-goals**
- Pixel-perfect parity with Apple's implementation.
- Copying kube.io's bundled code (see §10 Licensing).

---

## 2. Source material → library mapping

| Concept from the article | Library module | Notes |
|---|---|---|
| Snell–Descartes refraction | `core/refraction/snell` | Pure math, public domain |
| Surface height function `f(d)` | `core/surface` | convex / concave / lip / flat profiles |
| Displacement vector field | `core/refraction/displacement-field` | half-slice + radial reuse |
| Vector normalization | `core/refraction/normalize` | store `maxDisplacement` as filter `scale` |
| Vector → R/G map image | `core/maps/displacement-map` | 8-bit, 128 neutral |
| Specular rim light | `core/maps/specular-map` | angle-based intensity |
| `<feImage>`+`<feDisplacementMap>`(+`<feBlend>`) | `core/filter/svg-filter` | filter graph builder |
| `filter` vs `backdrop-filter` | `core/glass` apply layer | Chromium-only backdrop path |
| Components (magnifier, switch, …) | `core/recipes` + `examples` | presets over the core |

---

## 3. Architecture

```
                 ┌─────────────────────────────────────────────┐
   options ───▶  │  core/glass  (public API: liquidGlass())     │
                 │   • validates + normalizes options           │
                 │   • orchestrates pipeline + lifecycle        │
                 └───────────┬──────────────────────┬───────────┘
                             ▼                      ▼
              ┌──────────────────────┐   ┌──────────────────────┐
              │ surface + refraction │   │   filter (SVG graph)  │
              │  → displacement field│   │  feImage/feDisplace.. │
              └──────────┬───────────┘   └──────────┬───────────┘
                         ▼                          ▼
              ┌──────────────────────┐   ┌──────────────────────┐
              │ maps (PNG data URLs)  │──▶│ inject <svg><filter> │
              │ displacement+specular │   │  + element CSS apply  │
              └──────────────────────┘   └──────────────────────┘
```

**Data flow:** `options → surface profile → per-distance refraction (Snell) →
normalized displacement field → RGBA displacement map + specular map (canvas →
dataURL) → SVG filter graph → element.style.(backdrop)filter = url(#id)`.

**Key design decisions**
- Maps are generated once and reused; only the filter `scale` is animated for
  cheap fade-in/out (no map rebuild). Documented in `docs/architecture.md`.
- Maps are pre-computed on a single radius (half-slice) and rotated, matching the
  article's symmetry insight — keeps generation O(radius) not O(area).
- Everything is pure/SSR-safe except the inject/apply layer, which is guarded for
  `typeof document !== 'undefined'`.

---

## 4. Public API (target)

```ts
type SurfaceKind = 'convex' | 'concave' | 'lip' | 'flat' | SurfaceFn;

interface LiquidGlassOptions {
  width?: number;            // defaults to element size (ResizeObserver)
  height?: number;
  radius?: number;           // corner radius px
  bezel?: number;            // bezel width px
  thickness?: number;        // refractive index (≈1.5 glass)
  surface?: SurfaceKind;     // bezel cross-section profile
  scale?: number;            // 0..1 effect strength
  blur?: number;             // backdrop blur px
  specular?: { opacity?: number; saturation?: number; angle?: number };
  mode?: 'filter' | 'backdrop'; // backdrop = Chromium-only
  fallback?: 'blur' | 'none';
}

interface LiquidGlassHandle {
  update(partial: Partial<LiquidGlassOptions>): void;
  setScale(scale: number): void; // cheap, no map rebuild
  dispose(): void;
}

function liquidGlass(el: HTMLElement, opts?: LiquidGlassOptions): LiquidGlassHandle;
```

React: `useLiquidGlass(ref, options)` and `<LiquidGlass {...options}>`.
Web component: `<liquid-glass radius="24" bezel="18" thickness="1.5">…</liquid-glass>`.

---

## 5. Phased roadmap

### Phase 0 — Foundation (this commit)
- [x] Repo restructure; reproduction moved to `source-reference/`.
- [x] Docs scaffold + concept write-ups.
- [x] `packages/core` skeleton with typed API surface and stubs.
- [ ] Tooling: pnpm workspace, TypeScript, tsup build, vitest, eslint/prettier.

### Phase 1 — Core math (pure, testable)
- [ ] `surface/` height functions + numerical derivative → normal.
- [ ] `refraction/snell` refracted angle; total-internal-reflection guard.
- [ ] `refraction/displacement-field` half-slice magnitudes; `normalize`.
- [ ] Unit tests against analytic cases (orthogonal ray = 0 displacement, symmetry).
- **Exit:** deterministic field arrays verified by tests; no DOM.

### Phase 2 — Map generation
- [ ] `maps/displacement-map` polar→cartesian→RGBA, radial rotation, 128 neutral.
- [ ] `maps/specular-map` rim intensity from surface normal vs light angle.
- [ ] Canvas + OffscreenCanvas paths; `toDataURL`/`toBlob`.
- [ ] Snapshot tests on small sizes (hash the pixel buffer).
- **Exit:** map data URLs render the same field the reference produces.

### Phase 3 — SVG filter + apply layer
- [ ] `filter/svg-filter` builds `<filter>` with feImage/feDisplacementMap/feBlend.
- [ ] `glass` injects a shared `<svg>` defs host; unique filter ids; refcounting.
- [ ] Apply `filter` or `backdrop-filter`; size sync via ResizeObserver.
- [ ] `setScale` animates without rebuild; `dispose` cleans DOM + observers.
- **Exit:** a vanilla example panel shows refraction offline, matching reference.

### Phase 4 — Compatibility & fallbacks
- [ ] Feature-detect SVG-filter `backdrop-filter` (Chromium).
- [ ] Fallback to layered blur/tint when unsupported.
- [ ] Reduced-motion + performance guards (skip rebuild on rapid resize).
- **Exit:** documented behavior matrix in `docs/compatibility.md`.

### Phase 5 — Framework wrappers
- [ ] `packages/react`: `useLiquidGlass` + `<LiquidGlass>`; SSR-safe.
- [ ] `packages/web-component`: `<liquid-glass>` with attribute reflection.
- **Exit:** React and WC examples render identically to vanilla.

### Phase 6 — Recipes & examples
- [ ] Presets: panel, magnifier, search box, switch, slider.
- [ ] `examples/playground`: live controls (surface, bezel, thickness, scale).
- **Exit:** parity demos for each component from the article.

### Phase 7 — Hardening & release prep
- [ ] Perf pass (map caching, generation in worker via OffscreenCanvas).
- [ ] Bundle size budget + tree-shaking checks.
- [ ] API docs generated; changelog; semver; CI.
- [ ] Licensing/attribution review (see §10).
- **Exit:** `0.1.0` candidate.

---

## 6. Tooling & conventions

- **Package manager:** pnpm workspaces.
- **Language:** TypeScript (strict), ESM-first, `.d.ts` emitted.
- **Build:** tsup (esbuild) → ESM + CJS + types per package.
- **Test:** vitest (+ jsdom for DOM layer; pixel snapshot for maps).
- **Lint/format:** eslint + prettier.
- **Examples:** Vite.
- **Versioning:** changesets + semver.

---

## 7. Testing strategy

- **Pure math:** analytic invariants (orthogonal incidence ⇒ 0 displacement;
  left/right symmetry; monotonic magnitude across the bezel).
- **Maps:** deterministic pixel snapshots at small sizes; neutral value = 128.
- **DOM layer:** jsdom for lifecycle (inject/dispose/refcount), and a
  Playwright visual check on the vanilla example to confirm real refraction paint.
- **Cross-engine:** compatibility matrix recorded; backdrop path tested in Chromium.

---

## 8. Performance principles

- Generate maps once; animate only the filter `scale`.
- Compute on a half-slice; rotate radially (O(radius)).
- Debounce/skip rebuilds during continuous resize; rebuild on settle.
- Optional OffscreenCanvas worker for large maps.
- Respect `prefers-reduced-motion`.

---

## 9. Risks & mitigations

| Risk | Mitigation |
|---|---|
| `backdrop-filter: url()` is Chromium-only | Feature-detect + documented blur fallback |
| Map rebuilds are costly on resize | Animate `scale` only; debounce rebuilds |
| Non-circular shapes need extra math | Ship rounded-rect via stretched circles first |
| Copyright on original code | Clean-room from concepts; no copied bundles (§10) |
| Large maps hurt memory | Cap resolution; reuse; worker generation |

---

## 10. Licensing & attribution (must-read before release)

- The original article and code are by **kube.io**; the author stated the code is
  **not yet open-source licensed**. Do **not** copy or redistribute their bundled
  or minified JS/CSS in the shipped library.
- The **physics and techniques** (Snell's law, displacement maps, specular rim
  light) are not copyrightable and may be reimplemented freely.
- `source-reference/` is retained for **study only** and must be excluded from any
  published package (`.npmignore`/`files` allowlist).
- Add clear attribution + a chosen OSS license (e.g. MIT) for our clean-room code.
- See [docs/attribution.md](docs/attribution.md).

---

## 11. Definition of done (0.1.0)

- `liquidGlass()` works in a vanilla example, offline, in Chromium.
- React + web-component wrappers ship with examples.
- Documented fallback for non-Chromium.
- Core math + map generation covered by tests.
- Docs: getting-started, API reference, concepts, compatibility, attribution.
- Source reference excluded from the published artifact.
