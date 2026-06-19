import { el } from '../../core/index.js';

/**
 * The closed surface palette (LG-P13). Mirrors `library.manifest.json` →
 * `materials`. Components must pick one of these; new surfaces are added here
 * (and to the manifest) by governance, never invented at a call site.
 * @type {readonly string[]}
 */
export const SURFACES = ['regular', 'clear', 'frosted'];

/**
 * Atom (L1): surface — the glass shell every glassy component composes.
 *
 * Returns the shell node only. Light up the glass after mounting by calling
 * `material.bind(node)` (core/material.js), which reads this element's
 * `--lg-surface-*` tokens and attaches the refraction engine.
 *
 * @param {Object} props
 * @param {string} [props.material] one of SURFACES ('regular' | 'clear' | 'frosted')
 * @param {string} [props.tag] host tag (default 'div')
 * @param {string} [props.class] extra classes (e.g. a component root class)
 * @param {Record<string, string|number|boolean|null|undefined>} [props.attrs] host attributes
 * @param {Array<Node|string>} [props.children]
 * @returns {HTMLElement}
 */
export function createSurface({ material = 'regular', tag = 'div', class: extra = '', attrs = {}, children = [] } = {}) {
  if (!SURFACES.includes(material)) {
    console.error(`[liquid-glass] unknown surface "${material}"; pick one of ${SURFACES.join(', ')} (LG-P13). Falling back to "regular".`);
    material = 'regular';
  }
  const { class: attrClass, ...rest } = attrs;
  const cls = ['lg-surface', extra, attrClass].filter(Boolean).join(' ');
  const surfaceAttrs = { ...rest, class: cls };
  if (material !== 'regular') surfaceAttrs['data-lg-material'] = material;
  return el(tag, surfaceAttrs, ...children);
}
