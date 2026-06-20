# Liquid Glass Design Library — Architecture Spec

> Companion to [design-spec.md](design-spec.md). The design spec defines the
> **rules**; this document defines **how the library is assembled** — folders,
> the manifest, the runtime, the data/render boundary, and the build.

The library is published as a new workspace package, **`@liquid-glass/ui`**, that
sits on top of the existing engine package, **`@liquid-glass/core`**.

```
@liquid-glass/core   →  physics + SVG filter + apply layer  (TypeScript, no DOM tree)
        ▲
        │ liquidGlass(el, opts)
        │
@liquid-glass/ui     →  tokens + atoms + components (CSS + ESM factories)
        ▲
        │ import design library
        │
examples / app       →  compose factories, render screens
```

---

## 1. Language & format choices (kept simple)

| Concern | Choice | Why |
|--------|--------|-----|
| Styling | **Plain CSS** with custom properties | Tokens are CSS variables; zero build needed for theming; works anywhere |
| Logic | **ESM `.js` factories** with JSDoc types | Buildless, framework-agnostic, mirrors the proven `win11-fluent` pattern |
| Engine | Consumes the **built** `@liquid-glass/core` (TS) | Heavy math stays typed and tested; UI layer stays light |
| DOM | One shared `el()` primitive | No template-string HTML anywhere (see §5) |
| Render target | **Client-side** DOM via `el()`; markup is not server-rendered yet | Keeps the layer tiny and dependency-free; SSR is a tracked open question (§15) |

> Rationale: the engine deserves strict types and unit tests; the UI layer
> benefits more from being **buildless and inspectable**. CSS + ESM gives us a
> design library you can drop into any page with a single `<script type=module>`
> and a few `<link>`s, exactly like the reference system.

---

## 2. Folder structure

```
packages/ui/
  package.json
  README.md
  library.manifest.json          # the inventory + load order (single source of truth)
  contract-tokens.css            # stable --lgc-* interface (swappable library boundary)
  index.js                       # package entry: factories + personalization + primitives

  core/
    index.js                     # re-exports el(), icon helpers, and the material binder
    el.js                        # the one DOM primitive
    material.js                  # reads surface tokens → calls liquidGlass() from core

  tokens/                        # L0 — primitive + semantic scales
    index.css                    # @import barrel (load this first)
    semantic.css                 # shared semantic tokens + density/contrast overrides
    radius.css
    spacing.css
    sizing.css
    color.css
    typography.css
    glass.css                    # the signature material scales
    motion.css
    elevation.css
    z-index.css

  themes/                        # token overrides per mode (LG-P6)
    dark.css
    light.css

  atoms/                         # L1
    surface/  { surface.css, surface.js }   # THE glass shell + engine attach point
    text/     { text.css,    text.js }
    icon/     { icon.css,     icon.js }

  components/                    # L2
    button/   { button.css,  button.js }
    toggle/   { toggle.css,  toggle.js }

  compound/                      # L3
    searchbar/ { searchbar.css, searchbar.js }

  behaviors/                     # optional interactivity controllers (LG-P12)
    springs.js  # shared physics runtime (Spring + token-bound families); motion-spec
    toggle.js   slider.js   menu.js   ...

  icons/                         # icon registry shim (name → url); artwork stays in the host

  layouts/                       # L4 (added as needed)
```

Folder name == layer. The manifest's `layers` map records which directory is which
level, and lint uses it to enforce LG-P3 (no upward/sideways imports).

---

## 3. The manifest — single source of truth

[`library.manifest.json`](../../packages/ui/library.manifest.json) declares
everything a host needs to load and use the library, in one file:

- `entry` / `contractTokens` / `baseDependencies` — what to import first.
- `styles[]` — **every CSS file in load order**: tokens → atoms → components →
  compounds → layouts. A host can `<link>` them in this exact order, or a bundler
  can read the array. Order matters: tokens must load before anything consumes
  them.
- `theme` — the root attribute (`data-lg-theme`), default, and available modes.
- `layers` — the L0–L4 → folder mapping used by lint.
- `materials` — the **closed surface palette** (`regular`, `clear`, `frosted`):
  the authoritative list of glass-parameter bundles. Components select one by
  name; lint rejects glass optics defined anywhere else (design-spec LG-P13).
