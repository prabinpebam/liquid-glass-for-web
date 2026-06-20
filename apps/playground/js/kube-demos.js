/**
 * Faithful kube.io demos — uses the article's actual pre-baked displacement /
 * specular map PNGs and the exact SVG <filter> chains documented at
 * kube.io/blog/liquid-glass-css-svg. The adjustable parameters tweak filter
 * attributes live (no map regeneration), exactly like the reference.
 *
 * Maps live in ../assets/maps/. See ../../../docs/attribution.md.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK = 'http://www.w3.org/1999/xlink';
const MAPS = './assets/maps';

let _uid = 0;
const nextId = (p) => `${p}-${(_uid++).toString(36)}`;

function svg(name, attrs, kids = []) {
  const el = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'href') el.setAttributeNS(XLINK, 'href', v);
    else el.setAttribute(k, String(v));
  }
  for (const kid of kids) el.appendChild(kid);
  return el;
}

let _defs = null;
function defs() {
  if (!_defs) {
    const s = svg('svg', { 'aria-hidden': 'true' });
    s.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
    s.appendChild(svg('defs', {}));
    document.body.appendChild(s);
    _defs = s.querySelector('defs');
  }
  return _defs;
}

/* ----------------------------------------------------------------------------
 * Precision Lens  (210 x 150) — magnifying-map + displacement-map + specular.
 * ------------------------------------------------------------------------- */
export function applyLens(el, opts = {}) {
  const id = nextId('lens-filter');
  const w = 210;
  const h = 150;
  const BASE_REFRACTION = 98.24713343067756; // reference scale at level 1.0

  const filter = svg('filter', {
    id,
    x: '-30%',
    y: '-30%',
    width: '160%',
    height: '160%',
    'color-interpolation-filters': 'sRGB',
  });

  filter.append(
    svg('feImage', { href: `${MAPS}/magnifying-map-q51ggw.png`, x: 0, y: 0, width: w, height: h, preserveAspectRatio: 'none', result: 'magnifying_displacement_map' }),
  );
  const mag = svg('feDisplacementMap', { in: 'SourceGraphic', in2: 'magnifying_displacement_map', scale: 24, xChannelSelector: 'R', yChannelSelector: 'G', result: 'magnified_source' });
  filter.append(
    mag,
    svg('feGaussianBlur', { in: 'magnified_source', stdDeviation: 0, result: 'blurred_source' }),
    svg('feImage', { href: `${MAPS}/displacement-map-w2qrsb.png`, x: 0, y: 0, width: w, height: h, preserveAspectRatio: 'none', result: 'displacement_map' }),
  );
  const disp = svg('feDisplacementMap', { in: 'blurred_source', in2: 'displacement_map', scale: BASE_REFRACTION, xChannelSelector: 'R', yChannelSelector: 'G', result: 'displaced' });
  const sat = svg('feColorMatrix', { in: 'displaced', type: 'saturate', values: 9, result: 'displaced_saturated' });
  const specImg = svg('feImage', { href: `${MAPS}/specular-map-w2qrsb.png`, x: 0, y: 0, width: w, height: h, preserveAspectRatio: 'none', result: 'specular_layer' });
  const funcA = svg('feFuncA', { type: 'linear', slope: 0.5 });
  filter.append(
    disp,
    sat,
    specImg,
    svg('feComposite', { in: 'displaced_saturated', in2: 'specular_layer', operator: 'in', result: 'specular_saturated' }),
    svg('feComponentTransfer', { in: 'specular_layer', result: 'specular_faded' }, [funcA]),
    svg('feBlend', { in: 'specular_saturated', in2: 'displaced', mode: 'normal', result: 'withSaturation' }),
    svg('feBlend', { in: 'specular_faded', in2: 'withSaturation', mode: 'normal' }),
  );
  defs().appendChild(filter);

  el.style.backdropFilter = `url(#${id})`;
  el.style.webkitBackdropFilter = `url(#${id})`;

  const api = {
    set refraction(v) { disp.setAttribute('scale', String(BASE_REFRACTION * v)); },
    set saturation(v) { sat.setAttribute('values', String(v)); },
    set specular(v) { funcA.setAttribute('slope', String(v)); },
    set magnify(v) { mag.setAttribute('scale', String(v)); },
  };
  api.refraction = opts.refraction ?? 1;
  api.saturation = opts.saturation ?? 9;
  api.specular = opts.specular ?? 0.5;
  return api;
}

