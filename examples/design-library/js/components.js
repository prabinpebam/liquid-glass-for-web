/* ============================================================================
   components.js — REAL liquid-glass components for the docs gallery.

   These are not flat mocks: every control attaches the procedural glass engine
   (glass.js) so it genuinely refracts the patterned backdrop behind it, and
   animates between states with the shared spring families + activation model
   ported faithfully from the kube switch / slider / lens demos
   (examples/playground/js/app.js). Icons use Font Awesome.

   Each builder returns a DOM node and self-wires on construction; the engine's
   ResizeObserver builds the filter once the node is mounted and measurable.
   MOUNTS maps an inventory demo key → builder, consumed by docs.js.
   ========================================================================== */
import { attachGlass as attachGlassEngine, Spring, spring, clamp01, lerp } from './glass.js';

/* --- tiny DOM + icon helpers --------------------------------------------- */
function h(tag, attrs = {}, kids = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (k === 'style') n.style.cssText = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) n.setAttribute(k, v);
  }
  for (const kid of [].concat(kids)) if (kid != null) n.append(kid);
  return n;
}
/** Font Awesome glyph element. `name` e.g. 'magnifying-glass', 'plus'. */
export function fa(name, { style = 'solid', cls = '' } = {}) {
  return h('i', { class: `fa-${style} fa-${name} ${cls}`.trim(), 'aria-hidden': 'true' });
}

/* --- colour mixing (track gray → green etc.) ----------------------------- */
function parseHex(hex) {
  const s = hex.replace('#', '');
  const n = parseInt(s.length === 6 ? s + 'ff' : s, 16);
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, (n & 255) / 255];
}
function mixColor(a, b) {
  const ca = parseHex(a), cb = parseHex(b);
  return (t) => `rgba(${Math.round(lerp(ca[0], cb[0], t))}, ${Math.round(lerp(ca[1], cb[1], t))}, ${Math.round(lerp(ca[2], cb[2], t))}, ${lerp(ca[3], cb[3], t).toFixed(3)})`;
}

/* --- Liquid Glass material catalog ---------------------------------------
   Every glass surface in this design-library demo chooses one of these named
   materials. Component call sites may pass shape/size geometry only; optical
   parameters (blur, refraction inset, refraction, saturation, specular) live here. */
const GLASS_MATERIALS = {
  clear: { name: 'Clear', tone: 'Very transparent', cls: 'clear', blur: 0.2, refractionInset: 10, refraction: 80, saturation: 5, specular: 1, tint: 'rgba(255, 255, 255, 0.045)' },
  optic: { name: 'Optic', tone: 'Transparent, higher bend', cls: 'clear-strong', blur: 0.4, refractionInset: 16, refraction: 80, saturation: 5, specular: 1, tint: 'rgba(255, 255, 255, 0.065)' },
  softFrost: { name: 'Soft Frost', tone: 'Slightly frosted', cls: 'soft', blur: 2.4, refractionInset: 14, refraction: 80, saturation: 5, specular: 1, tint: 'rgba(255, 255, 255, 0.13)' },
  satin: { name: 'Satin', tone: 'Balanced frost', cls: 'satin', blur: 4.8, refractionInset: 18, refraction: 80, saturation: 5, specular: 1, tint: 'rgba(255, 255, 255, 0.18)' },
  deepFrost: { name: 'Deep Frost', tone: 'More frosted', cls: 'deep', blur: 8.5, refractionInset: 22, refraction: 80, saturation: 5, specular: 1, tint: 'rgba(255, 255, 255, 0.24)' },
  milk: { name: 'Milk Glass', tone: 'Most frosted', cls: 'milk', blur: 12, refractionInset: 26, refraction: 80, saturation: 5, specular: 1, tint: 'rgba(255, 255, 255, 0.31)' },
};
const MATERIAL_NAMES = Object.keys(GLASS_MATERIALS);
const material = (name = 'satin') => GLASS_MATERIALS[name] || GLASS_MATERIALS.satin;
const MATERIAL_HANDLES = new Set();
const GLASS_TINTS = {
  primary: 'rgba(77, 124, 255, 0.32)',
  primarySoft: 'rgba(77, 124, 255, 0.22)',
  success: 'rgba(55, 194, 74, 0.28)',
  danger: 'rgba(240, 69, 79, 0.28)',
};
const tint = (name) => (name ? GLASS_TINTS[name] || name : null);
function applyGlassTint(glass, tintName = null) {
  const value = tint(tintName);
  if (value) glass.el.dataset.glassTint = tintName;
  else delete glass.el.dataset.glassTint;
  const m = material(glass.el.dataset.glassMaterial);
  const fill = value || m.tint;
  glass.el.style.setProperty('--lgc-material-tint', fill);
  glass.el.style.background = fill;
  return glass;
}
function applyGlassMaterialValues(glass, m) {
  applyGlassTint(glass, glass.el.dataset.glassTint || null);
  glass.refraction = m.refraction;
  if (glass.el._lgcUseMaterialInset) glass.refractionInset = m.refractionInset;
  glass.blur = m.blur;
  return glass;
}
function applyGlassMaterial(glass, materialName = 'satin') {
  const m = material(materialName);
  glass.el.dataset.glassMaterial = materialName;
  return applyGlassMaterialValues(glass, m);
}
function updateGlassMaterial(materialName, patch) {
  const m = material(materialName);
  Object.assign(m, patch);
  MATERIAL_HANDLES.forEach((glass) => {
    if (!glass.el.isConnected) { MATERIAL_HANDLES.delete(glass); return; }
    if (glass.el.dataset.glassMaterial === materialName) applyGlassMaterialValues(glass, m);
  });
}
function attachGlass(el, shape = {}) {
  const materialName = shape.material ?? 'satin';
  const m = material(materialName);
  const refractionInset = shape.refractionInset ?? 'radius';
  el.dataset.glassMaterial = materialName;
  el._lgcUseMaterialInset = shape.refractionInset != null;
  const fill = tint(shape.tint) || m.tint;
  if (shape.tint) el.dataset.glassTint = shape.tint;
  el.style.setProperty('--lgc-material-tint', fill);
  el.style.background = fill;
  const glass = attachGlassEngine(el, {
    surface: shape.surface ?? 'convex',
    radius: shape.radius ?? 'pill',
    refractionInset,
    refraction: m.refraction,
    saturation: m.saturation,
    specular: m.specular,
    blur: m.blur,
  });
  MATERIAL_HANDLES.add(glass);
  const dispose = glass.dispose;
  glass.dispose = () => { MATERIAL_HANDLES.delete(glass); dispose(); };
  return glass;
}

/* ============================================================================
   Switch — faithful port of the kube switch state machine.
  Activation S = forced || grabbing drives: knob material, knob scale,
  track gray→green; tap toggles, drag
   slides with rubber-band overshoot, keyboard toggles.
   ========================================================================== */
export function glassSwitch({ on = true } = {}) {
  const track = h('span', { class: 'lgc-switch__track' });
  const knob = h('span', { class: 'lgc-switch__knob' });
  const el = h('button', {
    class: 'lgc-switch', type: 'button', role: 'switch',
    'aria-checked': String(on), 'aria-label': 'Toggle',
  }, [track, knob]);

  const glass = attachGlass(knob, { material: 'clear', surface: 'lip', radius: 'pill' });
  const trackColor = mixColor('#94949F77', '#3BBF4EEE'); // gray → green

  // kube proportions scaled 0.477612 (track height 32px) to match other controls;
  // active scale lifts the knob to 52px (the expanded state) and overhangs the track.
  const REST = 0.65, ACTIVE = 1.1845;
  const TRAVEL = 27.65, MARGIN = -10.48; // 57.9*0.477612 ; -21.95*0.477612
  const B = spring('glide', on ? 1 : 0);  // position 0..1   {1000,80}
  const A = spring('snap', on ? ACTIVE : REST); // knob scale  {2000,80}
  const T = spring('glide', on ? 1 : 0);  // track colour     {1000,80}
  const Q = spring('settle', 0);          // material state    {170,26}

  let f = on ? 1 : 0, g = 0, h2 = f, forced = false, grabX = 0, moved = false;

  knob.style.marginLeft = `${MARGIN}px`;
  const renderKnob = () => {
    knob.style.transform = `translateY(-50%) translateX(${(B.get() * TRAVEL).toFixed(2)}px) scale(${A.get().toFixed(3)})`;
  };
  B.onChange(renderKnob); A.onChange(renderKnob);
  T.onChange((v) => (track.style.background = trackColor(v)));
  Q.onChange((v) => applyGlassMaterial(glass, v > 0.5 ? 'optic' : 'clear'));

  const S = () => (forced || g > 0.5 ? 1 : 0);
  const sync = () => {
    const s = S();
    B.set(g > 0.5 ? h2 : f);
    A.set(lerp(REST, ACTIVE, s));
    T.set(g > 0.5 ? (h2 > 0.5 ? 1 : 0) : f);
    applyGlassMaterial(glass, s > 0.5 ? 'optic' : 'clear');
    Q.set(s);
    el.setAttribute('aria-checked', String(f > 0.5));
  };

  el.addEventListener('pointerdown', (e) => { g = 1; grabX = e.clientX; moved = false; h2 = f; el.setPointerCapture(e.pointerId); sync(); });
  el.addEventListener('pointermove', (e) => {
    if (g < 0.5) return;
    const dx = e.clientX - grabX;
    if (Math.abs(dx) > 4) moved = true;
    const d = f + dx / TRAVEL;
    const over = d < 0 ? -d : d > 1 ? d - 1 : 0;
    h2 = clamp01(d) + (d < 0 ? -1 : 1) * (over / 22);
    sync();
  });
  const release = () => {
    if (g < 0.5) return; g = 0;
    if (moved) f = h2 > 0.5 ? 1 : 0; else f = f > 0.5 ? 0 : 1;
    sync();
  };
  el.addEventListener('pointerup', release);
  el.addEventListener('pointercancel', release);
  el.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); f = f > 0.5 ? 0 : 1; sync(); }
  });
  renderKnob(); sync();
  return el;
}