- `factories` — the public contract of `create*` functions, each with its layer
  and required props, so a preview tool can render any piece generically.

Adding a component = create its folder + add one entry to `styles[]` and one to
`factories`. Nothing else changes. The manifest **is** the inventory referenced by
LG-P10.

---

## 4. Runtime: how a glass component comes alive

```
            ┌──────────────────────────────────────────────────────┐
 props ──▶  │  createSurface(props)  (atoms/surface/surface.js)     │
            │   • el('div', { class:'lg-surface', data-lg-material })│
            │   • returns the shell node (no engine yet)            │
            └───────────────┬──────────────────────────────────────┘
                            ▼  mount in DOM
            ┌──────────────────────────────────────────────────────┐
 bindMaterial(node)  (core/material.js)                             │
   • getComputedStyle(node) → read --lg-surface-* tokens           │
   • map tokens → LiquidGlassOptions → material key (cache lookup)  │
   • handle = liquidGlass(node, opts)         ← @liquid-glass/core  │
   • engine auto-syncs size; MutationObserver pushes material change│
   • if backdrop path unsupported → node.dataset.lgFallback='blur' │
            └───────────────┬──────────────────────────────────────┘
                            ▼
            engine injects <svg><filter> + sets backdrop-filter
```

Key points:
- **Tokens drive the engine.** `material.js` is the only place CSS meets physics.
  Designers never touch engine options; they edit `glass.css` tokens.
- **One attach point.** Only `surface` is bound. A `button` that wants glass
  composes a `surface` as its root; it never calls `liquidGlass()` itself (LG-P7).
- **Cheap state.** Animating strength uses `handle.setScale()` (no map rebuild);
  geometry/material changes call `handle.update()` — and only when an input
  actually changed (the binder diffs the material key, see §4.2).

### 4.1 Shared filter/map cache (LG-P11)
The engine-facing options are hashed into a **material key**
(`radius|bezel|thickness|blur|scale|specular…`). A process-wide cache maps
key → generated maps + injected `<filter>` id. Binding a surface whose key already
exists **reuses** that filter (refcount++); disposing decrements and removes the
filter only at refcount 0. Net effect: N identical surfaces ⇒ one filter, so cost
is **O(distinct shapes)**, not O(elements). (Cross-surface sharing requires the
refcounted-filter hook in `@liquid-glass/core`'s apply layer; the binder supplies
the key and lifecycle.)

### 4.2 Lifecycle, idempotency & change propagation
- **Registry, not monkey-patching.** Bound surfaces are tracked in a
  `WeakMap<Element, Binding>`; `bind()` is **idempotent** — a second call on the
  same node returns the existing binding instead of leaking a second handle.
- **Bind-after-mount.** `getComputedStyle` is empty before mount; `bind()` warns
  if the node is disconnected, and `bindWhenConnected(node)` defers attachment
  until it joins the document.
- **Composed trees.** `bindTree(root)` binds every `.lg-surface` at or below a
  root, so compounds can compose canonical surfaces without inventing their own
  material attach path.
- **Size is the engine's job.** `@liquid-glass/core` already auto-syncs
  width/height via its own `ResizeObserver` — the binder does **not** duplicate
  it.
- **Material changes are pushed, not polled.** A `MutationObserver` on
  `data-lg-material` / `class` / `style` schedules **one** `requestAnimationFrame`
  refresh that re-reads tokens, diffs the material key, and rebuilds only on a
  real change. A global token change (theme/density/contrast via the
  personalization helpers) calls `refreshAll()`.
- **Dispose.** `unbind(node)` cancels any pending frame, disconnects the
  observer, drops the cache refcount, disposes the handle, and clears the
  registry entry.

---

## 5. Data / render boundary

All markup flows one direction, through factories — never hand-written HTML:

```
   data (JSON / props)  →  factory functions  →  el()  →  DOM
```

- `el(tag, attrs, ...children)` is the **only** DOM constructor. No `innerHTML`,
  no template strings, no `.html` fragment files.
