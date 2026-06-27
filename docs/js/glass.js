/* ============================================================================
   glass.js — a self-contained, buildless liquid-glass runtime for the docs.

   This is a faithful JS port of @liquid-glass/core (so the docs site needs no
   build step): it procedurally generates a displacement map + specular rim from
   a bezel surface function (Snell refraction), builds the kube SVG <filter>
   chain, and applies it as a backdrop-filter so the element refracts whatever
   is painted behind it. It also ships the Spring physics primitive + the named
   spring families and the activation model that every interactive glass control
   shares (see docs/reference/design-library/motion-spec.md).
   ========================================================================== */

const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK = 'http://www.w3.org/1999/xlink';

/* ----------------------------------------------------------------------------
 * Spring — critically/under-damped harmonic oscillator, integrated with
 * semi-implicit Euler at fixed sub-steps (framer-motion's {stiffness,damping,
 * mass} contract). The engine behind every state transition in the library.
 * ------------------------------------------------------------------------- */
export class Spring {
  constructor(value, { stiffness = 170, damping = 26, mass = 1 } = {}) {
    this.value = value; this.target = value; this.velocity = 0;
    this.k = stiffness; this.c = damping; this.m = mass;
    this.subs = new Set(); this._raf = 0; this._last = 0;
  }
  onChange(cb) { this.subs.add(cb); cb(this.value); return () => this.subs.delete(cb); }
  _emit() { for (const cb of this.subs) cb(this.value); }
  get() { return this.value; }
  get active() { return this._raf !== 0; }
  jump(v) { this.value = this.target = v; this.velocity = 0; this._emit(); }
  set(target) {
    if (target === this.target && !this._raf) return;
    this.target = target;
    if (!this._raf) { this._last = performance.now(); this._raf = requestAnimationFrame(this._step); }
  }
  _step = (now) => {
    let dt = (now - this._last) / 1000; this._last = now;
    if (dt > 0.064) dt = 0.064;
    const steps = Math.max(1, Math.ceil(dt / 0.004));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      const f = -this.k * (this.value - this.target) - this.c * this.velocity;
      this.velocity += (f / this.m) * h;
      this.value += this.velocity * h;
    }
    this._emit();
    if (Math.abs(this.velocity) < 0.0008 && Math.abs(this.value - this.target) < 0.0004) {
      this.value = this.target; this.velocity = 0; this._emit(); this._raf = 0; return;
    }
    this._raf = requestAnimationFrame(this._step);
  };
}

/** Named spring families — mirror tokens/motion.css (the closed motion set). */
export const SPRINGS = {
  snap:   { stiffness: 2000, damping: 80 },
  glide:  { stiffness: 1000, damping: 80 },
  settle: { stiffness: 170,  damping: 26 },
  grab:   { stiffness: 250,  damping: 14 },
  jelly:  { stiffness: 340,  damping: 20 },
  damp:   { stiffness: 220,  damping: 24 },
};
export const spring = (family, value) => new Spring(value, SPRINGS[family] || SPRINGS.settle);

/** Shared activation endpoints (rest → active), from the motion spec. */
export const ACTIVATION = {
  glassAlphaRest: 1, glassAlphaActive: 0.1,
  refractionRest: 0.4, refractionActive: 0.9,
};

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
export const clamp01 = (v) => clamp(v, 0, 1);
export const lerp = (a, b, t) => a + (b - a) * t;
const prefersReduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export { prefersReduced };

/* ----------------------------------------------------------------------------
 * Bezel surface functions → displacement field (Snell refraction).
 * ------------------------------------------------------------------------- */
const surfaces = {
  convex: (d) => Math.sqrt(Math.max(0, 1 - (1 - d) * (1 - d))),
  concave: (d) => 1 - Math.sqrt(Math.max(0, 1 - d * d)),
  lip: (d) => 0.6 * Math.sqrt(Math.max(0, 1 - (1 - d) * (1 - d))) + 0.4 * (0.5 - 0.5 * Math.cos(Math.PI * d)),
  flat: (d) => d,
};

