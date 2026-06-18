import { el } from '../../core/index.js';

/**
 * Atom (L1): icon — masked monochrome glyph.
 *
 * The glyph URL is supplied per icon name; the host app maps names to assets
 * (kept out of the library so packs are swappable). The element tints itself
 * with currentColor via a CSS mask.
 *
 * @param {Object} props
 * @param {string} props.name semantic icon name (e.g. 'search')
 * @param {string} [props.url] mask url() for the glyph; sets --lg-icon-url
 * @param {string} [props.size] 'sm' | 'md' | 'lg'
 * @returns {HTMLElement}
 */
export function createIcon({ name, url, size = 'md' } = {}) {
  const cls = size === 'md' ? 'lg-icon' : `lg-icon lg-icon--${size}`;
  const attrs = { class: cls, 'data-lg-icon': name, 'aria-hidden': 'true' };
  const node = el('span', attrs);
  if (url) node.style.setProperty('--lg-icon-url', `url("${url}")`);
  return node;
}
