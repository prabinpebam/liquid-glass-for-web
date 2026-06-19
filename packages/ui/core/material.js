/**
 * material.js — the bridge between CSS glass tokens and the runtime engine.
 *
 * This is the ONLY place where CSS meets physics. It reads the semantic
 * `--lg-surface-*` tokens off a mounted element and maps them to the
 * `@liquid-glass/core` engine options, then attaches the refraction filter.
 *
 * Designers tune glass by editing tokens (tokens/glass.css) and material
 * overrides (atoms/surface/surface.css) — never by editing engine options.
 *
 * Scaling rules (see architecture-spec §4.1/§4.2):
 *  - bind() is idempotent and tracked in a WeakMap (no monkey-patching nodes).
 *  - size is auto-synced by the engine; we do NOT add a second ResizeObserver.
 *  - material/token changes are PUSHED via a MutationObserver, coalesced to one
 *    rAF, and only rebuild when the material key actually changes.
 *  - a global token change (theme/density/contrast) calls refreshAll().
 *
 * @see ../../docs/design-library/design-spec.md  (LG-P1, LG-P7, LG-P11)
 * @see ../../docs/design-library/architecture-spec.md §4
 */

// The engine lives in the sibling workspace package. In a buildless dev setup
// this resolves via an import map / bundler alias to @liquid-glass/core.
import { liquidGlass } from '@liquid-glass/core';

/** Map of surface token → engine option, with a parser. */
const TOKEN_MAP = [
  ['--lg-surface-radius', 'radius', px],
  ['--lg-surface-bezel', 'bezel', px],
  ['--lg-surface-thickness', 'thickness', num],
  ['--lg-surface-blur', 'blur', px],
  ['--lg-surface-refraction', 'scale', num],
  ['--lg-surface-chromatic-aberration', 'chromatic', num],
];

const SPECULAR_MAP = [
  ['--lg-surface-specular-opacity', 'opacity', num],
  ['--lg-surface-specular-saturation', 'saturation', num],
];

function px(v) { const n = parseFloat(v); return Number.isFinite(n) ? n : undefined; }
function num(v) { const n = parseFloat(v); return Number.isFinite(n) ? n : undefined; }

/** Read the engine options encoded in a surface element's tokens. */
export function readMaterialOptions(node) {
  const cs = getComputedStyle(node);
  const opts = {};
  for (const [token, key, parse] of TOKEN_MAP) {
    const val = parse(cs.getPropertyValue(token).trim());
    if (val !== undefined) opts[key] = val;
  }
  const specular = {};
  for (const [token, key, parse] of SPECULAR_MAP) {
    const val = parse(cs.getPropertyValue(token).trim());
    if (val !== undefined) specular[key] = val;
  }
  if (Object.keys(specular).length) opts.specular = specular;
  return opts;
}

/**
 * Stable cache/diff key: identical key ⇒ identical filter (LG-P11). The engine's
 * apply layer can use this to share one refcounted `<filter>` across surfaces.
 */
export function materialKey(opts) {
  const s = opts.specular || {};
  return [opts.radius, opts.bezel, opts.thickness, opts.blur, opts.scale, opts.chromatic, s.opacity, s.saturation].join('|');
}

/** Bound surfaces. WeakMap keeps bindings idempotent without touching the node. */
const REGISTRY = new WeakMap();
/** Iterable mirror used by refreshAll() (cleaned up on unbind). */
const BOUND = new Set();

/**
 * Attach the liquid-glass engine to a mounted surface element using its tokens.
 * Idempotent: a second call on the same node returns the existing disposer.
 *
 * @param {HTMLElement} node a mounted `.lg-surface` element
 * @returns {() => void} dispose
 */
export function bind(node) {
  const existing = REGISTRY.get(node);
  if (existing) return existing.dispose;

  if (!node.isConnected) {
    console.error('[liquid-glass] bind() called before the node was mounted; use bindWhenConnected().');
  }

  let lastKey = materialKey(readMaterialOptions(node));
  const handle = liquidGlass(node, readMaterialOptions(node)); // engine auto-syncs size

  // Material/token changes are pushed, not polled. Coalesce to one rAF and
  // rebuild only when the resolved material key actually changed.
  let frame = 0;
  const schedule = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const next = readMaterialOptions(node);
      const key = materialKey(next);
      if (key !== lastKey) { lastKey = key; handle.update(next); }
    });
  };

  const mo = new MutationObserver(schedule);
  mo.observe(node, { attributes: true, attributeFilter: ['data-lg-material', 'class', 'style'] });

  const binding = {
    refresh: schedule,
    dispose() {
      if (frame) cancelAnimationFrame(frame);
      mo.disconnect();
      handle.dispose();
      REGISTRY.delete(node);
      BOUND.delete(node);
    },
  };
  REGISTRY.set(node, binding);
  BOUND.add(node);
  return binding.dispose;
}

/**
 * Attach once the node is connected to the document (guards the empty
 * getComputedStyle before mount).
 * @returns {() => void} dispose
 */
export function bindWhenConnected(node) {
  if (node.isConnected) return bind(node);
  let raf = requestAnimationFrame(function check() {
    if (node.isConnected) bind(node);
    else raf = requestAnimationFrame(check);
  });
  return () => { cancelAnimationFrame(raf); unbind(node); };
}

/** Bind every surface atom at or below a root node. */
export function bindTree(root) {
  const surfaces = root.matches?.('.lg-surface') ? [root] : [];
  surfaces.push(...root.querySelectorAll?.('.lg-surface') || []);
  const disposers = surfaces.map((surface) => bindWhenConnected(surface));
  return () => disposers.forEach((dispose) => dispose());
}

/** Detach every bound surface atom at or below a root node. */
export function unbindTree(root) {
  if (root.matches?.('.lg-surface')) unbind(root);
  root.querySelectorAll?.('.lg-surface').forEach((surface) => unbind(surface));
}

/** Re-read one bound surface's tokens and rebuild if its material changed. */
export function refresh(node) {
  REGISTRY.get(node)?.refresh();
}

/** Re-read every bound surface — call after a global token change (theme/density/contrast). */
export function refreshAll() {
  for (const node of BOUND) REGISTRY.get(node)?.refresh();
}

/** Detach the engine from a surface element previously passed to bind(). */
export function unbind(node) {
  REGISTRY.get(node)?.dispose();
}