function surfaceNormal(f, d, delta = 0.001) {
  const deriv = (f(d + delta) - f(d - delta)) / (2 * delta);
  const len = Math.hypot(-deriv, 1) || 1;
  return { x: -deriv / len, y: 1 / len };
}
function refract(incidence, n1, n2) {
  const s = (n1 / n2) * Math.sin(incidence);
  return Math.abs(s) > 1 ? null : Math.asin(s);
}
/** Half-slice of normalized displacement magnitudes + the peak in px. */
function buildField(kind, bezelPx, indexRatio, res = 48) {
  const f = surfaces[kind] || surfaces.convex;
  const mags = [];
  for (let i = 0; i < res; i++) {
    const d = res <= 1 ? 0 : i / (res - 1);
    const n = surfaceNormal(f, d);
    const incidence = Math.acos(clamp(n.y, -1, 1));
    const r = refract(incidence, 1, indexRatio);
    mags.push(r === null ? 0 : Math.tan(incidence - r) * bezelPx);
  }
  const max = mags.reduce((m, v) => Math.max(m, Math.abs(v)), 0) || 1;
  return { samples: mags.map((v) => v / max), maxDisplacement: max, res };
}
function sampleField(samples, t) {
  const n = samples.length, f = clamp01(t) * (n - 1);
  const i0 = Math.floor(f), i1 = Math.min(n - 1, i0 + 1);
  return samples[i0] + (samples[i1] - samples[i0]) * (f - i0);
}

/* ----------------------------------------------------------------------------
 * Rounded-rect signed distance + inward normal (clean-room SDF).
 * ------------------------------------------------------------------------- */
function rrEdge(x, y, w, h, radius) {
  const r = Math.min(radius, w / 2, h / 2);
  const px = x - w / 2, py = y - h / 2;
  const qx = Math.abs(px) - (w / 2 - r), qy = Math.abs(py) - (h / 2 - r);
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
  const inside = Math.min(Math.max(qx, qy), 0);
  const distance = -(outside + inside - r); // positive inside, 0 on border
  // outward normal ≈ gradient of the SDF; in the straight-edge regions it is axial
  let gx, gy;
  if (qx > 0 && qy > 0) { const l = Math.hypot(qx, qy) || 1; gx = (Math.sign(px) * qx) / l; gy = (Math.sign(py) * qy) / l; }
  else if (qx > qy) { gx = Math.sign(px); gy = 0; }
  else { gx = 0; gy = Math.sign(py); }
  return { distance, nx: -gx, ny: -gy };
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, w | 0); c.height = Math.max(1, h | 0);
  return c;
}

/** Displacement map: R=X shift, G=Y shift, 128 neutral. */
function displacementURL(field, geo) {
  const { width, height, radius, bezel } = geo;
  const c = makeCanvas(width, height);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(c.width, c.height);
  const data = img.data;
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      const i = (y * c.width + x) * 4;
      const e = rrEdge(x + 0.5, y + 0.5, c.width, c.height, radius);
      let r = 128, g = 128;
      if (bezel > 0 && e.distance >= 0 && e.distance <= bezel) {
        const mag = sampleField(field.samples, e.distance / bezel);
        r = 128 + e.nx * mag * 127;
        g = 128 + e.ny * mag * 127;
      }
      data[i] = clamp(Math.round(r), 0, 255);
      data[i + 1] = clamp(Math.round(g), 0, 255);
      data[i + 2] = 128; data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL('image/png');
}

/** Specular rim — the canonical edge highlight for EVERY glass element.
 *
 * Ported VERBATIM from the kube reference generator `Gr` in blog-Df6HVmF0.js,
 * invoked there as `Gr(400, 250, 120, 25, angle, 2)`. The last arg `i = 2` is a
 * 2× SUPERSAMPLE: the map is rendered at double resolution and the `feImage`
 * downscales it, giving a crisp anti-aliased line. The rim profile width is tied
 * to that scale (`l`), NOT to the element size — so the lit edge is a constant
 * ~2px line on every element, never a thick band.
 *
 *   for each pixel in the rounded-rect edge ring (scaled space, l = 2):
 *     depth = radius·l − dist
 *     N     = |normal · lightAxis| · sqrt(1 − (1 − depth/l)²)
 *     rgb   = 255·N ,  alpha = 255·N²·P        (P = outer anti-alias)
 *
 * Two non-negotiable properties:
 *   • DIRECTIONAL — `Math.abs(normal · lightAxis)` lights two opposing arcs;
 *     the perpendicular sides and two opposite corners go dark. Never uniform.
 *   • CRISP — the semicircular profile `sqrt(1 − (1 − u)²)` is 0 at the very
 *     edge and peaks just inside → a thin tube line, never a fuzzy gradient.
 * This is the only mechanism that draws the lit edge; never use a CSS border or
 * a static box-shadow rim. */
