import { el } from '../../core/index.js';

/**
 * Atom (L1): icon — masked monochrome glyph.
 *
 * The glyph source is selected by `data-lg-icon` from the icon atom's CSS name
 * map. The element tints itself with currentColor via a CSS mask.
 *
 * @param {Object} props
 * @param {string} props.name semantic icon name (e.g. 'search')
 * @param {string} [props.size] 'sm' | 'md' | 'lg'
 * @returns {HTMLElement}
 */
export function createIcon({ name, size = 'md' } = {}) {
  const cls = size === 'md' ? 'lg-icon' : `lg-icon lg-icon--${size}`;
  return el('span', { class: cls, 'data-lg-icon': name, 'aria-hidden': 'true' });
}
