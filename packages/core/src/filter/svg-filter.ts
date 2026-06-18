import type { GeneratedMap } from '../types.js';

let uid = 0;
/** Unique, DOM-safe filter id. */
export function nextFilterId(prefix = 'liquid-glass'): string {
  return `${prefix}-${(uid++).toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface FilterSpec {
  id: string;
  width: number;
  height: number;
  /** Displacement-map image (R = X, G = Y). */
  displacement: GeneratedMap;
  /** Optional specular rim-light image, blended over the result. */
  specular?: GeneratedMap | null;
  /** Displacement strength in px (the field's maxDisplacement * scale). */
  scale: number;
  /** Backdrop blur in px (0 = none). */
  blur: number;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Build the `<filter>` element graph:
 *   feImage(displacement) → feDisplacementMap(SourceGraphic)
 *   → [feGaussianBlur] → [feImage(specular) → feBlend]
 *
 * See ../../../docs/concepts/compositing.md.
 */
export function buildFilter(spec: FilterSpec): SVGFilterElement {
  const filter = document.createElementNS(SVG_NS, 'filter');
  filter.setAttribute('id', spec.id);
  filter.setAttribute('x', '0');
  filter.setAttribute('y', '0');
  filter.setAttribute('width', '100%');
  filter.setAttribute('height', '100%');
  filter.setAttribute('color-interpolation-filters', 'sRGB');

  const dispImg = el('feImage', {
    result: 'dispMap',
    href: spec.displacement.dataUrl,
    x: '0',
    y: '0',
    width: String(spec.width),
    height: String(spec.height),
    preserveAspectRatio: 'none',
  });
  filter.appendChild(dispImg);

  const displace = el('feDisplacementMap', {
    in: 'SourceGraphic',
    in2: 'dispMap',
    scale: String(spec.scale),
    xChannelSelector: 'R',
    yChannelSelector: 'G',
    result: 'displaced',
  });
  filter.appendChild(displace);

  let last = 'displaced';
  if (spec.blur > 0) {
    filter.appendChild(
      el('feGaussianBlur', { in: last, stdDeviation: String(spec.blur), result: 'blurred' }),
    );
    last = 'blurred';
  }

  if (spec.specular) {
    filter.appendChild(
      el('feImage', {
        result: 'specMap',
        href: spec.specular.dataUrl,
        x: '0',
        y: '0',
        width: String(spec.width),
        height: String(spec.height),
        preserveAspectRatio: 'none',
      }),
    );
    filter.appendChild(
      el('feBlend', { in: last, in2: 'specMap', mode: 'screen', result: 'lit' }),
    );
    last = 'lit';
  }

  // Final pass-through so `last` is the filter result.
  filter.appendChild(el('feMerge', {}, [el('feMergeNode', { in: last })]));

  return filter as SVGFilterElement;
}

function el(name: string, attrs: Record<string, string>, children: Element[] = []): SVGElement {
  const node = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'href') node.setAttributeNS('http://www.w3.org/1999/xlink', 'href', v);
    node.setAttribute(k, v);
  }
  for (const child of children) node.appendChild(child);
  return node as SVGElement;
}