function specularURL(geo, light = -Math.PI / 4) {
  const l = 2;                                 // supersample scale (reference i = 2)
  const cw = Math.max(1, Math.round(geo.width * l));
  const ch = Math.max(1, Math.round(geo.height * l));
  const c = makeCanvas(cw, ch);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(cw, ch);
  const data = img.data;
  const x0 = Math.cos(light), y0 = Math.sin(light);
  const h = geo.radius * l;                     // scaled corner radius
  const p = Math.max(0, geo.bezel) * l;         // scaled depth (inner ring extent)
  const f = h * h, g = (h + l) * (h + l), F = (h - p) * (h - p);
  const sf = Math.sqrt(f), sg = Math.sqrt(g);
  const spanX = cw - h * 2, spanY = ch - h * 2;
  for (let C = 0; C < ch; C++) {
    for (let A = 0; A < cw; A++) {
      const q = (C * cw + A) * 4;
      const G = A < h, T = A >= cw - h, X = C < h, J = C >= ch - h;
      const L = G ? A - h : T ? A - h - spanX : 0;   // dx from nearest corner centre
      const E = X ? C - h : J ? C - h - spanY : 0;   // dy from nearest corner centre
      const M = L * L + E * E;
      if (M > g || M < F) continue;
      const b = Math.sqrt(M) || 1e-9;
      const depth = h - b;                           // inward from the radius edge
      const inside = 1 - (1 - depth / l) * (1 - depth / l);
      if (inside <= 0) continue;                     // outside the thin rim profile
      const P = M < f ? 1 : 1 - (b - sf) / (sg - sf); // outer anti-alias
      const nx = L / b, ny = -E / b;                 // outward normal (reference k = -E/b)
      const N = Math.abs(nx * x0 + ny * y0) * Math.sqrt(inside);
      const R = clamp(Math.round(255 * N), 0, 255);
      data[q] = R; data[q + 1] = R; data[q + 2] = R;
      data[q + 3] = clamp(Math.round(255 * N * N * P), 0, 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL('image/png');
}

/* ----------------------------------------------------------------------------
 * Shared <defs> host + SVG helpers.
 * ------------------------------------------------------------------------- */
let _defs = null;
function defs() {
  if (!_defs) {
    const s = document.createElementNS(SVG_NS, 'svg');
    s.setAttribute('aria-hidden', 'true');
    s.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
    s.appendChild(document.createElementNS(SVG_NS, 'defs'));
    document.body.appendChild(s);
    _defs = s.querySelector('defs');
  }
  return _defs;
}
let _uid = 0;
const nextId = () => `lg-glass-${(_uid++).toString(36)}`;
function svg(name, attrs, kids = []) {
  const el = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'href') el.setAttributeNS(XLINK, 'href', v);
    else el.setAttribute(k, String(v));
  }
  for (const kid of kids) el.appendChild(kid);
  return el;
}

function supportsBackdropUrl() {
  return typeof CSS !== 'undefined' && CSS.supports &&
    (CSS.supports('backdrop-filter', 'url(#x)') || CSS.supports('-webkit-backdrop-filter', 'url(#x)'));
}

const RED_ONLY = '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0';
const GREEN_ONLY = '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0';
const BLUE_ONLY = '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0';
const CHROMATIC_SPREAD_RATIO = 0.2;

function chromaticDisplacementNodes(input, map) {
  return [
    svg('feDisplacementMap', { in: input, in2: map, scale: 0, xChannelSelector: 'R', yChannelSelector: 'G', result: 'r_d', 'data-lg-channel': 'r' }),
    svg('feColorMatrix', { in: 'r_d', type: 'matrix', values: RED_ONLY, result: 'rch' }),
    svg('feDisplacementMap', { in: input, in2: map, scale: 0, xChannelSelector: 'R', yChannelSelector: 'G', result: 'g_d', 'data-lg-channel': 'g' }),
    svg('feColorMatrix', { in: 'g_d', type: 'matrix', values: GREEN_ONLY, result: 'gch' }),
    svg('feDisplacementMap', { in: input, in2: map, scale: 0, xChannelSelector: 'R', yChannelSelector: 'G', result: 'b_d', 'data-lg-channel': 'b' }),
    svg('feColorMatrix', { in: 'b_d', type: 'matrix', values: BLUE_ONLY, result: 'bch' }),
    svg('feBlend', { in: 'rch', in2: 'gch', mode: 'screen', result: 'rg' }),
    svg('feBlend', { in: 'rg', in2: 'bch', mode: 'screen', result: 'displaced' }),
  ];
}

function setDisplacementScales(nodes, scale, chromatic) {
  const spread = Math.abs(scale) * CHROMATIC_SPREAD_RATIO * chromatic;
  for (const node of nodes) {
    if (node.localName !== 'feDisplacementMap') continue;
    const channel = node.getAttribute('data-lg-channel');
    if (channel === 'r') node.setAttribute('scale', String(Math.max(0, scale - spread)));
    else if (channel === 'b') node.setAttribute('scale', String(scale + spread));
    else node.setAttribute('scale', String(scale));
  }
}

function cssRadiusPx(value, size) {
  const token = String(value || '').trim().split(/\s+/)[0];
  if (!token) return 0;
  if (token.endsWith('%')) return (parseFloat(token) / 100) * size;
  return parseFloat(token) || 0;
}

function resolveRadius(el, requested, width, height) {
  const maxRadius = Math.min(width, height) / 2;
  if (requested === 'pill') return maxRadius;
  if (requested === 'css') {
    const cs = getComputedStyle(el);
    const radii = [
      cssRadiusPx(cs.borderTopLeftRadius, Math.min(width, height)),
      cssRadiusPx(cs.borderTopRightRadius, Math.min(width, height)),
      cssRadiusPx(cs.borderBottomRightRadius, Math.min(width, height)),
      cssRadiusPx(cs.borderBottomLeftRadius, Math.min(width, height)),
    ];
    return Math.min(maxRadius, Math.max(...radii));
  }
  return Math.min(maxRadius, Number(requested) || 0);
}

/* ----------------------------------------------------------------------------
 * Inner shading map — a directional inset shadow (glass thickness) plus an
 * opposing caustic glow, rendered as one RGBA image and blended into the filter
 * UNDER the specular rim so the lit edge always stays the top optical layer.
 * Uses the canvas inset-shadow technique (clip to the shape, then cast the
 * shadow of the surrounding frame inward) so the profile matches a CSS
 * `box-shadow: inset` exactly. Offsets scale with the corner radius; the angle
 * drives the dark (offset) and the white glow (opposite) directions.
 * ------------------------------------------------------------------------- */
function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function castInsetShadow(ctx, w, h, radius, ox, oy, blur, color) {
  ctx.save();
  ctx.beginPath();
  roundRectPath(ctx, 0, 0, w, h, radius);
  ctx.clip();                                   // the shadow only shows inside the shape
  const pad = Math.abs(ox) + Math.abs(oy) + blur + radius + 20;
  ctx.beginPath();
  ctx.rect(-pad, -pad, w + pad * 2, h + pad * 2);
  roundRectPath(ctx, 0, 0, w, h, radius);       // even-odd hole -> frame around the shape
  ctx.shadowColor = color;
  ctx.shadowOffsetX = ox;
  ctx.shadowOffsetY = oy;
  ctx.shadowBlur = blur;
  ctx.fillStyle = '#000';                       // clipped away; only its inward shadow remains
  ctx.fill('evenodd');
  ctx.restore();
}

function innerShadeURL(geo, o) {
  const w = Math.max(1, geo.width | 0), h = Math.max(1, geo.height | 0);
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  const shadow = clamp01(Number(o.innerShadow) || 0);
  const glow = clamp01(Number(o.innerGlow) || 0);
  if (shadow > 0 || glow > 0) {
    const r = Math.max(1, geo.radius);
    const a = ((Number(o.innerShadowAngle) || 45) * Math.PI) / 180;
    const ux = Math.cos(a), uy = Math.sin(a);
    const sOff = Math.max(0, Number(o.innerShadowSize) || 0) * r;
    const gOff = Math.max(0, Number(o.innerGlowSize) || 0) * r;
    if (shadow > 0) castInsetShadow(ctx, w, h, geo.radius, ux * sOff, uy * sOff, sOff, `rgba(0, 0, 0, ${shadow})`);
    if (glow > 0) castInsetShadow(ctx, w, h, geo.radius, -ux * gOff, -uy * gOff, gOff, `rgba(255, 255, 255, ${glow})`);
  }
  return c.toDataURL('image/png');
}

/* ----------------------------------------------------------------------------
 * attachGlass(el, opts) — generate maps for the element's box and apply the
 * kube filter chain. Returns a live handle.
 *
 * opts: { surface, radius|'pill', refractionInset|'radius'|bezel, thickness(index),
 *         blur, refraction, saturation, specular, light, fallbackBlur }
 * ------------------------------------------------------------------------- */
export function attachGlass(el, opts = {}) {
  const id = nextId();
  const o = {
    surface: 'convex', radius: 'pill', refractionInset: 'radius', thickness: 1.5,
    blur: 0.4, refraction: null, chromatic: 1, saturation: 6, specular: 1,
    innerShadow: 0, innerShadowSize: 1, innerGlow: 0, innerGlowSize: 1, innerShadowAngle: 45,
    light: -Math.PI / 4, fallbackBlur: 8, ...opts,
  };
  if (opts.refractionInset == null && opts.bezel != null) o.refractionInset = opts.bezel;

  const filter = svg('filter', { id, x: '-35%', y: '-35%', width: '170%', height: '170%', 'color-interpolation-filters': 'sRGB' });
  const blur = svg('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: o.blur, result: 'src' });
  // x:0,y:0 are required — without them the feImage subregion defaults to the
  // filter region origin (-35%,-35%), shifting the maps off the element box.
  const dispImg = svg('feImage', { x: 0, y: 0, result: 'dmap', preserveAspectRatio: 'none' });
  let chromatic = Math.max(0, Number(o.chromatic) || 0);
  const displacementNodes = chromatic > 0
    ? chromaticDisplacementNodes('src', 'dmap')
    : [svg('feDisplacementMap', { in: 'src', in2: 'dmap', scale: 0, xChannelSelector: 'R', yChannelSelector: 'G', result: 'displaced', 'data-lg-channel': 'base' })];
  const sat = svg('feColorMatrix', { in: 'displaced', type: 'saturate', values: o.saturation, result: 'sat' });
  const shadeImg = svg('feImage', { x: 0, y: 0, result: 'shade', preserveAspectRatio: 'none' });
  const specImg = svg('feImage', { x: 0, y: 0, result: 'smap', preserveAspectRatio: 'none' });
  const funcA = svg('feFuncA', { type: 'linear', slope: o.specular });
  filter.append(
    blur, dispImg, ...displacementNodes,
    shadeImg,
    svg('feBlend', { in: 'shade', in2: 'displaced', mode: 'normal', result: 'shaded' }),
    sat, specImg,
    svg('feComposite', { in: 'sat', in2: 'smap', operator: 'in', result: 'spec_sat' }),
    svg('feComponentTransfer', { in: 'smap', result: 'spec_faded' }, [funcA]),
    svg('feBlend', { in: 'spec_sat', in2: 'shaded', mode: 'normal', result: 'withSat' }),
    svg('feBlend', { in: 'spec_faded', in2: 'withSat', mode: 'normal' }),
  );
  defs().appendChild(filter);

  let field = null, w = 0, h = 0, curBezel = 0, lastGeo = null, disposed = false;

  const rebuildShade = () => {
    if (!lastGeo) return;
    shadeImg.setAttribute('href', innerShadeURL(lastGeo, o));
    shadeImg.setAttribute('width', lastGeo.width);
    shadeImg.setAttribute('height', lastGeo.height);
  };

  const rebuild = () => {
    if (disposed) return;
    // offsetWidth/Height give the *untransformed* border box — the coordinate
    // space backdrop-filter operates in. getBoundingClientRect() would report
    // the transform-scaled size (e.g. a squashed lens at scaleY(0.8)), which
    // misaligns the displacement map with the actual shape.
    const nw = el.offsetWidth, nh = el.offsetHeight;
    if (nw <= 0 || nh <= 0) return;
    const radius = resolveRadius(el, o.radius, nw, nh);
    const requestedInset = o.refractionInset === 'radius' ? radius : o.refractionInset;
    const nextInset = Math.min(requestedInset, Math.min(nw, nh) / 2);
    if (nw === w && nh === h && nextInset === curBezel && field) { applyScale(); return; }
    w = nw; h = nh;
    const refractionInset = nextInset;
    curBezel = refractionInset;
    field = buildField(o.surface, refractionInset, o.thickness);
    const geo = { width: w, height: h, radius, bezel: refractionInset };
    dispImg.setAttribute('href', displacementURL(field, geo));
    dispImg.setAttribute('width', w); dispImg.setAttribute('height', h);
    specImg.setAttribute('href', specularURL(geo, o.light));
    specImg.setAttribute('width', w); specImg.setAttribute('height', h);
    lastGeo = geo;
    rebuildShade();
    applyScale();
  };
  // Refraction is the displacement strength in px (feDisplacementMap `scale`).
  // Refraction inset is the absolute px width of the shape edge region used to
  // generate the displacement map. Changing it rebuilds the map geometry.
  const applyScale = () => {
    if (!field) return;
    const refraction = o.refraction != null ? o.refraction : 3.2 * Math.max(curBezel, 1);
    setDisplacementScales(displacementNodes, refraction, chromatic);
  };

  if (supportsBackdropUrl()) {
    el.style.backdropFilter = `url(#${id})`;
    el.style.webkitBackdropFilter = `url(#${id})`;
  } else {
    el.style.backdropFilter = `blur(${o.fallbackBlur}px)`;
    el.style.webkitBackdropFilter = `blur(${o.fallbackBlur}px)`;
  }

  const ro = new ResizeObserver(rebuild);
  ro.observe(el);
  rebuild();

  return {
    el,
    set refractionInset(v) { o.refractionInset = v; rebuild(); },
    get refractionInset() { return curBezel || o.refractionInset; },
    set refraction(v) { o.refraction = v; applyScale(); },
    get refraction() { return o.refraction != null ? o.refraction : 3.2 * Math.max(curBezel, 1); },
    set chromatic(v) { chromatic = Math.max(0, Number(v) || 0); o.chromatic = chromatic; applyScale(); },
    get chromatic() { return chromatic; },
    set saturation(v) { o.saturation = v; sat.setAttribute('values', String(v)); },
    set specular(v) { o.specular = v; funcA.setAttribute('slope', String(v)); },
    set blur(v) { o.blur = v; blur.setAttribute('stdDeviation', String(v)); },
    set innerShadow(v) { o.innerShadow = v; rebuildShade(); },
    set innerShadowSize(v) { o.innerShadowSize = v; rebuildShade(); },
    set innerGlow(v) { o.innerGlow = v; rebuildShade(); },
    set innerGlowSize(v) { o.innerGlowSize = v; rebuildShade(); },
    set innerShadowAngle(v) { o.innerShadowAngle = v; rebuildShade(); },
    rebuild,
    dispose() {
      if (disposed) return;
      disposed = true; ro.disconnect(); filter.remove();
      el.style.backdropFilter = ''; el.style.webkitBackdropFilter = '';
    },
  };
}
