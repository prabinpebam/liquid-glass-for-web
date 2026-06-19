import { el } from '../../core/index.js';
import { createSurface } from '../../atoms/surface/surface.js';

/**
 * Component (L2): button.
 *
 * @param {Object} props
 * @param {string} [props.label]
 * @param {string} [props.variant] 'standard' | 'accent' | 'subtle'
 * @param {string} [props.state] 'rest' | 'hover' | 'pressed' | 'focus' | 'disabled'
 * @param {boolean} [props.disabled]
 * @param {string} [props.type] button type attribute
 * @param {string} [props.material] surface material
 * @returns {HTMLButtonElement}
 */
export function createButton({ label = 'Button', variant = 'standard', state = 'rest', disabled = false, type = 'button', material = 'regular' } = {}) {
  const cls = ['lg-button'];
  if (variant !== 'standard') cls.push(`lg-button--${variant}`);
  if (state !== 'rest') cls.push(`is-${state}`);
  const attrs = { type };
  if (disabled || state === 'disabled') attrs.disabled = 'true';
  return createSurface({
    material,
    tag: 'button',
    class: cls.join(' '),
    attrs,
    children: [el('span', { class: 'lg-button__label' }, label)],
  });
}