- `create{Name}(props)` factories are pure: data in, node out.
- A screen is assembled by calling factories and nesting their returned nodes.

This is the lightweight version of the reference system's "JSON → renderer →
library factories → DOM" rule, scoped to what we need now.

---

## 6. Package entry (`index.js`)

A single default export object, mirroring the reference's shape:

```js
export default {
  manifest,                       // parsed library.manifest.json
  primitives: { el, icon },       // L0/shared building blocks
  factories: {                    // every create* by name (L1–L4)
    surface, text, icon,
    button, toggle,
    searchbar,
  },
  material: { bind, unbind, bindWhenConnected, bindTree, unbindTree, refresh, refreshAll },
  behaviors: { attachToggle, attachSlider /* … */ }, // optional, tree-shakeable
  icons: { register, resolve },   // name → url registry (§13)
  personalization: {              // token-override helpers on :root (or a subtree)
    applyTheme, applyAccent, applyDensity, applyTransparency, applyContrast,
  },
};
```

A host (app, playground, or a future "Glass Studio" preview tool) can:
- `<link>` everything from `manifest.styles`,
- call `factories.searchbar({ placeholder:'Search' })` to get a node,
- call `material.bind(node)` after mount to light up the glass,
- call `personalization.applyTheme('light')` to retheme everything.

---

## 7. Contract tokens (swappable boundary)

[`contract-tokens.css`](../../packages/ui/contract-tokens.css) maps a small,
**stable, library-agnostic** namespace (`--lgc-*`) onto this library's `--lg-*`
tokens:

```css
:root {
  --lgc-accent:        var(--lg-color-accent);
  --lgc-surface-radius:var(--lg-radius-lg);
  --lgc-text-primary:  var(--lg-color-on-glass);
  --lgc-motion-fast:   var(--lg-motion-fast);
}
```

Apps and higher-level tools should consume `--lgc-*`. That way a different glass
implementation could be swapped in behind the same contract without touching app
code — the same indirection the reference uses with its `--dl-*` layer.

---

## 8. Theming, density, transparency, motion

All are **token overrides on root attributes / media queries** (LG-P6/P8):