/* ============================================================================
  Slider — faithful port of the kube slider thumb. Grab switches the material
  and scales the thumb; drag from thumb or track.
   ========================================================================== */
export function glassSlider({ value = 0.4 } = {}) {
  const fill = h('span', { class: 'lgc-slider__fill' });
  const trackEl = h('span', { class: 'lgc-slider__track' }, [fill]);
  const thumb = h('span', { class: 'lgc-slider__thumb', tabindex: '0', role: 'slider', 'aria-valuemin': '0', 'aria-valuemax': '100' });
  const el = h('div', { class: 'lgc-slider' }, [trackEl, thumb]);

  const glass = attachGlass(thumb, { material: 'clear', surface: 'convex', radius: 'pill' });
  // kube proportions scaled 0.667 to fit the UI: 220x40 rig, 60x40 convex thumb
  // on a ~9px track, shrinking to 0.6 at rest (the original aspect ratio).
  const REST = 0.6, ACTIVE = 1;
  const A = spring('snap', REST);
  const Q = spring('settle', 0.4);

  let val = clamp01(value), n = 0, grabOffset = 0;
  A.onChange((v) => (thumb.style.transform = `translateX(-50%) scale(${v.toFixed(3)})`));
  Q.onChange((v) => applyGlassMaterial(glass, v > 0.5 ? 'optic' : 'clear'));

  const PAD = 18; // thumb centre clamps 18px from each track end (27*0.667)
  const layout = () => {
    const w = el.clientWidth;
    thumb.style.left = `${PAD + (w - PAD * 2) * val}px`;
    fill.style.width = `${val * 100}%`;
    thumb.setAttribute('aria-valuenow', Math.round(val * 100));
  };
  const setFromX = (clientX) => {
    const r = el.getBoundingClientRect();
    val = clamp01((clientX - (r.left + PAD)) / (r.width - PAD * 2));
    layout();
  };
  const S = () => (n > 0.5 ? 1 : 0);
  const sync = () => { const s = S(); A.set(lerp(REST, ACTIVE, s)); applyGlassMaterial(glass, s > 0.5 ? 'optic' : 'clear'); Q.set(s); thumb.classList.toggle('is-active', s > 0.5); };

  thumb.addEventListener('pointerdown', (e) => { n = 1; const tr = thumb.getBoundingClientRect(); grabOffset = e.clientX - (tr.left + tr.width / 2); thumb.setPointerCapture(e.pointerId); sync(); });
  trackEl.addEventListener('pointerdown', (e) => { n = 1; grabOffset = 0; sync(); setFromX(e.clientX); });
  window.addEventListener('pointermove', (e) => { if (n > 0.5) setFromX(e.clientX - grabOffset); });
  const release = () => { if (n < 0.5) return; n = 0; sync(); };
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);
  thumb.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? 0.1 : 0.04;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { val = clamp01(val + step); layout(); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { val = clamp01(val - step); layout(); }
  });
  new ResizeObserver(layout).observe(el);
  requestAnimationFrame(layout); sync();
  return el;
}

/* ============================================================================
  Precision Lens — the hallmark draggable refraction capsule with squash-and-
   stretch jiggle physics, floating over a busy backdrop it refracts.
   ========================================================================== */
export function glassLens() {
  const capsule = h('span', { class: 'lgc-lens__capsule', style: 'left:50%;top:50%;transform:translate(-50%,-50%)' });
  const stage = h('div', { class: 'lgc-lens' }, [capsule]);

  const glass = attachGlass(capsule, { material: 'optic', surface: 'convex', radius: 26 });

  const SR = spring('grab', 1);     // material state
  const S = spring('jelly', 0.8);   // base press
  const A = spring('jelly', 0.8);   // scaleY
  const T = spring('jelly', 1.0);   // scaleX
  const SA = spring('damp', 0.16);  // shadow alpha
  const all = [SR, S, A, T, SA];

  let grabbing = false, velX = 0, loop = 0;
  const render = () => {
    capsule.style.transform = `translate(-50%,-50%) scaleX(${T.get().toFixed(3)}) scaleY(${A.get().toFixed(3)})`;
    capsule.style.boxShadow = `0 ${(grabbing ? 16 : 6)}px 26px rgba(0,0,0,${SA.get().toFixed(3)})`;
    applyGlassMaterial(glass, SR.get() > 0.5 ? 'optic' : 'clear');
  };
  const tick = () => {
    const grab = grabbing ? 1 : 0;
    velX *= 0.8; if (Math.abs(velX) < 1) velX = 0;
    SR.set(grab ? 1 : 0);
    S.set(grab ? 1 : 0.8);
    A.set(S.get() * Math.max(0.7, 1 - Math.abs(velX) / 5000));
    T.set(S.get() + (1 - A.get()));
    SA.set(grab ? 0.22 : 0.16);
    render();
    loop = (grabbing || velX !== 0 || all.some((s) => s.active)) ? requestAnimationFrame(tick) : 0;
  };
  const startLoop = () => { if (!loop) loop = requestAnimationFrame(tick); };

  let dragging = false, ox = 0, oy = 0, lastX = 0, lastT = 0;
  capsule.addEventListener('pointerdown', (e) => {
    dragging = true; grabbing = true; capsule.setPointerCapture(e.pointerId);
    const r = capsule.getBoundingClientRect();
    ox = e.clientX - (r.left + r.width / 2); oy = e.clientY - (r.top + r.height / 2);
    lastX = e.clientX; lastT = performance.now(); velX = 0; startLoop();
  });
  capsule.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const s = stage.getBoundingClientRect();
    const x = clamp01((e.clientX - s.left - ox) / s.width) * 100;
    const y = clamp01((e.clientY - s.top - oy) / s.height) * 100;
    capsule.style.left = `${x}%`; capsule.style.top = `${y}%`;
    const now = performance.now(), dt = now - lastT;
    if (dt > 0) velX = ((e.clientX - lastX) / dt) * 1000;
    lastX = e.clientX; lastT = now; startLoop();
  });
  const release = () => { if (!dragging) return; dragging = false; grabbing = false; velX = 0; startLoop(); };
  capsule.addEventListener('pointerup', release);
  capsule.addEventListener('pointercancel', release);
  render();
  return stage;
}

/* ============================================================================
  Button — glass pill. Press = material activation + scale dip; optional leading
  Font Awesome icon.
   ========================================================================== */
export function glassButton({ label = 'Button', icon = null, variant = 'standard' } = {}) {
  const el = h('button', { class: `lgc-btn lgc-btn--${variant}`, type: 'button' },
    [icon ? fa(icon) : null, h('span', {}, label)]);

  const baseMaterial = variant === 'accent' ? 'optic' : 'clear';
  const glass = attachGlass(el, { material: baseMaterial, tint: variant === 'accent' ? 'primary' : null, surface: 'convex', radius: 'pill' });
  const Q = spring('settle', 0.4), A = spring('snap', 1);
  Q.onChange((v) => applyGlassMaterial(glass, v > 0.5 ? 'optic' : baseMaterial));
  A.onChange((v) => (el.style.transform = `scale(${v.toFixed(3)})`));
  const down = () => { applyGlassMaterial(glass, 'optic'); Q.set(1); A.set(0.96); el.classList.add('is-active'); };
  const up = () => { applyGlassMaterial(glass, baseMaterial); Q.set(0); A.set(1); el.classList.remove('is-active'); };
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointerleave', up);
  el.addEventListener('pointercancel', up);
  return el;
}

export function glassIconButton({ icon = 'plus', label = 'Action' } = {}) {
  const el = h('button', { class: 'lgc-iconbtn', type: 'button', 'aria-label': label }, [fa(icon)]);
  const glass = attachGlass(el, { material: 'clear', surface: 'convex', radius: 14 });
  const Q = spring('settle', 0.4), A = spring('snap', 1);
  Q.onChange((v) => applyGlassMaterial(glass, v > 0.5 ? 'optic' : 'clear'));
  A.onChange((v) => (el.style.transform = `scale(${v.toFixed(3)})`));
  el.addEventListener('pointerdown', () => { applyGlassMaterial(glass, 'optic'); Q.set(1); A.set(0.92); });
  const up = () => { applyGlassMaterial(glass, 'clear'); Q.set(0); A.set(1); };
  el.addEventListener('pointerup', up); el.addEventListener('pointerleave', up);
  return el;
}

export function glassFab({ icon = 'plus' } = {}) {
  const el = h('button', { class: 'lgc-fab', type: 'button', 'aria-label': 'Create' }, [fa(icon)]);
  const glass = attachGlass(el, { material: 'optic', tint: 'primary', surface: 'convex', radius: 'pill' });
  const A = spring('grab', 1);
  A.onChange((v) => (el.style.transform = `scale(${v.toFixed(3)})`));
  el.addEventListener('pointerdown', () => { applyGlassMaterial(glass, 'optic'); A.set(0.9); });
  const up = () => { applyGlassMaterial(glass, 'optic'); A.set(1); };
  el.addEventListener('pointerup', up); el.addEventListener('pointerleave', up);
  return el;
}

/* ============================================================================
   Segmented control — a single glass indicator that springs between options
   (snap) and boosts refraction while moving.
   ========================================================================== */
export function glassSegmented({ options = ['Day', 'Week', 'Month'], value = 0 } = {}) {
  const indicator = h('span', { class: 'lgc-seg__ind' });
  const segs = options.map((label, i) =>
    h('button', { class: 'lgc-seg__opt' + (i === value ? ' is-on' : ''), type: 'button', 'data-i': i }, label));
  const el = h('div', { class: 'lgc-seg', role: 'tablist' }, [indicator, ...segs]);

  const glass = attachGlass(indicator, { material: 'clear', surface: 'convex', radius: 'pill' });
  const X = spring('snap', value), W = spring('snap', 0), Q = spring('settle', 0.4);
  let cur = value, settleTimer = 0;

  const place = () => {
    const target = segs[cur];
    indicator.style.transform = `translateX(${X.get()}px)`;
    indicator.style.width = `${W.get()}px`;
    void target;
  };
  X.onChange(place); W.onChange(place);
  Q.onChange((v) => applyGlassMaterial(glass, v > 0.5 ? 'optic' : 'clear'));

  const moveTo = (i) => {
    cur = i;
    segs.forEach((s, k) => s.classList.toggle('is-on', k === i));
    const t = segs[i];
    X.set(t.offsetLeft); W.set(t.offsetWidth);
    applyGlassMaterial(glass, 'optic'); Q.set(1); clearTimeout(settleTimer); settleTimer = setTimeout(() => { applyGlassMaterial(glass, 'clear'); Q.set(0); }, 260);
  };
  segs.forEach((s, i) => s.addEventListener('click', () => moveTo(i)));
  const init = () => { const t = segs[cur]; X.jump(t.offsetLeft); W.jump(t.offsetWidth); place(); };
  new ResizeObserver(init).observe(el);
  requestAnimationFrame(init);
  return el;
}

