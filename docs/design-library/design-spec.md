# Liquid Glass Design Library — Design Spec

> A token-driven, layered UI library built on top of the framework-agnostic
> [`@liquid-glass/core`](../../packages/core/README.md) refraction engine.
>
> This spec defines **what** the library is and the **rules** that keep it
> scalable. The companion [architecture-spec.md](architecture-spec.md) defines
> **how** it is assembled (folders, manifest, build, runtime).

This is a deliberately **simpler** adaptation of the token + atomic-layer model
proven in the `win11-fluent` design system. We keep the two ideas that make that
system scale — **tokens as the single source of every value**, and a **strict
atomic layer hierarchy** — and drop the parts we do not need yet.

---

## 1. Goal

Let anyone build an Apple-style "liquid glass" interface by **composing existing
pieces** instead of writing new CSS. Changing one token (e.g. corner roundness,
blur strength, refraction amount, accent color) must update the whole library
consistently. Adding a new screen should require **zero new CSS for ~90% of it**.

The signature twist versus a normal design system: **the glass material itself is
token-driven**. The runtime refraction (bezel, blur, refraction strength,
specular) is configured from CSS custom properties, so a designer tunes glass the
same way they tune spacing — by editing tokens, never by editing the engine.

---

## 2. Core principles

Every rule below has a short id (`LG-Pn`) so code reviews and lint rules can cite it.

### LG-P1 — Tokens are values, components are structure
Components own **structure** (markup), **layout** (flex/grid), and **state**
(hover / pressed / on / disabled). They never hold raw values. Every color,
space, radius, blur, bezel, refraction amount, shadow, font size, duration, and
z-index comes from a token. **This includes the glass optics** — a component says
`--lg-surface-refraction: var(--lg-refraction-regular)`, never `scale: 0.7`.

### LG-P2 — Three-tier token hierarchy
1. **Primitive tokens** (`tokens/*.css`) — raw scales with no opinion about usage.
   `--lg-radius-lg`, `--lg-space-4`, `--lg-blur-md`, `--lg-refraction-regular`,
   `--lg-color-accent`, `--lg-text-body-size`, `--lg-motion-fast`. **These are
   the only knobs a theming/personalization layer tunes.**
2. **Semantic tokens** — human-named aliases that **must resolve to a primitive
   token**. They have two homes, chosen by reuse:
   - *Shared* semantic tokens (used by more than one component, or re-pointed by
     theme / density / contrast) live in `tokens/semantic.css` so they are
     discoverable and centrally overridable — e.g.
     `--lg-control-height: var(--lg-size-control-md)`.
   - *Component-local* semantic tokens live at the top of that component's CSS,
     scoped to its root class — e.g.
     `.lg-surface { --lg-surface-radius: var(--lg-radius-lg) }`.
   A semantic token must never be defined twice with two different values.
3. **Instance dimensions** — a bare value is allowed **at any layer**, but only
   for a structurally unique measurement that has no place on a scale (e.g. a
   toggle track that is exactly `52px`, a magnifier lens `210px` wide). It must
   carry a one-line comment justifying it, and must never stand in for a *scale
   category* (spacing, radius, font size, bezel, blur, stroke) — those are
   always tokens.

> The "closest token wins, ±1 step" rule applies: if a value is within one step
> of an existing token, use the token and adjust the design — do not invent a
> one-off value.

### LG-P3 — Layered scaling (L0 → L4)
Every visual thing is classified into exactly one layer. **A layer may only use
things at or below its level — never sideways, never upward.**

| Layer | Name | Contains | May use |
|------|------|----------|---------|
| **L0** | Tokens | primitive + semantic CSS custom properties | — |
| **L1** | Atoms | indivisible primitives: `surface` (the glass shell), `text`, `icon`, `divider` | L0 |
| **L2** | Components | one interactive role: `button`, `toggle`, `slider`, `input`, `chip`, `segment` | L0, L1 |
| **L3** | Compounds | several components wired together: `searchbar`, `tabbar`, `card`, `menu`, `panel` | L0–L2 |
| **L4** | Layouts | structural containers / surfaces: `dock`, `sheet`, `overlay`, `stack` | L0–L3 |

A `button` (L2) may not reference a `searchbar` (L3). A `searchbar` (L3) composes
`input`, `button`, `icon`. This one rule is what lets the library grow without
turning into spaghetti.

