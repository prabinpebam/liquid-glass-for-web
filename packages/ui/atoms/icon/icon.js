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
 * @param {string} [props.class] extra classes for the icon slot
 * @returns {HTMLElement}
 */
export function createIcon({ name, size = 'md', class: extra = '' } = {}) {
  const cls = [size === 'md' ? 'lg-icon' : `lg-icon lg-icon--${size}`, extra].filter(Boolean).join(' ');
  return el('span', { class: cls, 'data-lg-icon': name, 'aria-hidden': 'true' });
}