/* ============================================================================
   Checkbox — glass tile; check pops in with a jelly spring on activation.
   ========================================================================== */
export function glassCheckbox({ checked = true } = {}) {
  const mark = fa('check', { cls: 'lgc-check__mark' });
  const box = h('span', { class: 'lgc-check__box' }, [mark]);
  const el = h('button', { class: 'lgc-check', type: 'button', role: 'checkbox', 'aria-checked': String(checked) }, [box]);
  const glass = attachGlass(box, { material: checked ? 'optic' : 'clear', tint: checked ? 'primary' : null, surface: 'convex', radius: 8 });
  const P = spring('jelly', checked ? 1 : 0), Q = spring('settle', checked ? 0.9 : 0.4);
  P.onChange((v) => { mark.style.transform = `scale(${clamp01(v).toFixed(3)})`; mark.style.opacity = clamp01(v).toFixed(3); });
  Q.onChange((v) => applyGlassMaterial(glass, v > 0.5 ? 'optic' : 'clear'));
  let on = checked;
  const set = (v) => { on = v; el.setAttribute('aria-checked', String(on)); el.classList.toggle('is-on', on); applyGlassTint(glass, on ? 'primary' : null); applyGlassMaterial(glass, on ? 'optic' : 'clear'); P.set(on ? 1 : 0); Q.set(on ? 1 : 0); };
  set(checked);
  el.addEventListener('click', () => set(!on));
  return el;
}

/* ============================================================================
   Radio — glass disc; inner dot springs in (grab) on selection.
   ========================================================================== */
export function glassRadio({ checked = true } = {}) {
  const dot = h('span', { class: 'lgc-radio__dot' });
  const disc = h('span', { class: 'lgc-radio__disc' }, [dot]);
  const el = h('button', { class: 'lgc-radio', type: 'button', role: 'radio', 'aria-checked': String(checked) }, [disc]);
  const glass = attachGlass(disc, { material: checked ? 'optic' : 'clear', tint: checked ? 'primary' : null, surface: 'convex', radius: 'pill' });
  const P = spring('grab', checked ? 1 : 0), Q = spring('settle', checked ? 0.9 : 0.4);
  P.onChange((v) => { dot.style.transform = `translate(-50%,-50%) scale(${clamp01(v).toFixed(3)})`; });
  Q.onChange((v) => applyGlassMaterial(glass, v > 0.5 ? 'optic' : 'clear'));
  let on = checked;
  const set = (v) => { on = v; el.setAttribute('aria-checked', String(on)); el.classList.toggle('is-on', on); applyGlassTint(glass, on ? 'primary' : null); applyGlassMaterial(glass, on ? 'optic' : 'clear'); P.set(on ? 1 : 0); Q.set(on ? 1 : 0); };
  set(checked);
  el.addEventListener('click', () => set(true));
  return el;
}

/* ============================================================================
   Search field — glass pill; focus boosts refraction (settle).
   ========================================================================== */
export function glassSearch() {
  const input = h('input', { type: 'search', placeholder: 'Search…', 'aria-label': 'Search', autocomplete: 'off' });
  const el = h('div', { class: 'lgc-search' }, [fa('magnifying-glass', { cls: 'lgc-search__i' }), input, h('kbd', { class: 'lgc-search__kbd' }, '/')]);
  const glass = attachGlass(el, { material: 'softFrost', surface: 'convex', radius: 'pill' });
  const Q = spring('settle', 0.4);
  Q.onChange((v) => applyGlassMaterial(glass, v > 0.5 ? 'satin' : 'softFrost'));
  input.addEventListener('focus', () => { applyGlassMaterial(glass, 'satin'); Q.set(1); el.classList.add('is-focus'); });
  input.addEventListener('blur', () => { applyGlassMaterial(glass, 'softFrost'); Q.set(0); el.classList.remove('is-focus'); });
  return el;
}

/* ============================================================================
   Chip — glass token; toggles active (refraction + tint).
   ========================================================================== */
export function glassChip({ label = 'Design', removable = true } = {}) {
  const el = h('button', { class: 'lgc-chip is-on', type: 'button' },
    [h('span', {}, label), removable ? fa('xmark', { cls: 'lgc-chip__x' }) : null]);
  const glass = attachGlass(el, { material: 'optic', tint: 'primarySoft', surface: 'convex', radius: 'pill' });
  const Q = spring('settle', 1);
  Q.onChange((v) => applyGlassMaterial(glass, v > 0.5 ? 'optic' : 'clear'));
  let on = true;
  el.addEventListener('click', () => { on = !on; el.classList.toggle('is-on', on); applyGlassTint(glass, on ? 'primarySoft' : null); applyGlassMaterial(glass, on ? 'optic' : 'clear'); Q.set(on ? 1 : 0); });
  return el;
}

/* ============================================================================
   Card — a glass surface panel that refracts the backdrop; hover lifts.
   ========================================================================== */
export function glassCard() {
  const el = h('article', { class: 'lgc-card' }, [
    h('div', { class: 'lgc-card__icon' }, [fa('layer-group')]),
    h('div', {}, [
      h('div', { class: 'lgc-card__t' }, 'Glass Card'),
      h('div', { class: 'lgc-card__d' }, 'A surface that refracts what is behind it.'),
    ]),
  ]);
  attachGlass(el, { material: 'satin', surface: 'convex', radius: 18 });
  return el;
}

/* ============================================================================
   Toast — glass notification slab with an icon.
   ========================================================================== */
export function glassToast() {
  const el = h('div', { class: 'lgc-toast', role: 'status' }, [
    h('span', { class: 'lgc-toast__dot' }, [fa('check')]),
    h('div', {}, [h('b', {}, 'Saved'), h('div', { class: 'lgc-toast__d' }, 'Your changes are live.')]),
  ]);
  attachGlass(el, { material: 'satin', surface: 'convex', radius: 14 });
  return el;
}

/* ============================================================================
  THE REST OF THE LIBRARY — every part below is built on the SAME glass
  construction as the hero lens: one `attachGlass()` surface per part (LG-P7),
  choosing from the shared material catalog above. Composite parts (modal,
  navbar, card-likes…) are a SINGLE glass surface holding flat content — never
  glass nested inside glass — exactly mirroring the lens.
   ========================================================================== */

/** Wrap content in one materialized glass surface. Only shape geometry varies. */
function glassPanel(cls, kids, opts = {}) {
  const el = h('div', { class: cls }, kids);
  attachGlass(el, { material: opts.material ?? 'satin', tint: opts.tint ?? null, surface: 'convex', radius: opts.radius ?? 18 });
  return el;
}

export function glassMaterialLab() {
  const materials = MATERIAL_NAMES.map((name) => material(name));

  const cards = materials.map((mat) => {
    const materialName = MATERIAL_NAMES.find((name) => material(name) === mat);
    const sample = h('div', { class: `lgc-mat__sample lgc-mat__sample--${mat.cls}` }, [
      h('div', { class: 'lgc-mat__label' }, [h('b', {}, mat.name), h('span', {}, mat.tone)]),
    ]);
    const glass = attachGlass(sample, {
      material: materialName, surface: 'convex', radius: 22, refractionInset: mat.refractionInset,
    });

    const insetValue = h('span', { class: 'lgc-mat__value' }, `${mat.refractionInset}px`);
    const refValue = h('span', { class: 'lgc-mat__value' }, String(mat.refraction));
    const inset = h('input', { class: 'lgc-mat__range', type: 'range', min: '4', max: '36', step: '1', value: String(mat.refractionInset), 'aria-label': `${mat.name} refraction inset in pixels` });
    const ref = h('input', { class: 'lgc-mat__range', type: 'range', min: '8', max: '120', step: '1', value: String(mat.refraction), 'aria-label': `${mat.name} refraction` });
    inset.addEventListener('input', () => { const v = Number(inset.value); glass.refractionInset = v; insetValue.textContent = `${v}px`; });
    ref.addEventListener('input', () => { const v = Number(ref.value); updateGlassMaterial(materialName, { refraction: v }); refValue.textContent = String(v); });

    return h('article', { class: 'lgc-mat' }, [
      sample,
      h('div', { class: 'lgc-mat__controls' }, [
        h('label', { class: 'lgc-mat__control' }, [h('span', {}, ['Refraction inset', insetValue]), inset]),
        h('label', { class: 'lgc-mat__control' }, [h('span', {}, ['Refraction', refValue]), ref]),
      ]),
    ]);
  });

  return h('div', { class: 'lgc-matlab' }, cards);
}

/* --- Elements: text entry ------------------------------------------------ */
export function glassInput({ value = '', placeholder = 'Jane Appleseed', icon = null } = {}) {
  const input = h('input', { type: 'text', value, placeholder, 'aria-label': placeholder, autocomplete: 'off' });
  const el = h('label', { class: 'lgc-field' }, [icon ? fa(icon, { cls: 'lgc-field__i' }) : null, input]);
  const glass = attachGlass(el, { material: 'softFrost', surface: 'convex', radius: 12 });
  const Q = spring('settle', 0); Q.onChange((v) => applyGlassMaterial(glass, v > 0.5 ? 'satin' : 'softFrost'));
  input.addEventListener('focus', () => { applyGlassMaterial(glass, 'satin'); Q.set(1); el.classList.add('is-focus'); });
  input.addEventListener('blur', () => { applyGlassMaterial(glass, 'softFrost'); Q.set(0); el.classList.remove('is-focus'); });
  return el;
}