### LG-P4 — One class, one file, scoped
Each component lives in its own folder with **one** `.css` file and **one** `.js`
factory. The CSS defines exactly one root class (`.lg-button`) plus its own
`__element` and `--modifier` parts (BEM-lite). A component **never** writes a
selector that reaches into another component (`.lg-card .lg-button { … }` is
forbidden — parameterize with tokens or a modifier instead).

### LG-P5 — Variants and materials are data, not forks
A component's looks are **attribute / class toggles on the same component**, never
a second component:
- visual variant → `--variant` modifier class (`lg-button--accent`).
- glass material → `data-lg-material="regular | clear | frosted"` on the surface,
  chosen from the closed catalog (LG-P13).

Two classes for the same role (`lg-btn` vs `lg-button`) is a bug.

### LG-P6 — Theme & material modes via token overrides only
Light/dark, accent, density, transparency, and reduced-motion are resolved at the
**token layer** through root attribute selectors and media queries:
`[data-lg-theme="light"]`, `[data-lg-density="compact"]`,
`[data-lg-transparency="off"]`, `@media (prefers-reduced-motion)`. Components
consume tokens and **never branch on theme**. Turning off transparency simply
re-points the glass tokens at a solid fallback — no component changes.

### LG-P7 — The glass surface is the single engine attach point
The L1 `surface` atom is the **only** element the runtime engine
(`liquidGlass()`) attaches to. Every glassy component is "a `surface` with content
composed on top." This keeps the expensive refraction pipeline in exactly one
place and makes every higher layer cheap to build and reason about.

### LG-P8 — Motion is token-driven physics
Motion is a first-class, tokenized subsystem — see the dedicated
[motion-spec.md](motion-spec.md). Durations/easings are tokens
(`--lg-motion-fast`); interactive motion is **spring physics**, not keyframes,
and a component selects a named **spring family** (`snap`, `glide`, `settle`,
`grab`, `jelly`, `damp`) rather than writing a stiffness/damping pair. Every
interactive glass control shares **one activation transition** (opaque → glass,
refraction boost, lift) from shared tokens, so the whole library "turns to glass"
with one identity. All motion scales together off one dial (`--lg-motion-scale`)
and a closed set of presets (`[data-lg-motion]`); `prefers-reduced-motion`
collapses durations to `0ms` and makes the runtime jump springs to target — at the
token layer, so components are untouched.

### LG-P9 — Fallback and accessibility are contracts
- **Fallback:** `backdrop-filter: url(#…)` refraction is Chromium-only. The
  surface atom declares a layered-blur fallback via tokens; when the engine
  reports the refraction path is unsupported it sets `data-lg-fallback="blur"`
  and the CSS fallback tokens take over. No component knows or cares.
- **Keyboard & ARIA:** every interactive component ships a documented keyboard
  map and correct ARIA roles/states, with a visible focus ring from
  `--lg-focus-color` / `--lg-focus-width` / `--lg-focus-offset`.
- **Contrast over glass:** translucency can break text legibility — and WCAG AA
  cannot be guaranteed against an arbitrary moving backdrop. Components that put
  text on glass meet AA against the *resolved tint token*, not the backdrop, and
  a `[data-lg-contrast="high"]` mode re-points tint / stroke / text tokens to
  opaque high-contrast values (the accessibility sibling of transparency-off).
- **Focus management:** overlay layers (L4 menus / dialogs / sheets) own focus
  trapping and restore, render into one portal root, and mark the background
  `inert`, so stacking and escape behavior are consistent.
- **Direction:** components use logical properties only; `dir` / `[data-lg-dir]`
  on the root flips the whole library with no component change.

### LG-P10 — Reuse before creation; the manifest is the inventory
[`library.manifest.json`](../../packages/ui/library.manifest.json) is the
authoritative list of every token file, atom, component, compound, and layout.
Before adding anything, you must show nothing existing (± a variant/token) fits.
**Duplication is the failure mode.**

### LG-P11 — Glass is shared and cached
The refraction maps + SVG filter for a given **(geometry + material)** are
generated once and **shared** by every identical surface, via a refcounted cache
keyed on those inputs. A screen with 40 identical glass pills costs **one**
filter, not 40. Only `scale` is animated (cheap, no rebuild), and the number of
*simultaneously animating* surfaces is capped. This keeps the most expensive part
of the library **O(distinct shapes)**, not O(elements) — the single property that
lets a real screen stay smooth. (See architecture-spec §4.1.)

