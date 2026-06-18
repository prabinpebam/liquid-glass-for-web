import { el } from '../../core/index.js';
import { createSurface } from '../../atoms/surface/surface.js';
import { createIcon } from '../../atoms/icon/icon.js';
import { createButton } from '../../components/button/button.js';

/**
 * Compound (L3): searchbar.
 *
 * Composes lower layers only (surface + icon + input + button). Light up the
 * glass after mounting via `material.bind(node)`.
 *
 * @param {Object} props
 * @param {string} [props.placeholder]
 * @param {string} [props.material] surface material
 * @param {boolean} [props.action] show a trailing accent "Search" button
 * @returns {HTMLElement}
 */
export function createSearchbar({ placeholder = 'Search', material = 'regular', action = false } = {}) {
  const children = [
    createIcon({ name: 'search', size: 'sm' }),
    el('input', { class: 'lg-searchbar__field', type: 'search', placeholder, 'aria-label': placeholder }),
  ];
  if (action) children.push(createButton({ label: 'Search', variant: 'accent' }));

  // The searchbar IS a surface (it composes the glass shell as its root).
  return createSurface({ material, class: 'lg-searchbar', children });
}