export function glassTextarea({ value = '', placeholder = 'Write a message…' } = {}) {
  const ta = h('textarea', { rows: '3', placeholder, 'aria-label': placeholder }, value);
  const el = h('div', { class: 'lgc-field lgc-field--area' }, [ta]);
  const glass = attachGlass(el, { material: 'softFrost', surface: 'convex', radius: 14 });
  const Q = spring('settle', 0); Q.onChange((v) => applyGlassMaterial(glass, v > 0.5 ? 'satin' : 'softFrost'));
  ta.addEventListener('focus', () => { applyGlassMaterial(glass, 'satin'); Q.set(1); el.classList.add('is-focus'); });
  ta.addEventListener('blur', () => { applyGlassMaterial(glass, 'softFrost'); Q.set(0); el.classList.remove('is-focus'); });
  return el;
}

export function glassOtp({ length = 4, filled = 2 } = {}) {
  const el = h('div', { class: 'lgc-otp' });
  for (let i = 0; i < length; i++) {
    const cell = h('div', { class: 'lgc-otp__cell' + (i === filled ? ' is-active' : '') }, i < filled ? String(i + 5) : '');
    attachGlass(cell, { material: i === filled ? 'optic' : 'clear', surface: 'convex', radius: 10 });
    el.append(cell);
  }
  return el;
}

/* --- Components: navigation ---------------------------------------------- */
export function glassTabs({ options = ['Overview', 'Specs', 'Usage'], value = 0 } = {}) {
  const indicator = h('span', { class: 'lgc-tabs__ind' });
  const tabs = options.map((label, i) => h('button', { class: 'lgc-tabs__t' + (i === value ? ' is-on' : ''), type: 'button' }, label));
  const el = h('div', { class: 'lgc-tabs', role: 'tablist' }, [indicator, ...tabs]);
  const glass = attachGlass(indicator, { material: 'clear', surface: 'convex', radius: 10 });
  const X = spring('snap', value), W = spring('snap', 0), Q = spring('settle', 0.4);
  let cur = value, timer = 0;
  const place = () => { indicator.style.transform = `translateX(${X.get()}px)`; indicator.style.width = `${W.get()}px`; };
  X.onChange(place); W.onChange(place); Q.onChange((v) => applyGlassMaterial(glass, v > 0.5 ? 'optic' : 'clear'));
  const moveTo = (i) => { cur = i; tabs.forEach((s, k) => s.classList.toggle('is-on', k === i)); const n = tabs[i]; X.set(n.offsetLeft); W.set(n.offsetWidth); applyGlassMaterial(glass, 'optic'); Q.set(1); clearTimeout(timer); timer = setTimeout(() => { applyGlassMaterial(glass, 'clear'); Q.set(0); }, 260); };
  tabs.forEach((s, i) => s.addEventListener('click', () => moveTo(i)));
  const init = () => { const n = tabs[cur]; X.jump(n.offsetLeft); W.jump(n.offsetWidth); place(); };
  new ResizeObserver(init).observe(el); requestAnimationFrame(init);
  return el;
}

export function glassMenu({ items = ['Duplicate', 'Rename', 'Move to…', 'Delete'], active = 0 } = {}) {
  const rows = items.map((label, i) => h('div', { class: 'lgc-menu__i' + (i === active ? ' is-on' : '') }, label));
  rows.forEach((r, i) => r.addEventListener('click', () => rows.forEach((x, k) => x.classList.toggle('is-on', k === i))));
  return glassPanel('lgc-menu', rows, { material: 'satin', radius: 14 });
}

export function glassPagination({ pages = ['1', '2', '3', '…', '9'], current = 1 } = {}) {
  const el = h('div', { class: 'lgc-pager' });
  const btns = pages.map((p, i) => {
    const b = h('button', { class: 'lgc-pager__b' + (i === current ? ' is-on' : '') + (p === '…' ? ' is-gap' : ''), type: 'button' }, p);
    if (p !== '…') b._glass = attachGlass(b, { material: i === current ? 'optic' : 'clear', tint: i === current ? 'primarySoft' : null, surface: 'convex', radius: 10 });
    el.append(b); return b;
  });
  btns.forEach((b, i) => {
    if (pages[i] !== '…') b.addEventListener('click', () => btns.forEach((x, k) => {
      const selected = k === i && pages[k] !== '…';
      x.classList.toggle('is-on', selected);
      if (x._glass) { applyGlassTint(x._glass, selected ? 'primarySoft' : null); applyGlassMaterial(x._glass, selected ? 'optic' : 'clear'); }
    }));
  });
  return el;
}

/* --- Components: disclosure & feedback ----------------------------------- */
export function glassTooltip({ text = 'Copied to clipboard' } = {}) {
  return glassPanel('lgc-tooltip', [h('span', {}, text)], { material: 'softFrost', radius: 10 });
}

export function glassAccordion({ items = [['Getting started', true], ['Theming', false], ['Motion', false]] } = {}) {
  const rows = items.map(([title, open]) => {
    const ico = fa(open ? 'minus' : 'plus', { cls: 'lgc-acc__i' });
    const head = h('button', { class: 'lgc-acc__h', type: 'button' }, [h('span', {}, title), ico]);
    const body = h('div', { class: 'lgc-acc__b' }, [h('p', {}, 'Inline content for this section lives here, revealed on expand.')]);
    const row = h('div', { class: 'lgc-acc__row' + (open ? ' is-open' : '') }, [head, body]);
    head.addEventListener('click', () => { const isOpen = row.classList.toggle('is-open'); ico.className = `fa-solid fa-${isOpen ? 'minus' : 'plus'} lgc-acc__i`; });
    return row;
  });
  return glassPanel('lgc-acc', rows, { material: 'satin', radius: 14 });
}

/* --- Components: data display -------------------------------------------- */
export function glassStat({ label = 'Revenue', value = '$48.2k', delta = '12.4%' } = {}) {
  return glassPanel('lgc-stat', [
    h('div', { class: 'lgc-stat__l' }, label),
    h('div', { class: 'lgc-stat__n' }, value),
    h('div', { class: 'lgc-stat__d' }, [fa('arrow-trend-up'), h('span', {}, delta)]),
  ], { material: 'satin', radius: 16 });
}

export function glassList({ items = [['inbox', 'Inbox', '24'], ['file-lines', 'Drafts', '3'], ['paper-plane', 'Sent', '']] } = {}) {
  const rows = items.map(([icon, label, n]) => h('div', { class: 'lgc-list__i' }, [
    h('span', { class: 'lgc-list__ic' }, [fa(icon)]),
    h('span', { class: 'lgc-list__t' }, label),
    n ? h('span', { class: 'lgc-list__n' }, n) : null,
  ]));
  return glassPanel('lgc-list', rows, { material: 'satin', radius: 14 });
}

export function glassTable({ head = ['Name', 'Role', 'Status'], rows = [['Jane A.', 'Owner', 'Active'], ['Milo K.', 'Editor', 'Active'], ['Sora P.', 'Viewer', 'Away']] } = {}) {
  const mkRow = (cells, cls = '') => h('div', { class: 'lgc-tbl__r' + cls }, cells.map((c) => h('span', {}, c)));
  const body = [mkRow(head, ' lgc-tbl__r--h'), ...rows.map((r) => mkRow(r))];
  return glassPanel('lgc-tbl', body, { material: 'satin', radius: 16 });
}

export function glassFormField({ label = 'Email', help = "We'll never share it.", icon = 'envelope' } = {}) {
  return h('div', { class: 'lgc-formfield' }, [
    h('label', { class: 'lgc-formfield__l' }, label),
    glassInput({ placeholder: 'jane@studio.co', icon }),
    h('span', { class: 'lgc-formfield__h' }, help),
  ]);
}

/* --- Compounds: app chrome ----------------------------------------------- */
export function glassNavbar() {
  const inner = h('div', { class: 'lgc-nav__in' }, [
    h('span', { class: 'lgc-nav__brand' }, [h('span', { class: 'lgc-nav__dot' }), h('b', {}, 'Studio')]),
    h('nav', { class: 'lgc-nav__links' }, ['Home', 'Work', 'About'].map((t, i) => h('a', { class: 'lgc-nav__a' + (i === 0 ? ' is-on' : ''), href: '#' }, t))),
    h('span', { class: 'lgc-nav__cta' }, 'Sign in'),
    h('span', { class: 'lgc-nav__avatar' }, 'JA'),
  ]);
  return glassPanel('lgc-nav', [inner], { material: 'satin', radius: 16 });
}

export function glassSidebar({ items = [['gauge', 'Dashboard'], ['folder', 'Projects'], ['chart-simple', 'Reports'], ['gear', 'Settings']], active = 0 } = {}) {
  const rows = items.map(([icon, label], i) => h('div', { class: 'lgc-side__i' + (i === active ? ' is-on' : '') }, [h('span', { class: 'lgc-side__ic' }, [fa(icon)]), h('span', {}, label)]));
  rows.forEach((r, i) => r.addEventListener('click', () => rows.forEach((x, k) => x.classList.toggle('is-on', k === i))));
  return glassPanel('lgc-side', rows, { material: 'satin', radius: 16 });
}

export function glassToolbar() {
  const mk = (html, on = false) => { const b = h('button', { class: 'lgc-tool__b' + (on ? ' is-on' : ''), type: 'button', html }); b.addEventListener('click', () => b.classList.toggle('is-on')); return b; };
  const inner = h('div', { class: 'lgc-tool__in' }, [
    mk('<b>B</b>', true), mk('<i>I</i>'), mk('<span style="text-decoration:underline">U</span>'),
    h('span', { class: 'lgc-tool__sep' }),
    mk('<i class="fa-solid fa-align-left"></i>'), mk('<i class="fa-solid fa-list-ul"></i>'), mk('<i class="fa-solid fa-link"></i>'),
  ]);
  return glassPanel('lgc-tool', [inner], { material: 'satin', radius: 14 });
}