### LG-P12 — Behavior is separate from structure
Factories are **pure**: data in, DOM out — no event wiring. Interaction (flipping
a switch, dragging a slider, trapping focus in a menu) lives in optional
**behaviors** attached to a rendered node — `attachToggle(node)` — mirroring
`material.bind(node)`. This keeps components headless and SSR-friendly, lets the
same markup be static or interactive, and keeps event logic out of the render
path. Behaviors may read motion / spring tokens (LG-P8) but never write component
CSS values (runtime drag positioning is the one allowed exception).

### LG-P13 — A closed palette of surfaces; components consume, never define
Glass parameters (refraction, blur, bezel, tint, stroke, specular) are defined in
**exactly one place** — the **surface catalog** (`atoms/surface/surface.css`,
enumerated in the manifest `materials`). The catalog is a **small, closed, named
set** (e.g. `regular`, `clear`, `frosted`). Every other component and compound
selects a surface **by name** (`data-lg-material="frosted"`, or a `surface` prop)
and may **never** set or override a `--lg-surface-*` optic token itself.

This is the rule that stops the library drifting into dozens of nearly-identical
glasses with slightly different transparency / blur / frost — the exact failure
mode that makes a design system look incoherent. A small fixed palette also keeps
LG-P11's filter cache bounded: a closed surface set ⇒ a fixed number of distinct
filters, so **consistency and performance come from the same constraint**.

The same discipline applies to every other **constrained dimension** — elevation,
blur, radius, accent roles, motion springs, and backdrops are **enumerations, not
free dials**. You pick the nearest member of the set (LG-P2, ±1 step); if none
fits, you change *the set* — a reviewed, manifest-versioned act of governance —
not the call site.

---

## 3. The token system

### 3.1 Token families (primitive, L0)

| File | Namespace | Purpose |
|------|-----------|---------|
| `tokens/radius.css` | `--lg-radius-*` | corner rounding scale |
| `tokens/spacing.css` | `--lg-space-*` | 4px-based spacing scale |
| `tokens/sizing.css` | `--lg-size-*` | control heights, icon sizes |
| `tokens/semantic.css` | shared `--lg-{role}-*` | reused semantic aliases (control height, focus ring) + density/contrast overrides |
| `tokens/color.css` | `--lg-color-*` | neutral ramp, accent, status, on-glass text |
| `tokens/typography.css` | `--lg-text-*`, `--lg-font-*` | type ramp + families |
| `tokens/glass.css` | `--lg-blur-*`, `--lg-bezel-*`, `--lg-refraction-*`, `--lg-tint-*`, `--lg-stroke-*`, `--lg-specular-*`, `--lg-thickness` | **the signature material scales** |
| `tokens/motion.css` | `--lg-motion-*` | durations, easings, spring constants |
| `tokens/elevation.css` | `--lg-shadow-*` | drop-shadow / lift scales |
| `tokens/z-index.css` | `--lg-z-*` | named stacking levels |

Shared **semantic** tokens live in `tokens/semantic.css`, loaded immediately
after the primitives; component-local semantic tokens live in their component CSS
(LG-P2). `tokens/index.css` `@import`s the primitive files **then** `semantic.css`
in order and is the library's `baseDependencies`. No component file may be
imported before `tokens/index.css`.

> **Token naming grammar** (enforced by lint): `--lg-{family}-{role}[-{scale}]`
> for primitives (`--lg-radius-lg`, `--lg-color-accent-hover`) and
> `--lg-{component}-{role}` for component-local semantics (`--lg-surface-bezel`).
> The `--lg-` prefix isolates the library from a host page's own variables; the
> stable `--lgc-*` contract layer (architecture-spec §7) is the only namespace
> apps should consume directly.

### 3.2 The material contract (tokens → engine)

The bridge that makes glass token-driven. The `surface` atom exposes a fixed set
of **semantic surface tokens**; the `core/material.js` binder reads their computed
values off the element and maps them to `LiquidGlassOptions`:

| Surface token | Engine option | Example value |
|---------------|---------------|---------------|
| `--lg-surface-radius` | `radius` | `var(--lg-radius-lg)` |
| `--lg-surface-bezel` | `bezel` | `var(--lg-bezel-md)` |
| `--lg-surface-thickness` | `thickness` | `var(--lg-thickness)` |
| `--lg-surface-blur` | `blur` | `var(--lg-blur-md)` |
| `--lg-surface-refraction` | `scale` | `var(--lg-refraction-regular)` |
| `--lg-surface-specular-opacity` | `specular.opacity` | `var(--lg-specular-opacity)` |
| `--lg-surface-specular-saturation` | `specular.saturation` | `var(--lg-specular-saturation)` |

