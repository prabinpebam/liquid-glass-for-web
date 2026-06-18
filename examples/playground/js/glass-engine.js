/**
 * Liquid Glass — self-contained runtime engine (clean-room).
 *
 * Mirrors the documented kube.io technique so the playground renders a real,
 * playable effect without a build step:
 *   surface profile -> displacement field -> displacement + specular maps
 *   -> SVG <filter> (feImage / feDisplacementMap / feColorMatrix / feBlend)
 *   -> backdrop-filter | filter.
 *
 * This is the example-runtime twin of @liquid-glass/core. See
 * ../../../docs/architecture.md and ../../../PROJECT-PLAN.md (Phase 6).
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK = 'http://www.w3.org/1999/xlink';

let _uid = 0;
const nextId = () => `lg-${(_uid++).toString(36)}`;

/* ----------------------------------------------------------------------------
 * Surface profiles (normalized x,h in 0..1). From the article.
 * ------------------------------------------------------------------------- */
const smootherstep = (x) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * t * (t * (t * 6 - 15) + 10);
};
const convexCircle = (x) => Math.sqrt(Math.max(0, 1 - (1 - x) * (1 - x)));
const convexSquircle = (x) => Math.pow(Math.max(0, 1 - Math.pow(1 - x, 4)), 0.25);
const concave = (x) => 1 - convexCircle(x);

export const SURFACES = {
  'convex-circle': convexCircle,
  'convex-squircle': convexSquircle,
  concave,
  lip: (x) => {
    const a = convexSquircle(x);
    const b = concave(x);
    return a * (1 - smootherstep(x)) + b * smootherstep(x);
  },
  flat: (x) => x,
};

export const SURFACE_LABELS = {
  'convex-circle': 'Convex circle',
  'convex-squircle': 'Convex squircle',
  concave: 'Concave',
  lip: 'Lip',
  flat: 'Flat',
};

/* ----------------------------------------------------------------------------
 * Displacement field along one radius (half-slice), via Snell refraction.
 * ------------------------------------------------------------------------- */
function buildField(surfaceFn, indexRatio, samples = 128) {
  const slope = new Float64Array(samples);
  const mag = new Float64Array(samples);
  let max = 0;
  const eps = 1 / samples;
  for (let i = 0; i < samples; i++) {
    const x = i / (samples - 1);
    const h1 = surfaceFn(Math.max(0, x - eps));
    const h2 = surfaceFn(Math.min(1, x + eps));
    const s = (h2 - h1) / (2 * eps); // dh/dx
    slope[i] = s;
    const incidence = Math.atan(s); // normal tilt from vertical
    const sinR = Math.sin(incidence) / indexRatio;
    let deviation = 0;
    if (Math.abs(sinR) <= 1) {
      const refr = Math.asin(sinR);
      deviation = Math.tan(incidence - refr);
    }
    mag[i] = deviation;
    if (Math.abs(deviation) > max) max = Math.abs(deviation);
  }
  return { mag, max: max || 1, samples };
}

/* ----------------------------------------------------------------------------
 * Rounded-rect signed distance + inward normal.
 * ------------------------------------------------------------------------- */
function rrEdge(x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  const px = x - w / 2;
  const py = y - h / 2;
  const qx = Math.abs(px) - (w / 2 - rad);
  const qy = Math.abs(py) - (h / 2 - rad);
  const ax = Math.max(qx, 0);
  const ay = Math.max(qy, 0);
  const outside = Math.hypot(ax, ay);
  const inside = Math.min(Math.max(qx, qy), 0);
  const sdf = outside + inside - rad; // <0 inside
  const dist = -sdf; // >0 inside, 0 on border

  // inward normal = -gradient of sdf
  let nx;
  let ny;
  if (qx > 0 && qy > 0) {
    // rounded corner: gradient points along (ax,ay)
    const len = Math.hypot(ax, ay) || 1;
    nx = -(Math.sign(px) * ax) / len;
    ny = -(Math.sign(py) * ay) / len;
  } else if (qx > qy) {
    nx = -Math.sign(px);
    ny = 0;
  } else {
    nx = 0;
    ny = -Math.sign(py);
  }
  return { dist, nx, ny };
}

function sampleField(field, t) {
  const f = Math.min(1, Math.max(0, t)) * (field.samples - 1);
  const i0 = Math.floor(f);
  const i1 = Math.min(field.samples - 1, i0 + 1);
  const frac = f - i0;
  return field.mag[i0] + (field.mag[i1] - field.mag[i0]) * frac;
}

/* ----------------------------------------------------------------------------
 * Raster maps.
 * ------------------------------------------------------------------------- */
