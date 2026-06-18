/**
 * el.js — the single DOM primitive for the Liquid Glass design library.
 *
 * Every factory builds nodes with el(). No innerHTML, no template strings,
 * no .html fragment files (see architecture-spec §5).
 *
 * @param {string} tag
 * @param {Record<string, string|number|boolean|null|undefined>} [attrs]
 *   Attribute map. `class` sets className. Keys are written as-is, so use
 *   data-* / aria-* names directly. Falsy (false/null/undefined) values are skipped.
 * @param {...(Node|string|null|undefined)} children
 * @returns {HTMLElement}
 */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === false || value === null || value === undefined) continue;
    if (key === 'class') node.className = String(value);
    else node.setAttribute(key, String(value));
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}