Because the binder reads tokens, a **surface in the catalog** is just a token
override keyed on its name:

```css
/* atoms/surface/surface.css — THE surface catalog (the only place optics live) */
.lg-surface[data-lg-material="clear"]   { --lg-surface-refraction: var(--lg-refraction-strong); --lg-surface-blur: var(--lg-blur-sm); }
.lg-surface[data-lg-material="frosted"] { --lg-surface-refraction: var(--lg-refraction-subtle); --lg-surface-blur: var(--lg-blur-lg); }
```

No JS, no engine edits — a new surface is a handful of token assignments. But it
lives **only** here: the catalog is the single, closed source of glass optics
(LG-P13). Components select a surface by name and never redefine these tokens.

### 3.3 Theming

A theme is a set of **primitive-token overrides** scoped to a root attribute:

```css
/* themes/light.css */
[data-lg-theme="light"] {
  --lg-color-on-glass: #1a1c22;
  --lg-tint-base: rgba(255,255,255,0.55);
  --lg-stroke-base: rgba(255,255,255,0.7);
}
```

Switching `document.documentElement.dataset.lgTheme` re-tints every glass surface
and every component at once, with zero component code involved (LG-P6).

### 3.4 Closed sets — the surface palette

The authoritative glass surfaces. These are the **only** glass-parameter bundles
in the system; the manifest's `materials` array enumerates them and lint rejects
any surface optics defined elsewhere (LG-P13).

| Surface | Refraction | Blur | Intended use |
|---------|-----------|------|--------------|
| `regular` | `--lg-refraction-regular` | `--lg-blur-md` | default panels, bars, cards |
| `clear` | `--lg-refraction-strong` | `--lg-blur-sm` | hero / lens, content you look *through* |
| `frosted` | `--lg-refraction-subtle` | `--lg-blur-lg` | dense, text-heavy surfaces |

A component picks one (`createSurface({ material: 'frosted' })` or
`data-lg-material="frosted"`). Adding a surface = one catalog entry + one manifest
`materials` entry, with a written justification (LG-P10/P13). Removing or
re-tuning a surface is a `tokenContract` **major** bump (§7.1).

> **Backdrops** — the scrim/overlay behind modals and sheets — are a separate
> closed set on the same rule (e.g. `scrim-dim`, `scrim-blur`): defined once,
> chosen by name, never inlined. Other closed sets: elevation (`--lg-shadow-*`),
> blur steps, and accent roles. The rule generalizes — a finite, named set per
> constrained dimension.

---

## 4. Component contract

Every L1–L4 entry obeys the same shape so the library stays predictable:

1. **Folder:** `{layer}/{name}/` containing `{name}.css` + `{name}.js`.
2. **One root class:** `.lg-{name}`, BEM-lite parts/modifiers only.
3. **Factory:** `create{Name}(props) → HTMLElement`, built with the shared `el()`
   primitive — never `innerHTML` template strings.
4. **Props are data:** label/state/variant/disabled etc. Defaults documented in
   the factory signature. Variants map to modifier classes (LG-P5).
5. **State pairing:** every CSS interaction state has a matching utility class so
   previews/tests can pin a state without real input
   (`:hover` ↔ `.is-hover`, `:active` ↔ `.is-pressed`, on ↔ `.is-on`).
6. **Glass via composition:** if it is glassy, its root **is** (or contains) a
   `surface` atom and selects one of the catalog surfaces **by name** (LG-P13);
   it never sets `--lg-surface-*` optics or re-attaches the engine itself.
7. **Slots:** content a consumer must supply is passed as `children` (an ordered
   array of nodes) or named slot props (`leading` / `trailing`); a component
   never hard-codes consumer content. Slots are how compounds stay open-ended
   without spawning new variants.
8. **Behavior:** interactivity is added by an optional `attach{Name}(node)`
   behavior (LG-P12), never inside the factory.

### 4.1 Worked example — `button` (L2)

```js
// components/button/button.js
import { el } from '../../core/index.js';
export function createButton({ label = 'Button', variant = 'standard', state = 'rest', disabled = false } = {}) {
  const cls = ['lg-button'];
  if (variant !== 'standard') cls.push(`lg-button--${variant}`);
  if (state !== 'rest') cls.push(`is-${state}`);
  return el('button', { class: cls.join(' '), type: 'button', ...(disabled && { disabled: 'true' }) }, label);
}
```