export function glassCommandPalette() {
  const field = h('div', { class: 'lgc-cmd__field' }, [fa('magnifying-glass', { cls: 'lgc-cmd__si' }), h('span', { class: 'lgc-cmd__sp' }, 'Type a command…'), h('kbd', {}, '⌘K')]);
  const rows = [['arrow-right', 'New file', '⌘N', true], ['gear', 'Open settings', '⌘,', false], ['user-plus', 'Invite teammate', '', false]].map(([icon, label, kbd, on]) =>
    h('div', { class: 'lgc-cmd__i' + (on ? ' is-on' : '') }, [h('span', { class: 'lgc-cmd__ic' }, [fa(icon)]), h('span', { class: 'lgc-cmd__t' }, label), kbd ? h('kbd', {}, kbd) : null]));
  return glassPanel('lgc-cmd', [field, ...rows], { material: 'deepFrost', radius: 18 });
}

/* --- Compounds: overlays & flows ----------------------------------------- */
export function glassModal() {
  const inner = h('div', { class: 'lgc-modal__in' }, [
    h('div', { class: 'lgc-modal__icon' }, [fa('triangle-exclamation')]),
    h('div', { class: 'lgc-modal__t' }, 'Delete project?'),
    h('div', { class: 'lgc-modal__d' }, "This action can't be undone. All files will be removed permanently."),
    h('div', { class: 'lgc-modal__row' }, [
      h('button', { class: 'lgc-modal__btn', type: 'button' }, 'Cancel'),
      h('button', { class: 'lgc-modal__btn lgc-modal__btn--danger', type: 'button' }, 'Delete'),
    ]),
  ]);
  return glassPanel('lgc-modal', [inner], { material: 'deepFrost', radius: 20 });
}

export function glassAuthForm() {
  const inner = h('div', { class: 'lgc-auth__in' }, [
    h('div', { class: 'lgc-auth__t' }, 'Welcome back'),
    h('div', { class: 'lgc-auth__d' }, 'Sign in to continue'),
    h('div', { class: 'lgc-auth__f' }, [fa('envelope'), h('span', {}, 'jane@studio.co')]),
    h('div', { class: 'lgc-auth__f' }, [fa('lock'), h('span', {}, '••••••••')]),
    h('button', { class: 'lgc-auth__cta', type: 'button' }, 'Continue'),
  ]);
  return glassPanel('lgc-auth', [inner], { material: 'deepFrost', radius: 20 });
}

export function glassDatePicker() {
  const head = h('div', { class: 'lgc-cal__h' }, [h('span', { class: 'lgc-cal__nav' }, [fa('chevron-left')]), h('b', {}, 'June 2026'), h('span', { class: 'lgc-cal__nav' }, [fa('chevron-right')])]);
  const dow = h('div', { class: 'lgc-cal__dow' }, ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => h('span', {}, d)));
  const grid = h('div', { class: 'lgc-cal__grid' });
  for (let i = 1; i <= 30; i++) {
    const d = h('button', { class: 'lgc-cal__d' + (i === 13 ? ' is-on' : ''), type: 'button' }, String(i));
    d.addEventListener('click', () => { grid.querySelectorAll('.is-on').forEach((x) => x.classList.remove('is-on')); d.classList.add('is-on'); });
    grid.append(d);
  }
  return glassPanel('lgc-cal', [head, dow, grid], { material: 'satin', radius: 18 });
}

/* --- Compounds: communication & media ------------------------------------ */
export function glassMediaPlayer() {
  const fill = h('span', { class: 'lgc-media__fill' });
  const bar = h('div', { class: 'lgc-media__track' }, [fill]);
  const playIco = fa('play');
  const play = h('button', { class: 'lgc-media__play', type: 'button' }, [playIco]);
  let on = false;
  play.addEventListener('click', () => { on = !on; playIco.className = `fa-solid fa-${on ? 'pause' : 'play'}`; });
  const inner = h('div', { class: 'lgc-media__in' }, [
    h('div', { class: 'lgc-media__top' }, [
      play,
      h('div', { class: 'lgc-media__meta' }, [h('b', {}, 'Midnight City'), h('span', {}, 'M83')]),
      h('span', { class: 'lgc-media__time' }, '1:24'),
    ]),
    bar,
  ]);
  return glassPanel('lgc-media', [inner], { material: 'satin', radius: 16 });
}

export function glassChat() {
  const them = h('div', { class: 'lgc-chat__b lgc-chat__b--them' }, 'Ready to ship the glass build?');
  attachGlass(them, { material: 'softFrost', surface: 'convex', radius: 16 });
  const me = h('div', { class: 'lgc-chat__b lgc-chat__b--me' }, 'Shipping now 🚀');
  return h('div', { class: 'lgc-chat' }, [them, me]);
}

/* --- Compounds: commerce ------------------------------------------------- */
export function glassProductCard() {
  const inner = h('div', { class: 'lgc-prod__in' }, [
    h('div', { class: 'lgc-prod__media' }),
    h('div', { class: 'lgc-prod__b' }, [
      h('div', { class: 'lgc-prod__t' }, 'Aurora Lamp'),
      h('div', { class: 'lgc-prod__sub' }, 'Ambient light'),
      h('div', { class: 'lgc-prod__row' }, [h('b', {}, '$129'), h('span', { class: 'lgc-prod__add' }, [fa('plus'), h('span', {}, 'Add')])]),
    ]),
  ]);
  return glassPanel('lgc-prod', [inner], { material: 'satin', radius: 18 });
}

export function glassPricing() {
  const plan = (name, price, feats, hot) => {
    const inner = h('div', { class: 'lgc-price__in' }, [
      h('div', { class: 'lgc-price__name' }, name),
      h('div', { class: 'lgc-price__p' }, [h('b', {}, price), h('span', {}, '/mo')]),
      h('ul', { class: 'lgc-price__f' }, feats.map((f) => h('li', {}, [fa('check'), h('span', {}, f)]))),
      h('span', { class: 'lgc-price__cta' + (hot ? ' is-hot' : '') }, 'Choose'),
    ]);
    return glassPanel('lgc-price' + (hot ? ' is-hot' : ''), [inner], { material: hot ? 'deepFrost' : 'satin', tint: hot ? 'primarySoft' : null, radius: 18 });
  };
  return h('div', { class: 'lgc-price-row' }, [
    plan('Free', '$0', ['1 project', 'Community support'], false),
    plan('Pro', '$12', ['Unlimited', 'Priority support'], true),
  ]);
}

/* ==========================================================================
   Build-out: the remaining catalog parts as REAL glass. Every interactive
   surface uses attachGlass / glassPanel (same construction as the hero lens);
   composite panels hold FLAT styled content to avoid nested backdrop filters.
   ========================================================================== */

/* flat (non-glass) content used INSIDE composite glass panels (no nesting) */
function flatField(value, icon) {
  return h('div', { class: 'lgc-ff' }, [icon ? fa(icon, { cls: 'lgc-ff__i' }) : null, h('span', { class: 'lgc-ff__v' }, value)]);
}
function flatToggle(on) {
  return h('span', { class: 'lgc-ft' + (on ? ' is-on' : '') }, [h('span', { class: 'lgc-ft__k' })]);
}
function inlineSteps(steps, current) {
  const kids = [];
  steps.forEach((label, i) => {
    const n = h('span', { class: 'lgc-istep__n' + (i < current ? ' is-done' : i === current ? ' is-on' : '') }, i < current ? '' : String(i + 1));
    if (i < current) n.append(fa('check'));
    kids.push(h('div', { class: 'lgc-istep__i' }, [n, h('span', { class: 'lgc-istep__l' }, label)]));
    if (i < steps.length - 1) kids.push(h('span', { class: 'lgc-istep__bar' + (i < current ? ' is-done' : '') }));
  });
  return h('div', { class: 'lgc-istep' }, kids);
}

/* --- Elements: more actions & entry -------------------------------------- */
export function glassToggleButton({ label = 'Bold', icon = 'bold', on = true } = {}) {
  const b = h('button', { class: 'lgc-tglbtn' + (on ? ' is-on' : ''), type: 'button' }, [fa(icon), h('span', {}, label)]);
  const glass = attachGlass(b, { material: on ? 'optic' : 'clear', tint: on ? 'primarySoft' : null, surface: 'convex', radius: 12 });
  let active = on;
  b.addEventListener('click', () => { active = !active; b.classList.toggle('is-on', active); applyGlassTint(glass, active ? 'primarySoft' : null); applyGlassMaterial(glass, active ? 'optic' : 'clear'); });
  return b;
}

export function glassSplitButton({ label = 'Save' } = {}) {
  const el = h('div', { class: 'lgc-split' }, [
    h('button', { class: 'lgc-split__main', type: 'button' }, label),
    h('span', { class: 'lgc-split__sep' }),
    h('button', { class: 'lgc-split__caret', type: 'button' }, [fa('chevron-down')]),
  ]);
  attachGlass(el, { material: 'optic', tint: 'primarySoft', surface: 'convex', radius: 12 });
  return el;
}

export function glassStepper({ value = 3, min = 0, max = 99 } = {}) {
  let v = value;
  const out = h('span', { class: 'lgc-step__v' }, String(value));
  const dec = h('button', { class: 'lgc-step__b', type: 'button' }, [fa('minus')]);
  const inc = h('button', { class: 'lgc-step__b', type: 'button' }, [fa('plus')]);
  dec.addEventListener('click', () => { v = Math.max(min, v - 1); out.textContent = String(v); });
  inc.addEventListener('click', () => { v = Math.min(max, v + 1); out.textContent = String(v); });
  const el = h('div', { class: 'lgc-step' }, [dec, out, inc]);
  attachGlass(el, { material: 'clear', surface: 'convex', radius: 12 });
  return el;
}

export function glassPassword({ value = 'secret123' } = {}) {
  const input = h('input', { type: 'password', value, 'aria-label': 'Password' });
  const eye = fa('eye', { cls: 'lgc-field__i lgc-field__i--btn' });
  const toggle = h('button', { class: 'lgc-pass__t', type: 'button' }, [eye]);
  let shown = false;
  toggle.addEventListener('click', () => { shown = !shown; input.type = shown ? 'text' : 'password'; eye.className = `fa-solid fa-${shown ? 'eye-slash' : 'eye'} lgc-field__i lgc-field__i--btn`; });
  const el = h('label', { class: 'lgc-field lgc-field--pass' }, [fa('lock', { cls: 'lgc-field__i' }), input, toggle]);
  attachGlass(el, { material: 'softFrost', surface: 'convex', radius: 12 });
  return el;
}