| Axis | Mechanism | Effect |
|------|-----------|--------|
| Theme | `[data-lg-theme="light\|dark"]` | re-tints glass + text tokens |
| Density | `[data-lg-density="compact\|comfortable"]` | swaps `--lg-space-*` / control heights |
| Transparency | `[data-lg-transparency="off"]` | re-points glass tint/blur tokens to solid fallback |
| Motion | `[data-lg-motion="calm\|crisp"]` + `--lg-motion-scale` | retunes durations + spring families together (closed preset set, motion-spec) |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` | collapses `--lg-motion-*` to `0ms`, makes the runtime jump springs to target |

`personalization.applyAccent(hex)` writes a derived accent ramp onto `:root` as
`--lg-color-accent*`, re-coloring every accent-bound component at once.

---

## 9. Build & distribution

- **Dev:** buildless. Serve the package directory; `<link>` the manifest styles
  and `import` `index.js`. Mirrors `apps/playground/serve.mjs`.
- **Publish:** ship `tokens/`, `themes/`, `atoms/`, `components/`, `compound/`,
  `layouts/`, `core/`, `contract-tokens.css`, `library.manifest.json`, `index.js`
  as-is (ESM + CSS). Declare `@liquid-glass/core` as a peer/dependency. Optionally
  ship a bundled+minified CSS (`dist/liquid-glass-ui.css`) concatenated in
  `manifest.styles` order for a one-link drop-in.
- **Reference mirrors are not stored in the repo or published**.
- **Load only what you use.** A consumer can `<link>` just `tokens/index.css`
  plus the specific component CSS it renders (the manifest lists every file), or
  run a build that tree-shakes `styles[]` down to the factories actually
  imported.
- **Production CSS is bundled, not `@import`-chained.** `tokens/index.css` uses
  `@import` for authoring convenience; the publish step concatenates the manifest
  `styles[]` into one file to avoid serial request waterfalls.
- **Subtree theming.** Theme / density / contrast attributes work on any element,
  not just `:root` — a dark island in a light page is `<div data-lg-theme="dark">`.
  `personalization.*` helpers take an optional target element (default `:root`).

---

## 10. Testing

| Layer | What we test | How |
|-------|--------------|-----|
| Tokens | every semantic token resolves to a primitive (no dangling `var()`) | static scan of CSS |
| Factories | `create*` returns the documented class + ARIA for each variant/state | jsdom unit tests |
| Material binder | surface tokens map to the right `LiquidGlassOptions` | jsdom + stubbed `liquidGlass` |
| Layering | no file imports/selects a higher or sideways layer | lint rule reading `manifest.layers` |
| Anti-patterns | §5 of the design spec | lint (regex/AST over CSS + JS) |
| Visual | real refraction paints; fallback engages off-Chromium | Playwright on an example page |

---

## 11. Migration of the existing playground

The current `apps/playground` hand-writes component HTML/CSS with ad-hoc
variables. Migration path (incremental, non-breaking):

1. Land `tokens/` + `surface` atom; point existing `.glass` styling at the new
   `--lg-*` tokens.
2. Replace each hand-written demo (`pill`, `toggle`, `slider`, `searchbar`, …)
   with the matching `create*` factory as it lands.
3. Move the playground's spring/jiggle physics onto the shared runtime
   `behaviors/springs.js`, so each demo picks a named spring family and reads the
   activation tokens instead of literal constants (LG-P8, motion-spec).
4. Delete the duplicated CSS once every demo renders from the library.

This keeps the proven kube-faithful motion while moving its values into the token
system.

---

## 12. Behaviors (interactivity)

Factories render inert markup (LG-P12). Interaction is added by **behaviors** —
small controllers attached to a node, mirroring `material.bind`:

```js
import { attachToggle } from '@liquid-glass/ui/behaviors/toggle';
const node = ui.factories.toggle({ on: false });
container.appendChild(node);
const detach = attachToggle(node, { onChange: (on) => save(on) });
```

Rules:
- One behavior per component, in `behaviors/{name}.js`; pure DOM, framework-free.
- A behavior only toggles classes / ARIA and reads tokens; it never writes visual
  values inline (drag-time positioning is the one allowed exception).
- `attach*` returns a `detach()` that fully restores the node.
- Behaviors are optional and tree-shakeable — a static page ships none.
- Spring / jiggle physics (the kube-faithful motion) live here and are built on
  the shared runtime `behaviors/springs.js`: behaviors pick a named spring
  **family** and read the shared **activation** endpoints from the motion tokens
  rather than hard-coding constants (LG-P8). The full motion language — families,
  the activation transition, velocity/squash, presets, and the runtime contract —
  is specified in [motion-spec.md](motion-spec.md).

---

## 13. Icon registry

The `icon` atom renders a masked glyph but bundles no artwork — packs stay
swappable. A host registers a name→url map once:

```js
ui.icons.register({ search: '/icons/search.svg', close: '/icons/close.svg' });
```

`factories.icon({ name: 'search' })` resolves the url from the registry; an
unregistered name renders a visible placeholder in dev and a silent
`aria-hidden` blank in prod. This keeps the library asset-free while giving every
consumer one contract for icon packs (the scalable version of the reference's
role→asset map).

---

## 14. Performance budget

- **Cache first:** distinct (geometry+material) combinations — not element count
  — drive filter cost (§4.1). Prefer a few radius/size tokens.
- **Animate `scale` only;** cap simultaneously-animating surfaces to a handful.
- **Coalesce changes** to one rebuild per settle, never per frame (§4.2).
- **Budget:** first glass ≤ 1 filter generation; steady-state idle = 0 rebuilds;
  a screen of static glass = O(distinct shapes) filters.
- A perf test counts injected `<filter>` nodes and asserts cache reuse across
  identical surfaces.

---

## 15. Rendering target & versioning

- **Client-only render today.** Factories call `document.createElement`. For SSR,
  the planned path is a string renderer emitting the *same* classes/attributes so
  `material.bind` + behaviors hydrate existing markup (design-spec §7.2).
- **Versioning.** `tokenContract` versions the token API; the `factories` map
  versions the JS API; deprecate via `"deprecated": true` in the manifest, never
  by silent removal (design-spec §7.1).
