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
  /** RGB refraction split, normalized against displacement strength. */
  chromatic?: number;
  /** Backdrop blur in px (0 = none). */
  blur: number;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
export const CHROMATIC_SPREAD_RATIO = 0.2;

/**
 * Build the `<filter>` element graph:
 *   feImage(displacement) → feDisplacementMap(SourceGraphic)
 *   → [feGaussianBlur] → [feImage(specular) → feBlend]
 *
 * See ../../../docs/reference/concepts/compositing.md.
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

  appendDisplacementStage(filter, 'SourceGraphic', 'dispMap', spec.scale, spec.chromatic ?? 0);

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

function appendDisplacementStage(
  filter: SVGFilterElement,
  input: string,
  map: string,
  scale: number,
  chromatic: number,
): void {
  const ca = Math.max(0, chromatic);
  if (ca <= 0) {
    filter.appendChild(displacement(input, map, scale, 'displaced', 'base'));
    return;
  }

  const spread = Math.abs(scale) * CHROMATIC_SPREAD_RATIO * ca;
  filter.appendChild(displacement(input, map, Math.max(0, scale - spread), 'r_d', 'r'));
  filter.appendChild(el('feColorMatrix', { in: 'r_d', type: 'matrix', values: RED_ONLY, result: 'rch' }));
  filter.appendChild(displacement(input, map, scale, 'g_d', 'g'));
  filter.appendChild(el('feColorMatrix', { in: 'g_d', type: 'matrix', values: GREEN_ONLY, result: 'gch' }));
  filter.appendChild(displacement(input, map, scale + spread, 'b_d', 'b'));
  filter.appendChild(el('feColorMatrix', { in: 'b_d', type: 'matrix', values: BLUE_ONLY, result: 'bch' }));
  filter.appendChild(el('feBlend', { in: 'rch', in2: 'gch', mode: 'screen', result: 'rg' }));
  filter.appendChild(el('feBlend', { in: 'rg', in2: 'bch', mode: 'screen', result: 'displaced' }));
}

function displacement(
  input: string,
  map: string,
  scale: number,
  result: string,
  channel: string,
): SVGElement {
  return el('feDisplacementMap', {
    in: input,
    in2: map,
    scale: String(scale),
    xChannelSelector: 'R',
    yChannelSelector: 'G',
    result,
    'data-lg-channel': channel,
  });
}

const RED_ONLY = '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0';
const GREEN_ONLY = '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0';
const BLUE_ONLY = '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0';

function el(name: string, attrs: Record<string, string>, children: Element[] = []): SVGElement {
  const node = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'href') node.setAttributeNS('http://www.w3.org/1999/xlink', 'href', v);
    node.setAttribute(k, v);
  }
  for (const child of children) node.appendChild(child);
  return node as SVGElement;
}