export function glassTagInput({ tags = ['design', 'glass'] } = {}) {
  const chips = tags.map((t) => h('span', { class: 'lgc-taginput__chip' }, [h('span', {}, t), fa('xmark')]));
  const input = h('input', { type: 'text', placeholder: 'Add tag…', 'aria-label': 'Add tag' });
  const el = h('div', { class: 'lgc-field lgc-taginput' }, [...chips, input]);
  attachGlass(el, { material: 'softFrost', surface: 'convex', radius: 12 });
  return el;
}

export function glassSelect({ value = 'Medium' } = {}) {
  const el = h('button', { class: 'lgc-field lgc-select', type: 'button' }, [h('span', { class: 'lgc-select__v' }, value), fa('chevron-down', { cls: 'lgc-select__c' })]);
  attachGlass(el, { material: 'softFrost', surface: 'convex', radius: 12 });
  return el;
}

export function glassFileInput() {
  const el = h('button', { class: 'lgc-fileinput', type: 'button' }, [fa('arrow-up-from-bracket'), h('span', {}, 'Choose file')]);
  attachGlass(el, { material: 'softFrost', surface: 'convex', radius: 12 });
  return el;
}

export function glassRating({ value = 3, max = 5 } = {}) {
  const stars = [];
  const el = h('div', { class: 'lgc-rating' });
  for (let i = 0; i < max; i++) {
    const s = h('button', { class: 'lgc-rating__s' + (i < value ? ' is-on' : ''), type: 'button' }, [fa('star')]);
    s.addEventListener('click', () => stars.forEach((x, k) => x.classList.toggle('is-on', k <= i)));
    stars.push(s); el.append(s);
  }
  attachGlass(el, { material: 'clear', surface: 'convex', radius: 999 });
  return el;
}

export function glassButtonGroup({ options = ['List', 'Board', 'Calendar'], value = 1 } = {}) {
  const el = h('div', { class: 'lgc-bg' });
  const btns = options.map((t, i) => { const b = h('button', { class: 'lgc-bg__b' + (i === value ? ' is-on' : ''), type: 'button' }, t); b.addEventListener('click', () => btns.forEach((x, k) => x.classList.toggle('is-on', k === i))); el.append(b); return b; });
  attachGlass(el, { material: 'clear', surface: 'convex', radius: 12 });
  return el;
}

/* --- Components: forms & navigation -------------------------------------- */
export function glassCombobox({ value = 'Glass', items = ['Glass', 'Gradient', 'Grid', 'Grain'] } = {}) {
  const field = h('label', { class: 'lgc-field' }, [fa('magnifying-glass', { cls: 'lgc-field__i' }), h('input', { type: 'text', value, 'aria-label': 'Combobox' })]);
  attachGlass(field, { material: 'softFrost', surface: 'convex', radius: 12 });
  const list = glassPanel('lgc-combo__list', items.map((t, i) => h('div', { class: 'lgc-combo__i' + (i === 0 ? ' is-on' : '') }, t)), { material: 'satin', radius: 12 });
  return h('div', { class: 'lgc-combo' }, [field, list]);
}

export function glassAutocomplete() {
  return glassCombobox({ value: 'Lon', items: ['London', 'Long Beach', 'Longmont', 'Lone Pine'] });
}

export function glassRadioGroup({ options = ['Light', 'Dark', 'Auto'], value = 1 } = {}) {
  const rows = options.map((label, i) => { const r = h('label', { class: 'lgc-rg__i' + (i === value ? ' is-on' : '') }, [h('span', { class: 'lgc-rg__dot' }), h('span', {}, label)]); return r; });
  const group = glassPanel('lgc-rg', rows, { material: 'satin', radius: 14 });
  rows.forEach((r, i) => r.addEventListener('click', () => rows.forEach((x, k) => x.classList.toggle('is-on', k === i))));
  return group;
}

export function glassInputGroup({ value = 'mysite' } = {}) {
  const el = h('div', { class: 'lgc-field lgc-ig' }, [h('span', { class: 'lgc-ig__addon' }, 'https://'), h('input', { type: 'text', value, 'aria-label': 'Domain' }), h('span', { class: 'lgc-ig__addon' }, '.com')]);
  attachGlass(el, { material: 'softFrost', surface: 'convex', radius: 12 });
  return el;
}

export function glassBreadcrumb({ items = ['Home', 'Components', 'Button'] } = {}) {
  const kids = [];
  items.forEach((t, i) => { kids.push(h('a', { class: 'lgc-crumb__a' + (i === items.length - 1 ? ' is-cur' : ''), href: '#' }, t)); if (i < items.length - 1) kids.push(fa('chevron-right', { cls: 'lgc-crumb__s' })); });
  return glassPanel('lgc-crumb', [h('div', { class: 'lgc-crumb__in' }, kids)], { material: 'softFrost', radius: 999 });
}

export function glassDropdown({ label = 'Options', items = ['Edit', 'Duplicate', 'Archive', 'Delete'] } = {}) {
  const trigger = h('button', { class: 'lgc-dd__trigger', type: 'button' }, [h('span', {}, label), fa('chevron-down')]);
  attachGlass(trigger, { material: 'clear', surface: 'convex', radius: 12 });
  const rows = items.map((t, i) => h('div', { class: 'lgc-dd__i' + (i === 0 ? ' is-on' : '') }, t));
  const menu = glassPanel('lgc-dd__menu', rows, { material: 'satin', radius: 12 });
  rows.forEach((r, i) => r.addEventListener('click', () => rows.forEach((x, k) => x.classList.toggle('is-on', k === i))));
  return h('div', { class: 'lgc-dd' }, [trigger, menu]);
}

export function glassSteps({ steps = ['Cart', 'Address', 'Payment', 'Review'], current = 1 } = {}) {
  return glassPanel('lgc-steps', [inlineSteps(steps, current)], { material: 'satin', radius: 16 });
}

export function glassPopover() {
  const inner = h('div', { class: 'lgc-pop__in' }, [
    h('div', { class: 'lgc-pop__t' }, 'Share access'),
    h('div', { class: 'lgc-pop__d' }, 'Anyone with the link can view this project.'),
    h('div', { class: 'lgc-pop__row' }, [h('span', { class: 'lgc-pop__link' }, 'studio.co/p/9f2'), h('button', { class: 'lgc-pop__btn', type: 'button' }, 'Copy')]),
  ]);
  return glassPanel('lgc-pop', [inner], { material: 'deepFrost', radius: 16 });
}

export function glassTree() {
  const node = (label, depth, o = {}) => h('div', { class: 'lgc-tree__i' + (o.on ? ' is-on' : ''), style: `padding-left:${10 + depth * 16}px` }, [
    o.caret ? fa(o.open ? 'chevron-down' : 'chevron-right', { cls: 'lgc-tree__c' }) : h('span', { class: 'lgc-tree__c' }),
    fa(o.icon || 'file', { cls: 'lgc-tree__ic' }), h('span', {}, label),
  ]);
  const rows = [
    node('src', 0, { caret: true, open: true, icon: 'folder-open' }),
    node('components', 1, { caret: true, open: true, icon: 'folder-open' }),
    node('Button.tsx', 2, { on: true }),
    node('Card.tsx', 2, {}),
    node('index.ts', 1, {}),
  ];
  return glassPanel('lgc-tree', rows, { material: 'satin', radius: 14 });
}

export function glassBanner({ text = 'A new version of the editor is available.', action = 'Refresh' } = {}) {
  const inner = h('div', { class: 'lgc-banner__in' }, [
    h('span', { class: 'lgc-banner__ic' }, [fa('circle-info')]),
    h('span', { class: 'lgc-banner__t' }, text),
    h('button', { class: 'lgc-banner__btn', type: 'button' }, action),
    h('button', { class: 'lgc-banner__x', type: 'button' }, [fa('xmark')]),
  ]);
  return glassPanel('lgc-banner', [inner], { material: 'satin', radius: 14 });
}

export function glassEmptyState() {
  const inner = h('div', { class: 'lgc-empty__in' }, [
    h('span', { class: 'lgc-empty__ic' }, [fa('inbox')]),
    h('div', { class: 'lgc-empty__t' }, 'No projects yet'),
    h('div', { class: 'lgc-empty__d' }, 'Create your first project to get started.'),
    h('button', { class: 'lgc-empty__cta', type: 'button' }, [fa('plus'), h('span', {}, 'New project')]),
  ]);
  return glassPanel('lgc-empty', [inner], { material: 'satin', radius: 18 });
}

export function glassLoading() {
  const inner = h('div', { class: 'lgc-loading__in' }, [h('span', { class: 'lgc-loading__spin' }), h('span', { class: 'lgc-loading__t' }, 'Loading…')]);
  return glassPanel('lgc-loading', [inner], { material: 'satin', radius: 16 });
}

export function glassTimeline({ items = [['Created', '2:14 PM'], ['Reviewed', '3:02 PM'], ['Shipped', '4:20 PM']] } = {}) {
  const rows = items.map(([t, time], i) => h('div', { class: 'lgc-tl__i' }, [h('span', { class: 'lgc-tl__node' + (i === 0 ? ' is-on' : '') }), h('div', { class: 'lgc-tl__b' }, [h('b', {}, t), h('span', {}, time)])]));
  return glassPanel('lgc-tl', rows, { material: 'satin', radius: 16 });
}

export function glassQuantity({ value = 2 } = {}) { return glassStepper({ value }); }

export function glassMediaObject() {
  const inner = h('div', { class: 'lgc-mo__in' }, [h('span', { class: 'lgc-mo__media' }), h('div', { class: 'lgc-mo__b' }, [h('b', {}, 'Weekly digest'), h('span', {}, 'A summary of activity across your workspace, delivered every Monday.')])]);
  return glassPanel('lgc-mo', [inner], { material: 'satin', radius: 16 });
}

