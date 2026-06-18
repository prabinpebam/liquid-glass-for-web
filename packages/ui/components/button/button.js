import { el } from '../../core/index.js';

/**
 * Component (L2): button.
 *
 * @param {Object} props
 * @param {string} [props.label]
 * @param {string} [props.variant] 'standard' | 'accent' | 'subtle'
 * @param {string} [props.state] 'rest' | 'hover' | 'pressed' | 'focus' | 'disabled'
 * @param {boolean} [props.disabled]
 * @param {string} [props.type] button type attribute
 * @returns {HTMLButtonElement}
 */
export function createButton({ label = 'Button', variant = 'standard', state = 'rest', disabled = false, type = 'button' } = {}) {
  const cls = ['lg-button'];
  if (variant !== 'standard') cls.push(`lg-button--${variant}`);
  if (state !== 'rest') cls.push(`is-${state}`);
  const attrs = { class: cls.join(' '), type };
  if (disabled || state === 'disabled') attrs.disabled = 'true';
  return el('button', attrs, label);
}
