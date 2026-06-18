/**
 * core/index.js — shared primitives for the Liquid Glass design library.
 * Re-exports the DOM primitive, the icon helper, and the material binder.
 */
export { el } from './el.js';
export { bind, unbind, bindWhenConnected, refresh, refreshAll, readMaterialOptions, materialKey } from './material.js';

/**
 * icon(name) — a masked monochrome glyph atom helper.
 * Glyphs are referenced by name and colored via `currentColor`; the actual
 * SVG source lives in the icon atom. Kept here so any layer can build an icon
 * without importing the atom factory directly.
 *
 * @param {string} name e.g. 'search', 'check', 'close'
 * @param {string} [size] one of 'sm' | 'md' | 'lg'
 * @returns {HTMLElement}
 */
export function icon(name, size = 'md') {
  const span = document.createElement('span');
  span.className = `lg-icon lg-icon--${size}`;
  span.dataset.lgIcon = name;
  span.setAttribute('aria-hidden', 'true');
  return span;
}