/* ----------------------------------------------------------------------------
 * Searchbox  (420 x 56) — pre-blur + displacement + specular.
 * ------------------------------------------------------------------------- */
export function applySearchbox(el, opts = {}) {
  const id = nextId('searchbox-filter');
  const w = 420;
  const h = 56;
  const BASE_REFRACTION = 54.97305784439829 / 0.7; // reference scale at level 0.7

  const filter = svg('filter', {
    id,
    x: '-20%',
    y: '-60%',
    width: '140%',
    height: '220%',
    'color-interpolation-filters': 'sRGB',
  });

  const blur = svg('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: 1, result: 'blurred_source' });
  const disp = svg('feDisplacementMap', { in: 'blurred_source', in2: 'displacement_map', scale: 54.97305784439829, xChannelSelector: 'R', yChannelSelector: 'G', result: 'displaced' });
  const sat = svg('feColorMatrix', { in: 'displaced', type: 'saturate', values: 4, result: 'displaced_saturated' });
  const funcA = svg('feFuncA', { type: 'linear', slope: 0.2 });
  filter.append(
    blur,
    svg('feImage', { href: `${MAPS}/displacement-map-yiydeb.png`, x: 0, y: 0, width: w, height: h, preserveAspectRatio: 'none', result: 'displacement_map' }),
    disp,
    sat,
    svg('feImage', { href: `${MAPS}/specular-map-yiydeb.png`, x: 0, y: 0, width: w, height: h, preserveAspectRatio: 'none', result: 'specular_layer' }),
    svg('feComposite', { in: 'displaced_saturated', in2: 'specular_layer', operator: 'in', result: 'specular_saturated' }),
    svg('feComponentTransfer', { in: 'specular_layer', result: 'specular_faded' }, [funcA]),
    svg('feBlend', { in: 'specular_saturated', in2: 'displaced', mode: 'normal', result: 'withSaturation' }),
    svg('feBlend', { in: 'specular_faded', in2: 'withSaturation', mode: 'normal' }),
  );
  defs().appendChild(filter);

  el.style.backdropFilter = `url(#${id})`;
  el.style.webkitBackdropFilter = `url(#${id})`;

  const api = {
    set refraction(v) { disp.setAttribute('scale', String(BASE_REFRACTION * v)); },
    set saturation(v) { sat.setAttribute('values', String(v)); },
    set specular(v) { funcA.setAttribute('slope', String(v)); },
    set blur(v) { blur.setAttribute('stdDeviation', String(v)); },
  };
  api.refraction = opts.refraction ?? 0.7;
  api.saturation = opts.saturation ?? 4;
  api.specular = opts.specular ?? 0.2;
  api.blur = opts.blur ?? 1;
  return api;
}

/* ----------------------------------------------------------------------------
 * Generic kube glass filter — the exact chain shared by the Switch, Slider and
 * Music Player components (blur → displace → saturate → specular composite).
 *   feGaussianBlur → feImage(disp) → feDisplacementMap → feColorMatrix(saturate)
 *   → feImage(spec) → feComposite(in) → feComponentTransfer → feBlend → feBlend
 * The four live parameters mirror the reference controls.
 * ------------------------------------------------------------------------- */
function makeGlassFilter(el, { disp, spec, base, w, h }) {
  const id = nextId('glass-filter');

  const blur = svg('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: 0.2, result: 'blurred_source' });
  const dispMap = svg('feDisplacementMap', { in: 'blurred_source', in2: 'displacement_map', scale: base, xChannelSelector: 'R', yChannelSelector: 'G', result: 'displaced' });
  const sat = svg('feColorMatrix', { in: 'displaced', type: 'saturate', values: 4, result: 'displaced_saturated' });
  const funcA = svg('feFuncA', { type: 'linear', slope: 0.4 });

  const filter = svg('filter', {
    id,
    x: '-30%',
    y: '-30%',
    width: '160%',
    height: '160%',
    'color-interpolation-filters': 'sRGB',
  });
  filter.append(
    blur,
    svg('feImage', { href: `${MAPS}/${disp}`, x: 0, y: 0, width: w, height: h, preserveAspectRatio: 'none', result: 'displacement_map' }),
    dispMap,
    sat,
    svg('feImage', { href: `${MAPS}/${spec}`, x: 0, y: 0, width: w, height: h, preserveAspectRatio: 'none', result: 'specular_layer' }),
    svg('feComposite', { in: 'displaced_saturated', in2: 'specular_layer', operator: 'in', result: 'specular_saturated' }),
    svg('feComponentTransfer', { in: 'specular_layer', result: 'specular_faded' }, [funcA]),
    svg('feBlend', { in: 'specular_saturated', in2: 'displaced', mode: 'normal', result: 'withSaturation' }),
    svg('feBlend', { in: 'specular_faded', in2: 'withSaturation', mode: 'normal' }),
  );
  defs().appendChild(filter);

  el.style.backdropFilter = `url(#${id})`;
  el.style.webkitBackdropFilter = `url(#${id})`;

  const api = {
    set refraction(v) { dispMap.setAttribute('scale', String(base * v)); },
    set saturation(v) { sat.setAttribute('values', String(v)); },
    set specular(v) { funcA.setAttribute('slope', String(v)); },
    set blur(v) { blur.setAttribute('stdDeviation', String(v)); },
  };
  return api;
}

function applyDefaults(api, opts) {
  api.blur = opts.blur ?? 0.2;
  api.refraction = opts.refraction ?? 1;
  api.specular = opts.specular ?? 0.4;
  api.saturation = opts.saturation ?? 4;
  return api;
}

/* ----------------------------------------------------------------------------
 * Switch knob  (146 x 92, lip bezel) — map z1p3yi, base 55.65.
 * The glass knob overhangs the 160x67 track so its lip bezel magnifies the
 * track colour as it slides.
 * ------------------------------------------------------------------------- */
export function applySwitch(el, opts = {}) {
  const api = makeGlassFilter(el, {
    disp: 'displacement-map-z1p3yi.png',
    spec: 'specular-map-z1p3yi.png',
    base: 55.65161904498752,
    w: 146,
    h: 92,
  });
  return applyDefaults(api, opts);
}

/* ----------------------------------------------------------------------------
 * Slider thumb  (90 x 60, convex) — map 76hifn, base 83.88.
 * ------------------------------------------------------------------------- */
export function applySlider(el, opts = {}) {
  const api = makeGlassFilter(el, {
    disp: 'displacement-map-76hifn.png',
    spec: 'specular-map-76hifn.png',
    base: 83.88118841653394,
    w: 90,
    h: 60,
  });
  return applyDefaults(api, opts);
}

/* ----------------------------------------------------------------------------
 * Music Player bar  (640 x 63, convex) — map yr2eh1, base 74.65.
 * ------------------------------------------------------------------------- */
export function applyPlayer(el, opts = {}) {
  const api = makeGlassFilter(el, {
    disp: 'displacement-map-yr2eh1.png',
    spec: 'specular-map-yr2eh1.png',
    base: 74.65216865752852,
    w: 640,
    h: 63,
  });
  return applyDefaults(api, opts);
}
