import { el } from '../../core/index.js';
import { createSurface } from '../../atoms/surface/surface.js';

/**
 * Component (L2): toggle (switch).
 *
 * @param {Object} props
 * @param {boolean} [props.on]
 * @param {boolean} [props.disabled]
 * @param {string} [props.label] accessible label
 * @param {string} [props.material] surface material
 * @returns {HTMLElement}
 */
export function createToggle({ on = false, disabled = false, label = 'Toggle', material = 'regular' } = {}) {
  const cls = ['lg-toggle'];
  if (on) cls.push('is-on');
  if (disabled) cls.push('is-disabled');
  return createSurface({
    material,
    tag: 'button',
    class: cls.join(' '),
    attrs: {
      type: 'button',
      role: 'switch',
      'aria-checked': on ? 'true' : 'false',
      'aria-label': label,
      ...(disabled && { disabled: 'true' }),
    },
    children: [el('span', { class: 'lg-toggle__knob' })],
  });
}
