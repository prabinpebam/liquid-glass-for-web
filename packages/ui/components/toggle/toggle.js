import { el } from '../../core/index.js';

/**
 * Component (L2): toggle (switch).
 *
 * @param {Object} props
 * @param {boolean} [props.on]
 * @param {boolean} [props.disabled]
 * @param {string} [props.label] accessible label
 * @returns {HTMLElement}
 */
export function createToggle({ on = false, disabled = false, label = 'Toggle' } = {}) {
  const cls = ['lg-toggle'];
  if (on) cls.push('is-on');
  if (disabled) cls.push('is-disabled');
  return el(
    'button',
    {
      class: cls.join(' '),
      type: 'button',
      role: 'switch',
      'aria-checked': on ? 'true' : 'false',
      'aria-label': label,
      ...(disabled && { disabled: 'true' }),
    },
    el('span', { class: 'lg-toggle__knob' }),
  );
}