/* --- Compounds: chrome, overlays, flows, data, media, commerce ----------- */
export function glassPageHeader() {
  const inner = h('div', { class: 'lgc-ph__in' }, [
    h('div', { class: 'lgc-ph__l' }, [h('div', { class: 'lgc-ph__t' }, 'Projects'), h('div', { class: 'lgc-ph__d' }, '12 active · 3 archived')]),
    h('div', { class: 'lgc-ph__a' }, [h('button', { class: 'lgc-ph__btn', type: 'button' }, 'Filter'), h('button', { class: 'lgc-ph__btn lgc-ph__btn--p', type: 'button' }, [fa('plus'), h('span', {}, 'New')])]),
  ]);
  return glassPanel('lgc-ph', [inner], { material: 'satin', radius: 16 });
}

export function glassFooter() {
  const col = (title, links) => h('div', { class: 'lgc-foot__col' }, [h('b', {}, title), ...links.map((l) => h('a', { href: '#' }, l))]);
  const inner = h('div', { class: 'lgc-foot__in' }, [
    h('div', { class: 'lgc-foot__brand' }, [h('span', { class: 'lgc-foot__dot' }), h('b', {}, 'Studio')]),
    col('Product', ['Features', 'Pricing']), col('Company', ['About', 'Blog']), col('Legal', ['Terms', 'Privacy']),
  ]);
  return glassPanel('lgc-foot', [inner], { material: 'satin', radius: 16 });
}

export function glassDrawer() {
  const inner = h('div', { class: 'lgc-drawer__in' }, [
    h('div', { class: 'lgc-drawer__h' }, [h('b', {}, 'Filters'), h('button', { class: 'lgc-drawer__x', type: 'button' }, [fa('xmark')])]),
    ...['Status', 'Owner', 'Date range', 'Tags'].map((t) => h('div', { class: 'lgc-drawer__row' }, [h('span', {}, t), fa('chevron-right')])),
    h('button', { class: 'lgc-drawer__cta', type: 'button' }, 'Apply filters'),
  ]);
  return glassPanel('lgc-drawer', [inner], { material: 'deepFrost', radius: 18 });
}

export function glassNotifications() {
  const item = (icon, t, time) => h('div', { class: 'lgc-notif__i' }, [h('span', { class: 'lgc-notif__ic' }, [fa(icon)]), h('div', { class: 'lgc-notif__b' }, [h('b', {}, t), h('span', {}, time)])]);
  const inner = h('div', { class: 'lgc-notif__in' }, [
    h('div', { class: 'lgc-notif__h' }, [h('b', {}, 'Notifications'), h('span', { class: 'lgc-notif__clear' }, 'Mark all read')]),
    item('user-plus', 'Milo joined the team', '2m'), item('comment', 'New comment on Aurora', '18m'), item('circle-check', 'Deploy succeeded', '1h'),
  ]);
  return glassPanel('lgc-notif', [inner], { material: 'deepFrost', radius: 18 });
}

export function glassCoachmark() {
  const inner = h('div', { class: 'lgc-coach__in' }, [
    h('div', { class: 'lgc-coach__t' }, 'Quick actions'),
    h('div', { class: 'lgc-coach__d' }, 'Press ⌘K anywhere to open the command palette.'),
    h('div', { class: 'lgc-coach__row' }, [h('span', { class: 'lgc-coach__dots' }, '● ○ ○'), h('button', { class: 'lgc-coach__btn', type: 'button' }, 'Next')]),
  ]);
  return glassPanel('lgc-coach', [inner], { material: 'deepFrost', radius: 16 });
}

export function glassForm() {
  const field = (label, val, icon) => h('div', { class: 'lgc-form__field' }, [h('label', {}, label), flatField(val, icon)]);
  const inner = h('div', { class: 'lgc-form__in' }, [
    h('div', { class: 'lgc-form__t' }, 'Account details'),
    h('div', { class: 'lgc-form__grid' }, [field('First name', 'Jane'), field('Last name', 'Appleseed')]),
    field('Email', 'jane@studio.co', 'envelope'),
    h('div', { class: 'lgc-form__row' }, [h('button', { class: 'lgc-form__btn', type: 'button' }, 'Cancel'), h('button', { class: 'lgc-form__btn lgc-form__btn--p', type: 'button' }, 'Save changes')]),
  ]);
  return glassPanel('lgc-form', [inner], { material: 'satin', radius: 18 });
}

export function glassWizard() {
  const inner = h('div', { class: 'lgc-wiz__in' }, [
    inlineSteps(['Plan', 'Details', 'Done'], 1),
    h('div', { class: 'lgc-wiz__t' }, 'Project details'),
    h('div', { class: 'lgc-wiz__d' }, 'Give your project a name and a short description.'),
    h('div', { class: 'lgc-wiz__row' }, [h('button', { class: 'lgc-wiz__btn', type: 'button' }, 'Back'), h('button', { class: 'lgc-wiz__btn lgc-wiz__btn--p', type: 'button' }, 'Continue')]),
  ]);
  return glassPanel('lgc-wiz', [inner], { material: 'satin', radius: 18 });
}

export function glassUploader() {
  const inner = h('div', { class: 'lgc-upl__in' }, [
    h('span', { class: 'lgc-upl__ic' }, [fa('cloud-arrow-up')]),
    h('div', { class: 'lgc-upl__t' }, 'Drag & drop files'),
    h('div', { class: 'lgc-upl__d' }, 'or click to browse · PNG, JPG up to 10MB'),
    h('div', { class: 'lgc-upl__file' }, [fa('file-image'), h('span', { class: 'lgc-upl__fn' }, 'hero.png'), h('span', { class: 'lgc-upl__bar' }, [h('span', { class: 'lgc-upl__fill' })])]),
  ]);
  return glassPanel('lgc-upl', [inner], { material: 'deepFrost', radius: 18 });
}

export function glassEditor() {
  const tb = (html, on = false) => { const b = h('button', { class: 'lgc-ed__b' + (on ? ' is-on' : ''), type: 'button', html }); b.addEventListener('click', () => b.classList.toggle('is-on')); return b; };
  const inner = h('div', { class: 'lgc-ed__in' }, [
    h('div', { class: 'lgc-ed__bar' }, [tb('<b>B</b>', true), tb('<i>I</i>'), tb('<span style="text-decoration:underline">U</span>'), h('span', { class: 'lgc-ed__sep' }), tb('<i class="fa-solid fa-list-ul"></i>'), tb('<i class="fa-solid fa-quote-right"></i>'), tb('<i class="fa-solid fa-code"></i>')]),
    h('div', { class: 'lgc-ed__body' }, [h('b', {}, 'Release notes'), h('p', {}, 'The new glass engine ships a crisp specular rim and faster displacement maps.')]),
  ]);
  return glassPanel('lgc-ed', [inner], { material: 'satin', radius: 16 });
}

export function glassSettings() {
  const row = (t, d, on) => h('div', { class: 'lgc-set__row' }, [h('div', { class: 'lgc-set__txt' }, [h('b', {}, t), h('span', {}, d)]), flatToggle(on)]);
  const inner = h('div', { class: 'lgc-set__in' }, [
    h('div', { class: 'lgc-set__t' }, 'Preferences'),
    row('Dark mode', 'Use the dark theme', true),
    row('Notifications', 'Email me about activity', false),
    row('Compact density', 'Tighter spacing', true),
  ]);
  return glassPanel('lgc-set', [inner], { material: 'satin', radius: 18 });
}

export function glassDataGrid() {
  return glassTable({ head: ['Name', 'Role', 'Status', 'Updated'], rows: [['Jane A.', 'Owner', 'Active', '2m'], ['Milo K.', 'Editor', 'Active', '1h'], ['Sora P.', 'Viewer', 'Away', '3h'], ['Ravi N.', 'Editor', 'Active', '1d']] });
}

export function glassChartCard() {
  const bars = [40, 68, 52, 84, 60, 92, 74];
  const inner = h('div', { class: 'lgc-chart__in' }, [
    h('div', { class: 'lgc-chart__h' }, [h('div', {}, [h('b', {}, 'Revenue'), h('span', { class: 'lgc-chart__sub' }, 'Last 7 days')]), h('span', { class: 'lgc-chart__delta' }, [fa('arrow-trend-up'), h('span', {}, '18%')])]),
    h('div', { class: 'lgc-chart__bars' }, bars.map((v, i) => h('span', { class: 'lgc-chart__bar' + (i === 5 ? ' is-on' : ''), style: `height:${v}%` }))),
  ]);
  return glassPanel('lgc-chart', [inner], { material: 'satin', radius: 18 });
}

export function glassScheduler() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const ev = { 1: ['Standup', 'top:6px;height:28px', ''], 3: ['Review', 'top:34px;height:42px', ' lgc-sch__ev--alt'] };
  const cols = days.map((d, i) => h('div', { class: 'lgc-sch__col' }, [h('span', { class: 'lgc-sch__d' }, d), ev[i] ? h('span', { class: 'lgc-sch__ev' + ev[i][2], style: ev[i][1] }, ev[i][0]) : null]));
  const inner = h('div', { class: 'lgc-sch__in' }, [
    h('div', { class: 'lgc-sch__h' }, [h('b', {}, 'June 15 – 19'), h('span', { class: 'lgc-sch__nav' }, [fa('chevron-left'), fa('chevron-right')])]),
    h('div', { class: 'lgc-sch__grid' }, cols),
  ]);
  return glassPanel('lgc-sch', [inner], { material: 'satin', radius: 18 });
}

export function glassKanban() {
  const col = (title, cards) => h('div', { class: 'lgc-kan__col' }, [h('div', { class: 'lgc-kan__ct' }, [h('span', {}, title), h('span', { class: 'lgc-kan__cn' }, String(cards.length))]), ...cards.map((c) => h('div', { class: 'lgc-kan__card' }, c))]);
  const inner = h('div', { class: 'lgc-kan__in' }, [col('To do', ['Design rim', 'Spec maps']), col('Doing', ['Build engine']), col('Done', ['Hero lens'])]);
  return glassPanel('lgc-kan', [inner], { material: 'satin', radius: 18 });
}

