import { el } from '../../core/index.js';

/**
 * Atom (L1): text — typographic primitive.
 *
 * @param {Object} props
 * @param {string} props.content
 * @param {string} [props.variant] 'body' | 'caption' | 'subtitle' | 'title'
 * @param {boolean} [props.dim]
 * @param {string} [props.tag] default chosen from variant
 * @returns {HTMLElement}
 */
export function createText({ content = '', variant = 'body', dim = false, tag } = {}) {
  const cls = ['lg-text'];
  if (variant !== 'body') cls.push(`lg-text--${variant}`);
  if (dim) cls.push('lg-text--dim');
  const hostTag = tag || (variant === 'title' ? 'h2' : variant === 'subtitle' ? 'h3' : 'p');
  return el(hostTag, { class: cls.join(' ') }, content);
}