function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

/**
 * Convert a canvas to a Blob object URL. Chrome's `backdrop-filter` reliably
 * loads `feImage` from real resource URLs (http/blob) but silently fails on
 * `data:` URLs, so we must not use canvas.toDataURL() here.
 */
function canvasToObjectUrl(canvas) {
  const dataUrl = canvas.toDataURL('image/png');
  const bin = atob(dataUrl.slice(dataUrl.indexOf(',') + 1));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: 'image/png' }));
}

function buildDisplacementMap(field, geo) {
  const { width, height, radius, bezel } = geo;
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(canvas.width, canvas.height);
  const data = img.data;
  const safeMax = field.max;

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      const e = rrEdge(x + 0.5, y + 0.5, canvas.width, canvas.height, radius);
      let r = 128;
      let g = 128;
      if (e.dist >= 0 && e.dist <= bezel && bezel > 0) {
        const t = e.dist / bezel; // 0 outer edge -> 1 inner
        const m = sampleField(field, t) / safeMax; // -1..1 normalized
        // direction: refract toward the centre (inward normal)
        const vx = m * e.nx;
        const vy = m * e.ny;
        r = 128 + 127 * vx;
        g = 128 + 127 * vy;
      }
      data[i] = clamp255(r);
      data[i + 1] = clamp255(g);
      data[i + 2] = 128;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return { url: canvasToObjectUrl(canvas), max: safeMax };
}

function buildSpecularMap(field, geo, light) {
  const { width, height, radius, bezel } = geo;
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(canvas.width, canvas.height);
  const data = img.data;
  const lx = Math.cos(light);
  const ly = Math.sin(light);

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      const e = rrEdge(x + 0.5, y + 0.5, canvas.width, canvas.height, radius);
      let a = 0;
      if (e.dist >= 0 && e.dist <= bezel && bezel > 0) {
        const t = e.dist / bezel;
        // rim falloff: brightest at the outer edge, fading inward
        const rim = Math.pow(1 - t, 2);
        // modulate by alignment of the outward normal with the light dir
        const ndotl = -(e.nx * lx + e.ny * ly); // outward normal vs light
        const lit = Math.max(0, ndotl);
        a = rim * lit;
      }
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = clamp255(a * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  return { url: canvasToObjectUrl(canvas) };
}

const clamp255 = (v) => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v));

/* ----------------------------------------------------------------------------
 * SVG filter graph (kube.io chain + optional chromatic aberration).
 * ------------------------------------------------------------------------- */
function svg(name, attrs, kids = []) {
  const el = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'href') el.setAttributeNS(XLINK, 'href', v);
    else el.setAttribute(k, String(v));
  }
  for (const kid of kids) el.appendChild(kid);
  return el;
}