export function glassFacets() {
  const group = (title, opts) => h('div', { class: 'lgc-fac__g' }, [h('b', {}, title), ...opts.map(([l, on]) => h('label', { class: 'lgc-fac__o' }, [h('span', { class: 'lgc-fac__cb' + (on ? ' is-on' : '') }, on ? [fa('check')] : []), h('span', {}, l)]))]);
  const inner = h('div', { class: 'lgc-fac__in' }, [
    h('div', { class: 'lgc-fac__chips' }, [h('span', { class: 'lgc-fac__chip' }, ['Active', fa('xmark')]), h('span', { class: 'lgc-fac__chip' }, ['Glass', fa('xmark')])]),
    group('Status', [['Active', true], ['Archived', false]]), group('Type', [['Public', true], ['Private', false]]),
  ]);
  return glassPanel('lgc-fac', [inner], { material: 'satin', radius: 18 });
}

export function glassComments() {
  const c = (initials, name, time, text, depth) => h('div', { class: 'lgc-cmt__i', style: `margin-left:${depth * 22}px` }, [h('span', { class: 'lgc-cmt__av' }, initials), h('div', { class: 'lgc-cmt__b' }, [h('div', { class: 'lgc-cmt__meta' }, [h('b', {}, name), h('span', {}, time)]), h('p', {}, text)])]);
  const inner = h('div', { class: 'lgc-cmt__in' }, [c('JA', 'Jane', '2m', 'Love the new specular rim — looks crisp!', 0), c('MK', 'Milo', '1m', 'Agreed, the directional highlight is perfect.', 1)]);
  return glassPanel('lgc-cmt', [inner], { material: 'satin', radius: 16 });
}

export function glassGallery() {
  const inner = h('div', { class: 'lgc-gal__in' }, Array.from({ length: 6 }, (_, i) => h('span', { class: 'lgc-gal__t lgc-gal__t--' + (i % 3) })));
  return glassPanel('lgc-gal', [inner], { material: 'satin', radius: 18 });
}

export function glassCarousel() {
  const inner = h('div', { class: 'lgc-car__in' }, [h('button', { class: 'lgc-car__nav', type: 'button' }, [fa('chevron-left')]), h('span', { class: 'lgc-car__slide' }), h('button', { class: 'lgc-car__nav', type: 'button' }, [fa('chevron-right')])]);
  const dots = h('div', { class: 'lgc-car__dots' }, [0, 1, 2].map((i) => h('span', { class: 'lgc-car__dot' + (i === 0 ? ' is-on' : '') })));
  return glassPanel('lgc-car', [inner, dots], { material: 'satin', radius: 18 });
}

export function glassProfileCard() {
  const inner = h('div', { class: 'lgc-prof__in' }, [
    h('span', { class: 'lgc-prof__av' }, 'JA'),
    h('div', { class: 'lgc-prof__t' }, 'Jane Appleseed'),
    h('div', { class: 'lgc-prof__d' }, 'Product Designer · San Francisco'),
    h('div', { class: 'lgc-prof__stats' }, [['128', 'Posts'], ['8.4k', 'Followers'], ['312', 'Following']].map(([n, l]) => h('div', {}, [h('b', {}, n), h('span', {}, l)]))),
    h('div', { class: 'lgc-prof__row' }, [h('button', { class: 'lgc-prof__btn lgc-prof__btn--p', type: 'button' }, 'Follow'), h('button', { class: 'lgc-prof__btn', type: 'button' }, 'Message')]),
  ]);
  return glassPanel('lgc-prof', [inner], { material: 'satin', radius: 18 });
}

export function glassCart() {
  const line = (name, price) => h('div', { class: 'lgc-cart__i' }, [h('span', { class: 'lgc-cart__media' }), h('div', { class: 'lgc-cart__b' }, [h('b', {}, name), h('span', {}, 'Qty 1')]), h('span', { class: 'lgc-cart__p' }, price)]);
  const inner = h('div', { class: 'lgc-cart__in' }, [
    h('div', { class: 'lgc-cart__t' }, 'Your cart'),
    line('Aurora Lamp', '$129'), line('Glass Vase', '$48'),
    h('div', { class: 'lgc-cart__total' }, [h('span', {}, 'Total'), h('b', {}, '$177')]),
    h('button', { class: 'lgc-cart__cta', type: 'button' }, 'Checkout'),
  ]);
  return glassPanel('lgc-cart', [inner], { material: 'satin', radius: 18 });
}

export function glassCheckout() {
  const inner = h('div', { class: 'lgc-co__in' }, [
    inlineSteps(['Cart', 'Payment', 'Review'], 1),
    h('div', { class: 'lgc-co__t' }, 'Payment'),
    flatField('•••• •••• •••• 4242', 'credit-card'),
    h('div', { class: 'lgc-co__grid' }, [flatField('06 / 28'), flatField('CVC')]),
    h('div', { class: 'lgc-co__total' }, [h('span', {}, 'Total due'), h('b', {}, '$177')]),
    h('button', { class: 'lgc-co__cta', type: 'button' }, 'Pay $177'),
  ]);
  return glassPanel('lgc-co', [inner], { material: 'satin', radius: 18 });
}

/* --- registry: inventory demo key → live builder ------------------------- */
export const MOUNTS = {
  materialLab: () => glassMaterialLab(),
  toggle: () => glassSwitch({ on: true }),
  slider: () => glassSlider({ value: 0.4 }),
  button: () => h('div', { class: 'lgc-row' }, [glassButton({ label: 'Primary', variant: 'accent' }), glassButton({ label: 'Glass' }), glassButton({ label: 'Save', icon: 'check' })]),
  iconButton: () => h('div', { class: 'lgc-row' }, [glassIconButton({ icon: 'plus' }), glassIconButton({ icon: 'heart' }), glassIconButton({ icon: 'share-nodes' })]),
  fab: () => glassFab({ icon: 'plus' }),
  closeButton: () => glassIconButton({ icon: 'xmark', label: 'Close' }),
  segmented: () => glassSegmented({ options: ['Day', 'Week', 'Month'], value: 0 }),
  checkbox: () => h('div', { class: 'lgc-row' }, [glassCheckbox({ checked: true }), glassCheckbox({ checked: false })]),
  radio: () => h('div', { class: 'lgc-row' }, [glassRadio({ checked: true }), glassRadio({ checked: false })]),
  search: () => glassSearch(),
  filterChips: () => h('div', { class: 'lgc-row' }, [glassChip({ label: 'Active' }), glassChip({ label: 'Glass' }), glassChip({ label: 'Draft' })]),
  tag: () => h('div', { class: 'lgc-row' }, [glassChip({ label: 'Design' }), glassChip({ label: 'Motion' })]),
  surface: () => glassCard(),
  card: () => glassCard(),
  toast: () => glassToast(),
  alert: () => glassToast(),

  // text entry
  input: () => glassInput({ placeholder: 'Jane Appleseed', icon: 'user' }),
  textarea: () => glassTextarea({ placeholder: 'Write a message…' }),
  otp: () => glassOtp({ length: 4, filled: 2 }),
  formField: () => glassFormField(),

  // navigation
  tabs: () => glassTabs(),
  pagination: () => glassPagination(),
  menu: () => glassMenu(),
  sidebarNav: () => glassSidebar(),
  navbar: () => glassNavbar(),
  commandPalette: () => glassCommandPalette(),
  toolbar: () => glassToolbar(),

  // disclosure & feedback
  accordion: () => glassAccordion(),
  tooltip: () => glassTooltip(),

  // data display
  stat: () => glassStat(),
  list: () => glassList(),
  table: () => glassTable(),
  dataTable: () => glassTable({ head: ['Invoice', 'Status', 'Total'], rows: [['#1024', 'Paid', '$240'], ['#1025', 'Due', '$120'], ['#1026', 'Paid', '$80']] }),

  // overlays & flows
  modal: () => glassModal(),
  authForm: () => glassAuthForm(),
  datePicker: () => glassDatePicker(),

  // communication, media & commerce
  mediaPlayer: () => glassMediaPlayer(),
  chatThread: () => glassChat(),
  productCard: () => glassProductCard(),
  pricingTable: () => glassPricing(),

  // elements: more
  toggleButton: () => h('div', { class: 'lgc-row' }, [glassToggleButton({ label: 'Bold', icon: 'bold', on: true }), glassToggleButton({ label: 'Italic', icon: 'italic', on: false })]),
  splitButton: () => glassSplitButton({ label: 'Save' }),
  numberStepper: () => glassStepper({ value: 3 }),
  password: () => glassPassword(),
  tagInput: () => glassTagInput(),
  select: () => glassSelect(),
  fileInput: () => glassFileInput(),
  rating: () => glassRating({ value: 3 }),
  buttonGroup: () => glassButtonGroup(),
  quantity: () => glassQuantity(),

  // components: more
  combobox: () => glassCombobox(),
  autocomplete: () => glassAutocomplete(),
  radioGroup: () => glassRadioGroup(),
  inputGroup: () => glassInputGroup(),
  breadcrumb: () => glassBreadcrumb(),
  dropdownMenu: () => glassDropdown(),
  stepper: () => glassSteps(),
  popover: () => glassPopover(),
  tree: () => glassTree(),
  banner: () => glassBanner(),
  emptyState: () => glassEmptyState(),
  loadingOverlay: () => glassLoading(),
  timeline: () => glassTimeline(),
  mediaObject: () => glassMediaObject(),

  // compounds: more
  pageHeader: () => glassPageHeader(),
  footer: () => glassFooter(),
  drawer: () => glassDrawer(),
  notificationCenter: () => glassNotifications(),
  onboardingTour: () => glassCoachmark(),
  formFull: () => glassForm(),
  wizard: () => glassWizard(),
  fileUploader: () => glassUploader(),
  richTextEditor: () => glassEditor(),
  settingsPanel: () => glassSettings(),
  dataGrid: () => glassDataGrid(),
  chartCard: () => glassChartCard(),
  scheduler: () => glassScheduler(),
  kanban: () => glassKanban(),
  facetedFilter: () => glassFacets(),
  commentThread: () => glassComments(),
  imageGallery: () => glassGallery(),
  carousel: () => glassCarousel(),
  profileCard: () => glassProfileCard(),
  cart: () => glassCart(),
  checkout: () => glassCheckout(),
};
