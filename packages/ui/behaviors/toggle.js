/**
 * behaviors/toggle.js — interaction for the toggle component (LG-P12).
 *
 * Behavior is separate from structure: the `createToggle` factory is pure
 * (data in, DOM out, no events). This optional behavior is attached to a
 * rendered node to make it interactive, mirroring `material.bind(node)`.
 *
 * It never writes component CSS values — it only flips the documented state
 * class (`is-on`) and the matching ARIA state, so the CSS transition
 * (driven by motion tokens) handles the knob travel. Attaching or detaching
 * never changes layout (design-spec §6.8).
 *
 * @see ../../docs/design-library/design-spec.md  (LG-P12, §4.8)
 */

/**
 * Make a rendered `.lg-toggle` interactive.
 *
 * @param {HTMLElement} node a mounted toggle element from `createToggle`
 * @param {Object} [opts]
 * @param {(on: boolean) => void} [opts.onChange] called after each state change
 * @returns {() => void} detach — restores the node to its pre-attach state
 */
export function attachToggle(node, { onChange } = {}) {
  if (!node || node.dataset.lgToggleBound === 'true') return () => {};
  node.dataset.lgToggleBound = 'true';

  const isOn = () => node.classList.contains('is-on');
  const isDisabled = () => node.classList.contains('is-disabled') || node.hasAttribute('disabled');

  const set = (on) => {
    node.classList.toggle('is-on', on);
    node.setAttribute('aria-checked', on ? 'true' : 'false');
    onChange?.(on);
    node.dispatchEvent(new CustomEvent('lg-change', { bubbles: true, detail: { on } }));
  };

  const toggle = () => { if (!isDisabled()) set(!isOn()); };

  const onClick = () => toggle();
  const onKeydown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); }
  };

  node.addEventListener('click', onClick);
  node.addEventListener('keydown', onKeydown);

  return function detach() {
    node.removeEventListener('click', onClick);
    node.removeEventListener('keydown', onKeydown);
    delete node.dataset.lgToggleBound;
  };
}