```css
/* components/button/button.css — one class, all values are tokens */
.lg-button {
  min-height: var(--lg-size-control-md);
  padding: 0 var(--lg-space-5);
  border-radius: var(--lg-surface-radius, var(--lg-radius-md));
  font-size: var(--lg-text-body-size);
  color: var(--lg-color-on-glass);
  transition: background var(--lg-motion-fast), transform var(--lg-motion-fast);
}
```

---

## 5. Anti-patterns (lint must reject)

- `style="…"` in markup, except runtime positioning written by JS.
- Hex / `rgb()` literals in component CSS — only tokens or `color-mix()`.
- Bare px for a **scale category** (spacing, radius, font size, bezel, blur,
  stroke) at any layer. Structurally-unique instance dimensions are allowed but
  must carry a justifying comment (LG-P2 tier 3).
- `!important`.
- Cross-component selectors (`.lg-card .lg-button { … }`).
- A second component for the same role (forking instead of a variant).
- Re-attaching `liquidGlass()` anywhere except the `surface` atom.
- A component setting any `--lg-surface-*` optic token (refraction, blur, bezel,
  tint, stroke, specular). Only the surface catalog defines glass; components
  pick a named surface (LG-P13).
- Inventing a one-off surface / elevation / blur value instead of choosing from
  the closed set for that dimension (LG-P13).
- Hardcoded transition values or raw spring constants in component code.
- Theme branching inside a component.
- `left` / `right` physical properties — use logical props (`inline-start`).
- Emoji in markup — use the `icon` atom.

---

## 6. Success criteria

The design is working when:

1. Every UI element maps to exactly one layer (L0–L4) and that mapping is recorded
   in the manifest.
2. Changing a single primitive token (e.g. `--lg-radius-lg` or
   `--lg-refraction-regular`) visibly updates **every** affected surface and
   component, with no other edits.
3. A new screen (e.g. a media player or a settings sheet) is built purely by
   composing existing atoms/components/compounds — proven by a "build it without
   writing CSS" test.
4. Toggling `data-lg-theme`, `data-lg-density`, or `data-lg-transparency` on the
   root re-renders the whole UI correctly through tokens alone.
5. A new glass material is added by overriding surface tokens only — no engine or
   factory change.
6. Lint rejects every anti-pattern in §5.
7. N identical glass surfaces share **one** generated filter (verified by counting
   injected `<filter>` nodes), and adding more *static* surfaces does not regress
   frame time.
8. A component renders identically whether or not its behavior is attached;
   attaching / detaching a behavior never changes layout.
9. The set of glass surfaces is small, closed, and enumerated in the manifest; no
   component or compound defines or overrides glass optics — verified by lint and
   by counting distinct material keys at runtime (LG-P13).

---

## 7. Scalability model & known limits

The library is designed to scale along three axes — **surface count**, **token
count**, and **component count** — and to fail loudly, not silently, at a limit.

| Axis | Scaling strategy | Watch-out |
|------|------------------|-----------|
| Glass surfaces on screen | refcounted filter/map cache keyed on geometry+material (LG-P11); animate `scale` only | `backdrop-filter` is GPU-bound — budget only a *handful of animating* surfaces; static cached surfaces are cheap |
| Distinct surfaces / shapes | a **closed** surface palette (LG-P13) + one cached filter per (geometry+material) | ad-hoc per-component optics break both coherence and the cache — components pick a named surface, never define one |
| Tokens | three tiers + naming grammar + `tokenContract` semver | token sprawl; mitigated by "reuse before create" and lint flagging unused tokens |
| Components | flat per-layer folders + manifest inventory | discoverability; the manifest is the single browsable index |
| Themes / brands | attribute-scoped token overrides, scopable to a subtree | global `:root` assumption — subtree theming is supported but must be tested |

### 7.1 Versioning & deprecation
- `tokenContract` (manifest) is the **token API version**. Renaming/removing a
  primitive or shared-semantic token, or changing a material→engine mapping, is a
  **major** bump; adding tokens is a **minor** bump.
- The `factories` map is the **JS API**. A component is deprecated by marking it
  `"deprecated": true` in the manifest (kept working for one major), never
  silently deleted.
- Themes and materials are additive; removing one is a major bump.

### 7.2 Open questions (tracked, not yet decided)
- Server-side rendering of factory markup (currently client-only — see
  architecture-spec §15).
- Non-rounded-rect glass shapes (an engine limitation, not a library decision).
- A visual "Glass Studio" that renders every factory straight from the manifest.
