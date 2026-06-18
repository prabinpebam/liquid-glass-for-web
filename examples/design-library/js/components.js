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

  const glass = attachGlass(knob, { surface: 'lip', radius: 'pill', bezel: 13, scaleBase: 26.6, refraction: 0.4, saturation: 6, specular: 0.5, blur: 0.2 });
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

  const glass = attachGlass(thumb, { surface: 'convex', radius: 'pill', bezel: 18, scaleBase: 55.9, refraction: 0.4, saturation: 7, specular: 0.5, blur: 0 });
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

  const glass = attachGlass(capsule, { surface: 'convex', radius: 26, bezel: 22, scaleBase: 56, refraction: 1, saturation: 9, specular: 0.5, blur: 0 });

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

  const glass = attachGlass(el, { surface: 'convex', radius: 'pill', bezel: 12, refraction: 0.4, saturation: 5, specular: 0.5, blur: 0.3 });
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
  const glass = attachGlass(el, { surface: 'convex', radius: 14, bezel: 8, refraction: 0.4, saturation: 5, specular: 0.5, blur: 0.3 });
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
  const glass = attachGlass(el, { surface: 'convex', radius: 'pill', bezel: 12, refraction: 0.4, saturation: 6, specular: 0.5, blur: 0.3 });
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

  const glass = attachGlass(indicator, { surface: 'convex', radius: 'pill', bezel: 10, refraction: 0.4, saturation: 5, specular: 0.5, blur: 0.2 });
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
  const glass = attachGlass(box, { surface: 'convex', radius: 8, bezel: 7, refraction: 0.4, saturation: 5, specular: 0.5, blur: 0.2 });
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
  const glass = attachGlass(disc, { surface: 'convex', radius: 'pill', bezel: 8, refraction: 0.4, saturation: 5, specular: 0.5, blur: 0.2 });
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
  const glass = attachGlass(el, { surface: 'convex', radius: 'pill', bezel: 14, refraction: 0.4, saturation: 4, specular: 0.5, blur: 1 });
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
  const glass = attachGlass(el, { surface: 'convex', radius: 'pill', bezel: 10, refraction: 0.4, saturation: 5, specular: 0.5, blur: 0.4 });
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
  attachGlass(el, { surface: 'convex', radius: 18, bezel: 16, refraction: 0.4, saturation: 5, specular: 0.5, blur: 2 });
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
  attachGlass(el, { surface: 'convex', radius: 14, bezel: 14, refraction: 0.4, saturation: 5, specular: 0.5, blur: 3 });
  return el;
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
};
