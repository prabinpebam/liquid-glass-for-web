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
import { attachGlass, Spring, spring, clamp01, lerp } from './glass.js';

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

/* ============================================================================
   Switch — faithful port of the kube switch state machine.
   Activation S = forced || grabbing drives: knob glass alpha 1→0.1 (opaque →
   glass), knob scale, refraction 0.4→0.9, track gray→green; tap toggles, drag
   slides with rubber-band overshoot, keyboard toggles.
   ========================================================================== */
export function glassSwitch({ on = true } = {}) {
  const track = h('span', { class: 'lgc-switch__track' });
  const knob = h('span', { class: 'lgc-switch__knob' });
  const el = h('button', {
    class: 'lgc-switch', type: 'button', role: 'switch',
    'aria-checked': String(on), 'aria-label': 'Toggle',
  }, [track, knob]);

  const glass = attachGlass(knob, { surface: 'lip', radius: 'pill', bezel: 13, scaleBase: 26.6, refraction: 0.4, saturation: 6, specular: 1, blur: 0.2 });
  const trackColor = mixColor('#94949F77', '#3BBF4EEE'); // gray → green

  // kube proportions scaled 0.477612 (track height 32px) to match other controls;
  // active scale lifts the knob to 52px (the expanded state) and overhangs the track.
  const REST = 0.65, ACTIVE = 1.1845;
  const TRAVEL = 27.65, MARGIN = -10.48; // 57.9*0.477612 ; -21.95*0.477612
  const SHADOW = '0 4px 22px rgba(0, 0, 0, 0.1)';
  const INSET = ', inset 2px 7px 24px rgba(0, 0, 0, 0.09), inset -2px -7px 24px rgba(255, 255, 255, 0.09)';
  const B = spring('glide', on ? 1 : 0);  // position 0..1   {1000,80}
  const C = spring('snap', 1);            // knob bg alpha    {2000,80}
  const A = spring('snap', on ? ACTIVE : REST); // knob scale  {2000,80}
  const T = spring('glide', on ? 1 : 0);  // track colour     {1000,80}
  const Q = spring('settle', 0.4);        // refraction       {170,26}

  let f = on ? 1 : 0, g = 0, h2 = f, forced = false, grabX = 0, moved = false;

  knob.style.marginLeft = `${MARGIN}px`;
  const renderKnob = () => {
    knob.style.transform = `translateY(-50%) translateX(${(B.get() * TRAVEL).toFixed(2)}px) scale(${A.get().toFixed(3)})`;
  };
  B.onChange(renderKnob); A.onChange(renderKnob);
  C.onChange((v) => (knob.style.background = `rgba(255,255,255,${v.toFixed(3)})`));
  T.onChange((v) => (track.style.background = trackColor(v)));
  Q.onChange((v) => (glass.refraction = v));

  const S = () => (forced || g > 0.5 ? 1 : 0);
  const sync = () => {
    const s = S();
    B.set(g > 0.5 ? h2 : f);
    C.set(1 - 0.9 * s);
    A.set(lerp(REST, ACTIVE, s));
    T.set(g > 0.5 ? (h2 > 0.5 ? 1 : 0) : f);
    Q.set(lerp(0.4, 0.9, s));
    knob.style.boxShadow = SHADOW + (s > 0.5 ? INSET : '');
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
   Slider — faithful port of the kube slider thumb. Grab activates the glass
   (scale 0.62→1, alpha 1→0.1, refraction 0.4→0.9); drag from thumb or track.
   ========================================================================== */
export function glassSlider({ value = 0.4 } = {}) {
  const fill = h('span', { class: 'lgc-slider__fill' });
  const trackEl = h('span', { class: 'lgc-slider__track' }, [fill]);
  const thumb = h('span', { class: 'lgc-slider__thumb', tabindex: '0', role: 'slider', 'aria-valuemin': '0', 'aria-valuemax': '100' });
  const el = h('div', { class: 'lgc-slider' }, [trackEl, thumb]);

  const glass = attachGlass(thumb, { surface: 'convex', radius: 'pill', bezel: 18, scaleBase: 55.9, refraction: 0.4, saturation: 7, specular: 1, blur: 0 });
  // kube proportions scaled 0.667 to fit the UI: 220x40 rig, 60x40 convex thumb
  // on a ~9px track, shrinking to 0.6 at rest (the original aspect ratio).
  const REST = 0.6, ACTIVE = 1;
  const A = spring('snap', REST);
  const X = spring('snap', 1);
  const Q = spring('settle', 0.4);

  let val = clamp01(value), n = 0, grabOffset = 0;
  A.onChange((v) => (thumb.style.transform = `translateX(-50%) scale(${v.toFixed(3)})`));
  X.onChange((v) => (thumb.style.background = `rgba(255,255,255,${v.toFixed(3)})`));
  Q.onChange((v) => (glass.refraction = v));

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
  const sync = () => { const s = S(); A.set(lerp(REST, ACTIVE, s)); X.set(1 - 0.9 * s); Q.set(lerp(0.4, 0.9, s)); thumb.classList.toggle('is-active', s > 0.5); };

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
   Precision Lens — the hallmark draggable distortion capsule with squash-and-
   stretch jiggle physics, floating over a busy backdrop it refracts.
   ========================================================================== */
export function glassLens() {
  const capsule = h('span', { class: 'lgc-lens__capsule', style: 'left:50%;top:50%;transform:translate(-50%,-50%)' });
  const stage = h('div', { class: 'lgc-lens' }, [capsule]);

  const glass = attachGlass(capsule, { surface: 'convex', radius: 26, bezel: 22, scaleBase: 56, refraction: 1, saturation: 9, specular: 1, blur: 0 });

  const SR = spring('grab', 0.8);   // refraction
  const S = spring('jelly', 0.8);   // base press
  const A = spring('jelly', 0.8);   // scaleY
  const T = spring('jelly', 1.0);   // scaleX
  const SA = spring('damp', 0.16);  // shadow alpha
  const all = [SR, S, A, T, SA];

  let grabbing = false, velX = 0, loop = 0;
  const render = () => {
    capsule.style.transform = `translate(-50%,-50%) scaleX(${T.get().toFixed(3)}) scaleY(${A.get().toFixed(3)})`;
    capsule.style.boxShadow = `0 ${(grabbing ? 16 : 6)}px 26px rgba(0,0,0,${SA.get().toFixed(3)})`;
    glass.refraction = SR.get();
  };
  const tick = () => {
    const grab = grabbing ? 1 : 0;
    velX *= 0.8; if (Math.abs(velX) < 1) velX = 0;
    SR.set(grab ? 1 : 0.8);
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
   Button — glass pill. Press = activation (refraction boost + scale dip + glass
   alpha lift); hover lifts. Optional leading Font Awesome icon.
   ========================================================================== */
export function glassButton({ label = 'Button', icon = null, variant = 'standard' } = {}) {
  const el = h('button', { class: `lgc-btn lgc-btn--${variant}`, type: 'button' },
    [icon ? fa(icon) : null, h('span', {}, label)]);
  if (variant === 'accent') return el; // accent is a solid tinted fill, no glass

  const glass = attachGlass(el, { surface: 'convex', radius: 'pill', bezel: 12, refraction: 0.4, saturation: 5, specular: 1, blur: 0.3 });
  const Q = spring('settle', 0.4), A = spring('snap', 1);
  Q.onChange((v) => (glass.refraction = v));
  A.onChange((v) => (el.style.transform = `scale(${v.toFixed(3)})`));
  const down = () => { Q.set(0.9); A.set(0.96); el.classList.add('is-active'); };
  const up = () => { Q.set(0.4); A.set(1); el.classList.remove('is-active'); };
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointerleave', up);
  el.addEventListener('pointercancel', up);
  return el;
}

export function glassIconButton({ icon = 'plus', label = 'Action' } = {}) {
  const el = h('button', { class: 'lgc-iconbtn', type: 'button', 'aria-label': label }, [fa(icon)]);
  const glass = attachGlass(el, { surface: 'convex', radius: 14, bezel: 8, refraction: 0.4, saturation: 5, specular: 1, blur: 0.3 });
  const Q = spring('settle', 0.4), A = spring('snap', 1);
  Q.onChange((v) => (glass.refraction = v));
  A.onChange((v) => (el.style.transform = `scale(${v.toFixed(3)})`));
  el.addEventListener('pointerdown', () => { Q.set(0.9); A.set(0.92); });
  const up = () => { Q.set(0.4); A.set(1); };
  el.addEventListener('pointerup', up); el.addEventListener('pointerleave', up);
  return el;
}

export function glassFab({ icon = 'plus' } = {}) {
  const el = h('button', { class: 'lgc-fab', type: 'button', 'aria-label': 'Create' }, [fa(icon)]);
  const glass = attachGlass(el, { surface: 'convex', radius: 'pill', bezel: 12, refraction: 0.4, saturation: 6, specular: 1, blur: 0.3 });
  const Q = spring('settle', 0.4), A = spring('grab', 1);
  Q.onChange((v) => (glass.refraction = v));
  A.onChange((v) => (el.style.transform = `scale(${v.toFixed(3)})`));
  el.addEventListener('pointerdown', () => { Q.set(0.9); A.set(0.9); });
  const up = () => { Q.set(0.4); A.set(1); };
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

  const glass = attachGlass(indicator, { surface: 'convex', radius: 'pill', bezel: 10, refraction: 0.4, saturation: 5, specular: 1, blur: 0.2 });
  const X = spring('snap', value), W = spring('snap', 0), Q = spring('settle', 0.4);
  let cur = value, settleTimer = 0;

  const place = () => {
    const target = segs[cur];
    indicator.style.transform = `translateX(${X.get()}px)`;
    indicator.style.width = `${W.get()}px`;
    void target;
  };
  X.onChange(place); W.onChange(place);
  Q.onChange((v) => (glass.refraction = v));

  const moveTo = (i) => {
    cur = i;
    segs.forEach((s, k) => s.classList.toggle('is-on', k === i));
    const t = segs[i];
    X.set(t.offsetLeft); W.set(t.offsetWidth);
    Q.set(0.9); clearTimeout(settleTimer); settleTimer = setTimeout(() => Q.set(0.4), 260);
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
  const glass = attachGlass(box, { surface: 'convex', radius: 8, bezel: 7, refraction: 0.4, saturation: 5, specular: 1, blur: 0.2 });
  const P = spring('jelly', checked ? 1 : 0), Q = spring('settle', checked ? 0.9 : 0.4);
  P.onChange((v) => { mark.style.transform = `scale(${clamp01(v).toFixed(3)})`; mark.style.opacity = clamp01(v).toFixed(3); });
  Q.onChange((v) => (glass.refraction = v));
  let on = checked;
  const set = (v) => { on = v; el.setAttribute('aria-checked', String(on)); el.classList.toggle('is-on', on); P.set(on ? 1 : 0); Q.set(on ? 0.9 : 0.4); };
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
  const glass = attachGlass(disc, { surface: 'convex', radius: 'pill', bezel: 8, refraction: 0.4, saturation: 5, specular: 1, blur: 0.2 });
  const P = spring('grab', checked ? 1 : 0), Q = spring('settle', checked ? 0.9 : 0.4);
  P.onChange((v) => { dot.style.transform = `translate(-50%,-50%) scale(${clamp01(v).toFixed(3)})`; });
  Q.onChange((v) => (glass.refraction = v));
  let on = checked;
  const set = (v) => { on = v; el.setAttribute('aria-checked', String(on)); el.classList.toggle('is-on', on); P.set(on ? 1 : 0); Q.set(on ? 0.9 : 0.4); };
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
  const glass = attachGlass(el, { surface: 'convex', radius: 'pill', bezel: 14, refraction: 0.4, saturation: 4, specular: 1, blur: 1 });
  const Q = spring('settle', 0.4);
  Q.onChange((v) => (glass.refraction = v));
  input.addEventListener('focus', () => { Q.set(0.9); el.classList.add('is-focus'); });
  input.addEventListener('blur', () => { Q.set(0.4); el.classList.remove('is-focus'); });
  return el;
}

/* ============================================================================
   Chip — glass token; toggles active (refraction + tint).
   ========================================================================== */
export function glassChip({ label = 'Design', removable = true } = {}) {
  const el = h('button', { class: 'lgc-chip is-on', type: 'button' },
    [h('span', {}, label), removable ? fa('xmark', { cls: 'lgc-chip__x' }) : null]);
  const glass = attachGlass(el, { surface: 'convex', radius: 'pill', bezel: 10, refraction: 0.4, saturation: 5, specular: 1, blur: 0.4 });
  const Q = spring('settle', 0.4);
  Q.onChange((v) => (glass.refraction = v));
  let on = true;
  el.addEventListener('click', () => { on = !on; el.classList.toggle('is-on', on); Q.set(on ? 0.9 : 0.4); });
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
  attachGlass(el, { surface: 'convex', radius: 18, bezel: 16, refraction: 0.4, saturation: 5, specular: 1, blur: 2 });
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
  attachGlass(el, { surface: 'convex', radius: 14, bezel: 14, refraction: 0.4, saturation: 5, specular: 1, blur: 3 });
  return el;
}

/* ============================================================================
   THE REST OF THE LIBRARY — every part below is built on the SAME glass
   construction as the hero lens: one `attachGlass()` surface per part (LG-P7),
   with only opacity / blur / refraction varied. Composite parts (modal, navbar,
   card-likes…) are a SINGLE glass surface holding flat content — never glass
   nested inside glass — exactly mirroring the lens.
   ========================================================================== */

/** Wrap a content node set in one glass surface. The shared engine builds the
 *  filter; only size-driven params vary. */
function glassPanel(cls, kids, opts = {}) {
  const el = h('div', { class: cls }, kids);
  attachGlass(el, {
    surface: 'convex', radius: opts.radius ?? 18, bezel: opts.bezel ?? 16,
    refraction: opts.refraction ?? 0.32, saturation: opts.saturation ?? 5,
    specular: 1, blur: opts.blur ?? 2.5,
  });
  return el;
}

/* --- Elements: text entry ------------------------------------------------ */
export function glassInput({ value = '', placeholder = 'Jane Appleseed', icon = null } = {}) {
  const input = h('input', { type: 'text', value, placeholder, 'aria-label': placeholder, autocomplete: 'off' });
  const el = h('label', { class: 'lgc-field' }, [icon ? fa(icon, { cls: 'lgc-field__i' }) : null, input]);
  const glass = attachGlass(el, { surface: 'convex', radius: 12, bezel: 11, refraction: 0.35, saturation: 4, specular: 1, blur: 1 });
  const Q = spring('settle', 0.4); Q.onChange((v) => (glass.refraction = v));
  input.addEventListener('focus', () => { Q.set(0.85); el.classList.add('is-focus'); });
  input.addEventListener('blur', () => { Q.set(0.4); el.classList.remove('is-focus'); });
  return el;
}

export function glassTextarea({ value = '', placeholder = 'Write a message…' } = {}) {
  const ta = h('textarea', { rows: '3', placeholder, 'aria-label': placeholder }, value);
  const el = h('div', { class: 'lgc-field lgc-field--area' }, [ta]);
  const glass = attachGlass(el, { surface: 'convex', radius: 14, bezel: 14, refraction: 0.35, saturation: 4, specular: 1, blur: 1.5 });
  const Q = spring('settle', 0.4); Q.onChange((v) => (glass.refraction = v));
  ta.addEventListener('focus', () => { Q.set(0.85); el.classList.add('is-focus'); });
  ta.addEventListener('blur', () => { Q.set(0.4); el.classList.remove('is-focus'); });
  return el;
}

export function glassOtp({ length = 4, filled = 2 } = {}) {
  const el = h('div', { class: 'lgc-otp' });
  for (let i = 0; i < length; i++) {
    const cell = h('div', { class: 'lgc-otp__cell' + (i === filled ? ' is-active' : '') }, i < filled ? String(i + 5) : '');
    attachGlass(cell, { surface: 'convex', radius: 10, bezel: 8, refraction: 0.4, saturation: 5, specular: 1, blur: 0.4 });
    el.append(cell);
  }
  return el;
}

/* --- Components: navigation ---------------------------------------------- */
export function glassTabs({ options = ['Overview', 'Specs', 'Usage'], value = 0 } = {}) {
  const indicator = h('span', { class: 'lgc-tabs__ind' });
  const tabs = options.map((label, i) => h('button', { class: 'lgc-tabs__t' + (i === value ? ' is-on' : ''), type: 'button' }, label));
  const el = h('div', { class: 'lgc-tabs', role: 'tablist' }, [indicator, ...tabs]);
  const glass = attachGlass(indicator, { surface: 'convex', radius: 10, bezel: 8, refraction: 0.4, saturation: 5, specular: 1, blur: 0.3 });
  const X = spring('snap', value), W = spring('snap', 0), Q = spring('settle', 0.4);
  let cur = value, timer = 0;
  const place = () => { indicator.style.transform = `translateX(${X.get()}px)`; indicator.style.width = `${W.get()}px`; };
  X.onChange(place); W.onChange(place); Q.onChange((v) => (glass.refraction = v));
  const moveTo = (i) => { cur = i; tabs.forEach((s, k) => s.classList.toggle('is-on', k === i)); const n = tabs[i]; X.set(n.offsetLeft); W.set(n.offsetWidth); Q.set(0.9); clearTimeout(timer); timer = setTimeout(() => Q.set(0.4), 260); };
  tabs.forEach((s, i) => s.addEventListener('click', () => moveTo(i)));
  const init = () => { const n = tabs[cur]; X.jump(n.offsetLeft); W.jump(n.offsetWidth); place(); };
  new ResizeObserver(init).observe(el); requestAnimationFrame(init);
  return el;
}

export function glassMenu({ items = ['Duplicate', 'Rename', 'Move to…', 'Delete'], active = 0 } = {}) {
  const rows = items.map((label, i) => h('div', { class: 'lgc-menu__i' + (i === active ? ' is-on' : '') }, label));
  rows.forEach((r, i) => r.addEventListener('click', () => rows.forEach((x, k) => x.classList.toggle('is-on', k === i))));
  return glassPanel('lgc-menu', rows, { radius: 14, bezel: 12, blur: 3, refraction: 0.3 });
}

export function glassPagination({ pages = ['1', '2', '3', '…', '9'], current = 1 } = {}) {
  const el = h('div', { class: 'lgc-pager' });
  const btns = pages.map((p, i) => {
    const b = h('button', { class: 'lgc-pager__b' + (i === current ? ' is-on' : '') + (p === '…' ? ' is-gap' : ''), type: 'button' }, p);
    if (p !== '…') attachGlass(b, { surface: 'convex', radius: 10, bezel: 7, refraction: 0.4, saturation: 5, specular: 1, blur: 0.3 });
    el.append(b); return b;
  });
  btns.forEach((b, i) => { if (pages[i] !== '…') b.addEventListener('click', () => btns.forEach((x, k) => x.classList.toggle('is-on', k === i && pages[k] !== '…'))); });
  return el;
}

/* --- Components: disclosure & feedback ----------------------------------- */
export function glassTooltip({ text = 'Copied to clipboard' } = {}) {
  return glassPanel('lgc-tooltip', [h('span', {}, text)], { radius: 10, bezel: 9, blur: 2, refraction: 0.4, saturation: 6 });
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
  return glassPanel('lgc-acc', rows, { radius: 14, bezel: 12, blur: 2.5, refraction: 0.3 });
}

/* --- Components: data display -------------------------------------------- */
export function glassStat({ label = 'Revenue', value = '$48.2k', delta = '12.4%' } = {}) {
  return glassPanel('lgc-stat', [
    h('div', { class: 'lgc-stat__l' }, label),
    h('div', { class: 'lgc-stat__n' }, value),
    h('div', { class: 'lgc-stat__d' }, [fa('arrow-trend-up'), h('span', {}, delta)]),
  ], { radius: 16, bezel: 14, blur: 2.5, refraction: 0.35 });
}

export function glassList({ items = [['inbox', 'Inbox', '24'], ['file-lines', 'Drafts', '3'], ['paper-plane', 'Sent', '']] } = {}) {
  const rows = items.map(([icon, label, n]) => h('div', { class: 'lgc-list__i' }, [
    h('span', { class: 'lgc-list__ic' }, [fa(icon)]),
    h('span', { class: 'lgc-list__t' }, label),
    n ? h('span', { class: 'lgc-list__n' }, n) : null,
  ]));
  return glassPanel('lgc-list', rows, { radius: 14, bezel: 12, blur: 3, refraction: 0.3 });
}

export function glassTable({ head = ['Name', 'Role', 'Status'], rows = [['Jane A.', 'Owner', 'Active'], ['Milo K.', 'Editor', 'Active'], ['Sora P.', 'Viewer', 'Away']] } = {}) {
  const mkRow = (cells, cls = '') => h('div', { class: 'lgc-tbl__r' + cls }, cells.map((c) => h('span', {}, c)));
  const body = [mkRow(head, ' lgc-tbl__r--h'), ...rows.map((r) => mkRow(r))];
  return glassPanel('lgc-tbl', body, { radius: 16, bezel: 14, blur: 2.5, refraction: 0.3 });
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
  return glassPanel('lgc-nav', [inner], { radius: 16, bezel: 12, blur: 2, refraction: 0.3 });
}

export function glassSidebar({ items = [['gauge', 'Dashboard'], ['folder', 'Projects'], ['chart-simple', 'Reports'], ['gear', 'Settings']], active = 0 } = {}) {
  const rows = items.map(([icon, label], i) => h('div', { class: 'lgc-side__i' + (i === active ? ' is-on' : '') }, [h('span', { class: 'lgc-side__ic' }, [fa(icon)]), h('span', {}, label)]));
  rows.forEach((r, i) => r.addEventListener('click', () => rows.forEach((x, k) => x.classList.toggle('is-on', k === i))));
  return glassPanel('lgc-side', rows, { radius: 16, bezel: 13, blur: 3, refraction: 0.3 });
}

export function glassToolbar() {
  const mk = (html, on = false) => { const b = h('button', { class: 'lgc-tool__b' + (on ? ' is-on' : ''), type: 'button', html }); b.addEventListener('click', () => b.classList.toggle('is-on')); return b; };
  const inner = h('div', { class: 'lgc-tool__in' }, [
    mk('<b>B</b>', true), mk('<i>I</i>'), mk('<span style="text-decoration:underline">U</span>'),
    h('span', { class: 'lgc-tool__sep' }),
    mk('<i class="fa-solid fa-align-left"></i>'), mk('<i class="fa-solid fa-list-ul"></i>'), mk('<i class="fa-solid fa-link"></i>'),
  ]);
  return glassPanel('lgc-tool', [inner], { radius: 14, bezel: 11, blur: 2, refraction: 0.3 });
}

export function glassCommandPalette() {
  const field = h('div', { class: 'lgc-cmd__field' }, [fa('magnifying-glass', { cls: 'lgc-cmd__si' }), h('span', { class: 'lgc-cmd__sp' }, 'Type a command…'), h('kbd', {}, '⌘K')]);
  const rows = [['arrow-right', 'New file', '⌘N', true], ['gear', 'Open settings', '⌘,', false], ['user-plus', 'Invite teammate', '', false]].map(([icon, label, kbd, on]) =>
    h('div', { class: 'lgc-cmd__i' + (on ? ' is-on' : '') }, [h('span', { class: 'lgc-cmd__ic' }, [fa(icon)]), h('span', { class: 'lgc-cmd__t' }, label), kbd ? h('kbd', {}, kbd) : null]));
  return glassPanel('lgc-cmd', [field, ...rows], { radius: 18, bezel: 14, blur: 4, refraction: 0.3 });
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
  return glassPanel('lgc-modal', [inner], { radius: 20, bezel: 16, blur: 4, refraction: 0.3 });
}

export function glassAuthForm() {
  const inner = h('div', { class: 'lgc-auth__in' }, [
    h('div', { class: 'lgc-auth__t' }, 'Welcome back'),
    h('div', { class: 'lgc-auth__d' }, 'Sign in to continue'),
    h('div', { class: 'lgc-auth__f' }, [fa('envelope'), h('span', {}, 'jane@studio.co')]),
    h('div', { class: 'lgc-auth__f' }, [fa('lock'), h('span', {}, '••••••••')]),
    h('button', { class: 'lgc-auth__cta', type: 'button' }, 'Continue'),
  ]);
  return glassPanel('lgc-auth', [inner], { radius: 20, bezel: 16, blur: 4, refraction: 0.3 });
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
  return glassPanel('lgc-cal', [head, dow, grid], { radius: 18, bezel: 14, blur: 3, refraction: 0.3 });
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
  return glassPanel('lgc-media', [inner], { radius: 16, bezel: 13, blur: 2.5, refraction: 0.3 });
}

export function glassChat() {
  const them = h('div', { class: 'lgc-chat__b lgc-chat__b--them' }, 'Ready to ship the glass build?');
  attachGlass(them, { surface: 'convex', radius: 16, bezel: 12, refraction: 0.35, saturation: 5, specular: 1, blur: 1.5 });
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
  return glassPanel('lgc-prod', [inner], { radius: 18, bezel: 16, blur: 3, refraction: 0.3 });
}

export function glassPricing() {
  const plan = (name, price, feats, hot) => {
    const inner = h('div', { class: 'lgc-price__in' }, [
      h('div', { class: 'lgc-price__name' }, name),
      h('div', { class: 'lgc-price__p' }, [h('b', {}, price), h('span', {}, '/mo')]),
      h('ul', { class: 'lgc-price__f' }, feats.map((f) => h('li', {}, [fa('check'), h('span', {}, f)]))),
      h('span', { class: 'lgc-price__cta' + (hot ? ' is-hot' : '') }, 'Choose'),
    ]);
    return glassPanel('lgc-price' + (hot ? ' is-hot' : ''), [inner], { radius: 18, bezel: 15, blur: 3, refraction: 0.3 });
  };
  return h('div', { class: 'lgc-price-row' }, [
    plan('Free', '$0', ['1 project', 'Community support'], false),
    plan('Pro', '$12', ['Unlimited', 'Priority support'], true),
  ]);
}

/* --- registry: inventory demo key → live builder ------------------------- */
export const MOUNTS = {
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
};