function buildFilterEl(id, geo, disp, spec, o) {
  const { width: w, height: h } = geo;
  const f = svg('filter', {
    id,
    x: '-20%',
    y: '-20%',
    width: '140%',
    height: '140%',
    'color-interpolation-filters': 'sRGB',
  });

  // pre-blur the backdrop a touch
  f.appendChild(
    svg('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: o.blur, result: 'src' }),
  );

  f.appendChild(
    svg('feImage', {
      href: disp.url,
      x: 0,
      y: 0,
      width: w,
      height: h,
      preserveAspectRatio: 'none',
      result: 'dispMap',
    }),
  );

  const baseScale = 2 * o.scale * Math.max(geo.bezel, 1);
  const ca = o.chromatic; // 0..1

  if (ca > 0) {
    // per-channel displacement at slightly different scales -> RGB fringe
    const ch = (chSel, scale, color, result) => {
      f.appendChild(
        svg('feDisplacementMap', {
          in: 'src',
          in2: 'dispMap',
          scale,
          xChannelSelector: 'R',
          yChannelSelector: 'G',
          result: `${result}_d`,
        }),
      );
      f.appendChild(
        svg('feColorMatrix', { in: `${result}_d`, type: 'matrix', values: color, result }),
      );
    };
    const spread = baseScale * 0.06 * ca;
    ch('R', baseScale + spread, '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0', 'rch');
    ch('G', baseScale, '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0', 'gch');
    ch('B', baseScale - spread, '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0', 'bch');
    f.appendChild(svg('feBlend', { in: 'rch', in2: 'gch', mode: 'screen', result: 'rg' }));
    f.appendChild(svg('feBlend', { in: 'rg', in2: 'bch', mode: 'screen', result: 'displaced' }));
  } else {
    f.appendChild(
      svg('feDisplacementMap', {
        in: 'src',
        in2: 'dispMap',
        scale: baseScale,
        xChannelSelector: 'R',
        yChannelSelector: 'G',
        result: 'displaced',
      }),
    );
  }

  f.appendChild(
    svg('feColorMatrix', {
      in: 'displaced',
      type: 'saturate',
      values: o.saturation,
      result: 'displaced_saturated',
    }),
  );

  let last = 'displaced_saturated';
  if (spec && o.specular > 0) {
    f.appendChild(
      svg('feImage', {
        href: spec.url,
        x: 0,
        y: 0,
        width: w,
        height: h,
        preserveAspectRatio: 'none',
        result: 'specular_layer',
      }),
    );
    f.appendChild(
      svg(
        'feComponentTransfer',
        { in: 'specular_layer', result: 'specular_faded' },
        [svg('feFuncA', { type: 'linear', slope: o.specular })],
      ),
    );
    f.appendChild(
      svg('feBlend', { in: 'specular_faded', in2: last, mode: 'screen', result: 'lit' }),
    );
    last = 'lit';
  }

  f.appendChild(svg('feMerge', {}, [svg('feMergeNode', { in: last })]));
  return f;
}

/* ----------------------------------------------------------------------------
 * Shared <defs> host (ref-counted).
 * ------------------------------------------------------------------------- */
let _host = null;
let _refs = 0;
function acquireDefs() {
  if (!_host) {
    const s = svg('svg', { 'aria-hidden': 'true' });
    s.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
    s.appendChild(svg('defs', {}));
    document.body.appendChild(s);
    _host = s;
  }
  _refs++;
  return _host.querySelector('defs');
}
function releaseDefs() {
  _refs = Math.max(0, _refs - 1);
  if (_refs === 0 && _host) {
    _host.remove();
    _host = null;
  }
}

function supportsBackdropUrl() {
  return (
    typeof CSS !== 'undefined' &&
    CSS.supports &&
    (CSS.supports('backdrop-filter', 'url(#x)') ||
      CSS.supports('-webkit-backdrop-filter', 'url(#x)'))
  );
}

const DEFAULTS = {
  radius: 28,
  bezel: 18,
  thickness: 1.5, // refractive index
  surface: 'convex-squircle',
  scale: 1,
  blur: 1,
  saturation: 1.6,
  specular: 0.5,
  light: -Math.PI / 4,
  chromatic: 0,
  mode: 'backdrop', // 'backdrop' | 'filter'
};

/**
 * Apply liquid glass to `el`. Returns { update, dispose }.
 */
export function liquidGlass(el, options = {}) {
  const defs = acquireDefs();
  const id = nextId();
  let o = { ...DEFAULTS, ...options };
  let filterEl = null;
  let mapUrls = [];
  let disposed = false;

  function geometry() {
    const r = el.getBoundingClientRect();
    return {
      width: Math.max(1, Math.round(r.width)),
      height: Math.max(1, Math.round(r.height)),
      radius: o.radius,
      bezel: o.bezel,
    };
  }

  function applyCss() {
    const ref = `url(#${id})`;
    if (o.mode === 'backdrop' && supportsBackdropUrl()) {
      el.style.backdropFilter = ref;
      el.style.webkitBackdropFilter = ref;
      el.style.filter = '';
    } else {
      el.style.filter = ref;
    }
  }

  function rebuild() {
    if (disposed) return;
    const geo = geometry();
    const surfaceFn = SURFACES[o.surface] || SURFACES['convex-squircle'];
    const field = buildField(surfaceFn, o.thickness);
    const disp = buildDisplacementMap(field, geo);
    const spec = o.specular > 0 ? buildSpecularMap(field, geo, o.light) : null;
    const next = buildFilterEl(id, geo, disp, spec, o);
    if (filterEl) filterEl.replaceWith(next);
    else defs.appendChild(next);
    filterEl = next;
    // Revoke the previous frame's object URLs now that the old filter is gone.
    for (const u of mapUrls) URL.revokeObjectURL(u);
    mapUrls = [disp.url, spec && spec.url].filter(Boolean);
    applyCss();
  }

  const ro = new ResizeObserver(() => rebuild());
  ro.observe(el);
  rebuild();

  return {
    el,
    get options() {
      return { ...o };
    },
    update(partial) {
      if (disposed) return;
      o = { ...o, ...partial };
      rebuild();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      ro.disconnect();
      filterEl?.remove();
      for (const u of mapUrls) URL.revokeObjectURL(u);
      mapUrls = [];
      el.style.backdropFilter = '';
      el.style.webkitBackdropFilter = '';
      el.style.filter = '';
      releaseDefs();
    },
  };
}
