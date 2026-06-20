/**
 * Playground wiring.
 *  - Every demo (Precision Lens, Searchbox, Switch, Slider, Music Player) uses
 *    a faithful kube.io filter from js/kube-demos.js, each driven by its own
 *    parameter panel and animated to match the reference.
 */
import {
  applyLens,
  applySearchbox,
  applySwitch,
  applySlider,
  applyPlayer,
} from './kube-demos.js';

const out = (name, value) => {
  const el = document.querySelector(`[data-out="${name}"]`);
  if (el) el.textContent = value;
};

/* ----------------------------------------------------------------------------
 * Spring — a small re-implementation of framer-motion's `useSpring`, the
 * physics primitive that drives every transition in kube.io's Switch/Slider.
 * A critically/under-damped harmonic oscillator integrated with semi-implicit
 * Euler (fixed sub-steps for stability), matching framer's {stiffness, damping,
 * mass} contract. Subscribers fire on every frame the value changes.
 * ------------------------------------------------------------------------- */
class Spring {
  constructor(value, { stiffness = 170, damping = 26, mass = 1 } = {}) {
    this.value = value;
    this.target = value;
    this.velocity = 0;
    this.k = stiffness;
    this.c = damping;
    this.m = mass;
    this.subs = new Set();
    this._raf = 0;
    this._last = 0;
  }
  onChange(cb) {
    this.subs.add(cb);
    cb(this.value);
    return () => this.subs.delete(cb);
  }
  _emit() {
    for (const cb of this.subs) cb(this.value);
  }
  get() {
    return this.value;
  }
  get active() {
    return this._raf !== 0;
  }
  jump(v) {
    this.value = this.target = v;
    this.velocity = 0;
    this._emit();
  }
  set(target) {
    if (target === this.target && !this._raf) return;
    this.target = target;
    if (!this._raf) {
      this._last = performance.now();
      this._raf = requestAnimationFrame(this._step);
    }
  }
  _step = (now) => {
    let dt = (now - this._last) / 1000;
    this._last = now;
    if (dt > 0.064) dt = 0.064; // clamp tab-switch / GC stalls
    const steps = Math.max(1, Math.ceil(dt / 0.004));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      const f = -this.k * (this.value - this.target) - this.c * this.velocity;
      this.velocity += (f / this.m) * h;
      this.value += this.velocity * h;
    }
    this._emit();
    if (Math.abs(this.velocity) < 0.0008 && Math.abs(this.value - this.target) < 0.0004) {
      this.value = this.target;
      this.velocity = 0;
      this._emit();
      this._raf = 0;
      return;
    }
    this._raf = requestAnimationFrame(this._step);
  };
}

// Parse an #RRGGBB or #RRGGBBAA string into [r, g, b, a].
function parseHex(hex) {
  const s = hex.replace('#', '');
  const n = parseInt(s.length === 6 ? s + 'ff' : s, 16);
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, (n & 255) / 255];
}
// Interpolate two hex colours → an `rgba()` string (framer's `mixColor`).
function mixColor(a, b) {
  const ca = parseHex(a);
  const cb = parseHex(b);
  return (t) => {
    const r = Math.round(ca[0] + (cb[0] - ca[0]) * t);
    const g = Math.round(ca[1] + (cb[1] - ca[1]) * t);
    const bl = Math.round(ca[2] + (cb[2] - ca[2]) * t);
    const al = (ca[3] + (cb[3] - ca[3]) * t).toFixed(3);
    return `rgba(${r}, ${g}, ${bl}, ${al})`;
  };
}
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

function bindPanel(selector, api, fmt) {
  const panel = document.querySelector(selector);
  if (!panel) return;
  panel.querySelectorAll('input[data-k]').forEach((input) => {
    input.addEventListener('input', () => {
      const k = input.dataset.k;
      const v = Number(input.value);
      api[k] = v;
      out(`${panel.dataset.params}-${k}`, (fmt[k] || ((x) => x))(v));
    });
  });
}

/* ----------------------------------------------------- kube.io demos ------ */
const lensEl = document.getElementById('lens');
const lens = applyLens(lensEl, { specular: 0.5, saturation: 9, refraction: 1 });
// The lens motion, jiggle physics and parameter panel are wired in wireLens() below.

const searchEl = document.getElementById('searchbox');
const search = applySearchbox(searchEl, { specular: 0.2, saturation: 4, refraction: 0.7, blur: 1 });
bindPanel('[data-params="search"]', search, {
  specular: (v) => v.toFixed(2),
  saturation: (v) => String(v),
  refraction: (v) => v.toFixed(2),
  blur: (v) => v.toFixed(1),
});

document.getElementById('search-bg').addEventListener('change', (e) => {
  document.getElementById('search-stage').classList.toggle('stage--photo', e.target.checked);
});

/* ---- Precision Lens — squash-and-stretch jiggle physics ------------------ */
/*
 * Faithful port of kube's lens component (`Ka`). Grabbing the capsule lifts its
 * shadow and intensifies refraction + magnification; the horizontal drag
 * velocity squashes it vertically and stretches it horizontally — a springy
 * jelly wobble that settles when you stop. Motion model:
 *   grab     → S 0.8→1, scaleRatio 0.8→1, magnify 24→48, shadow lifts
 *   velocity → B = S·max(0.7, 1−|vx|/5000) drives scaleY (A); scaleX = S+(1−A)
 * Spring configs are taken verbatim from the reference bundle.
 */
(function wireLens() {
  const stage = lensEl.parentElement;

  const SR = new Spring(0.8, { stiffness: 250, damping: 14 }); // scaleRatio → refraction
  const MG = new Spring(24, { stiffness: 250, damping: 14 }); // magnifyingScale
  const S = new Spring(0.8, { stiffness: 340, damping: 20 }); // base press value
  const A = new Spring(0.8, { stiffness: 340, damping: 30 }); // scaleY
  const T = new Spring(1.0, { stiffness: 340, damping: 30 }); // scaleX
  const OX = new Spring(0, { stiffness: 340, damping: 30 }); // shadow offset x
  const OY = new Spring(4, { stiffness: 340, damping: 30 }); // shadow offset y
  const BL = new Spring(9, { stiffness: 340, damping: 30 }); // shadow blur
  const SA = new Spring(0.16, { stiffness: 220, damping: 24 }); // shadow alpha
  const IA = new Spring(0.2, { stiffness: 220, damping: 24 }); // inset alpha
  const all = [SR, MG, S, A, T, OX, OY, BL, SA, IA];

  let grabbing = false;
  let userRefr = 1; // "Refraction level" param (l)
  let velX = 0; // drag velocity px/s

  const render = () => {
    lensEl.style.transform = `scaleX(${T.get()}) scaleY(${A.get()})`;
    const sx = OX.get();
    const sy = OY.get();
    lensEl.style.boxShadow =
      `${sx}px ${sy}px ${BL.get()}px rgba(0, 0, 0, ${SA.get()}), ` +
      `inset ${sx / 2}px ${sy / 2}px 24px rgba(0, 0, 0, ${IA.get()}), ` +
      `inset ${-sx / 2}px ${-sy / 2}px 24px rgba(255, 255, 255, ${IA.get()})`;
    lens.magnify = MG.get();
    lens.refraction = SR.get();
  };

  let loop = 0;
  const tick = () => {
    const grab = grabbing ? 1 : 0;
    velX *= 0.8; // velocity relaxes when the pointer holds still
    if (Math.abs(velX) < 1) velX = 0;
    SR.set(userRefr * (grab ? 1 : 0.8));
    MG.set(grab ? 48 : 24);
    S.set(grab ? 1 : 0.8);
    A.set(S.get() * Math.max(0.7, 1 - Math.abs(velX) / 5000));
    T.set(S.get() + (1 - A.get()));
    OX.set(grab ? 4 : 0);
    OY.set(grab ? 16 : 4);
    BL.set(grab ? 24 : 9);
    SA.set(grab ? 0.22 : 0.16);
    IA.set(grab ? 0.27 : 0.2);
    render();
    if (grabbing || velX !== 0 || all.some((s) => s.active)) {
      loop = requestAnimationFrame(tick);
    } else {
      loop = 0;
    }
  };
  const startLoop = () => {
    if (!loop) loop = requestAnimationFrame(tick);
  };

  let dragging = false;
  let ox = 0;
  let oy = 0;
  let lastX = 0;
  let lastT = 0;
  lensEl.addEventListener('pointerdown', (e) => {
    dragging = true;
    grabbing = true;
    lensEl.setPointerCapture(e.pointerId);
    const r = lensEl.getBoundingClientRect();
    ox = e.clientX - r.left;
    oy = e.clientY - r.top;
    lastX = e.clientX;
    lastT = performance.now();
    velX = 0;
    startLoop();
  });
  lensEl.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const s = stage.getBoundingClientRect();
    const x = e.clientX - s.left - ox;
    const y = e.clientY - s.top - oy;
    lensEl.style.left = `${Math.max(0, Math.min(s.width - lensEl.offsetWidth, x))}px`;
    lensEl.style.top = `${Math.max(0, Math.min(s.height - lensEl.offsetHeight, y))}px`;
    const now = performance.now();
    const dt = now - lastT;
    if (dt > 0) velX = ((e.clientX - lastX) / dt) * 1000;
    lastX = e.clientX;
    lastT = now;
    startLoop();
  });
  const release = () => {
    if (!dragging) return;
    dragging = false;
    grabbing = false;
    velX = 0; // kube's onDragEnd resets velocity
    startLoop();
  };
  lensEl.addEventListener('pointerup', release);
  lensEl.addEventListener('pointercancel', release);

  const panel = document.querySelector('[data-params="lens"]');
  panel.querySelectorAll('input[data-k]').forEach((input) => {
    input.addEventListener('input', () => {
      const k = input.dataset.k;
      const v = Number(input.value);
      if (k === 'refraction') {
        userRefr = v;
        startLoop();
      } else {
        lens[k] = v;
      }
      out(`lens-${k}`, fmt4[k](v));
    });
  });

  render();
})();

/* ------------------------------------------------- kube UI element demos -- */
const fmt4 = {
  specular: (v) => v.toFixed(2),
  saturation: (v) => String(v),
  refraction: (v) => v.toFixed(2),
  blur: (v) => v.toFixed(1),
};

/*
 * Parameter panel for the stateful demos (Switch/Slider). specular/saturation/
 * blur set the filter directly; "refraction" is kube's base multiplier `d`,
 * which is blended with the active-state spring — so it routes to `onRefr`.
 */
function bindStateParams(name, api, onRefr) {
  const panel = document.querySelector(`[data-params="${name}"]`);
  panel.querySelectorAll('input[data-k]').forEach((input) => {
    input.addEventListener('input', () => {
      const k = input.dataset.k;
      const v = Number(input.value);
      if (k === 'refraction') onRefr(v);
      else api[k] = v;
      out(`${name}-${k}`, fmt4[k](v));
    });
  });
}

/* ---- Switch -------------------------------------------------------------- */
/*
 * Faithful port of kube's switch state machine (framer component `Jr`).
 * Motion values: f = on/off target, g = grabbing, h = continuous drag
 * position, forced = "force active". Active state S = forced || grabbing.
 * Five springs animate between states:
 *   B  position 0..1            {stiffness:1000, damping:80}
 *   C  knob bg alpha 1 → 0.1    {stiffness:2000, damping:80}  (opaque → glass)
 *   A  knob scale 0.65 → 0.9    {stiffness:2000, damping:80}
 *   T  track colour gray → green{stiffness:1000, damping:80}
 *   Q  refraction (0.4→0.9)·d   (filter displacement scale)
 */
(function wireSwitch() {
  const el = document.getElementById('switch-el'); // track 160x67
  const knob = document.getElementById('switch-knob'); // glass 146x92
  const force = document.getElementById('switch-force');
  const api = applySwitch(knob, { specular: 0.5, saturation: 6, blur: 0.2, refraction: 0.4 });

  const TRAVEL = 57.9; // px the knob travels (93 - 54*0.65)
  const MARGIN = -21.95; // -25.55 + (67 - 92*0.65)/2
  const REST = 0.65;
  const ACTIVE = 0.9;
  const trackColor = mixColor('#94949F77', '#3BBF4EEE'); // gray → green
  const SHADOW = '0 4px 22px rgba(0, 0, 0, 0.1)';
  const INSET =
    ', inset 2px 7px 24px rgba(0, 0, 0, 0.09), inset -2px -7px 24px rgba(255, 255, 255, 0.09)';

  let f = 1; // on/off target (kube inits on)
  let g = 0; // grabbing 0/1
  let h = 1; // continuous drag position 0..1
  let forced = false;
  let userRefr = 1; // "Refraction level" param (d)
  let grabX = 0;
  let moved = false;

  const B = new Spring(f, { stiffness: 1000, damping: 80 });
  const C = new Spring(1, { stiffness: 2000, damping: 80 });
  const A = new Spring(REST, { stiffness: 2000, damping: 80 });
  const T = new Spring(f, { stiffness: 1000, damping: 80 });
  const Q = new Spring(0.4, { stiffness: 170, damping: 26 });

  const renderKnob = () => {
    knob.style.transform = `translateY(-50%) translateX(${B.get() * TRAVEL}px) scale(${A.get()})`;
  };
  knob.style.marginLeft = `${MARGIN}px`;
  B.onChange(renderKnob);
  A.onChange(renderKnob);
  C.onChange((v) => (knob.style.backgroundColor = `rgba(255, 255, 255, ${v})`));
  T.onChange((v) => (el.style.backgroundColor = trackColor(v)));
  Q.onChange((v) => (api.refraction = v));

  const S = () => (forced || g > 0.5 ? 1 : 0);
  const sync = () => {
    const s = S();
    B.set(g > 0.5 ? h : f);
    C.set(1 - 0.9 * s);
    A.set(REST + (ACTIVE - REST) * s);
    T.set(g > 0.5 ? (h > 0.5 ? 1 : 0) : f > 0.5 ? 1 : 0);
    Q.set((0.4 + 0.5 * s) * userRefr);
    knob.style.boxShadow = SHADOW + (g > 0.5 ? INSET : '');
    el.setAttribute('aria-checked', String(f > 0.5));
  };

  el.addEventListener('pointerdown', (e) => {
    g = 1;
    grabX = e.clientX;
    moved = false;
    h = f;
    sync();
  });
  window.addEventListener('pointermove', (e) => {
    if (g < 0.5) return;
    const dx = e.clientX - grabX;
    if (Math.abs(dx) > 4) moved = true;
    const d = f + dx / TRAVEL;
    const over = d < 0 ? -d : d > 1 ? d - 1 : 0; // rubber-band overshoot
    h = clamp01(d) + (d < 0 ? -1 : 1) * (over / 22);
    sync();
  });
  const release = (e) => {
    if (g < 0.5) return;
    g = 0;
    if (moved) f = h > 0.5 ? 1 : 0; // snap to nearest end after a drag
    else if (!forced) f = f > 0.5 ? 0 : 1; // a tap toggles
    sync();
  };
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);
  el.addEventListener('keydown', (e) => {
    if ((e.key === ' ' || e.key === 'Enter') && !forced) {
      e.preventDefault();
      f = f > 0.5 ? 0 : 1;
      sync();
    }
  });
  force.addEventListener('change', () => {
    forced = force.checked;
    el.classList.toggle('is-forced', forced);
    sync();
  });

  bindStateParams('switch', api, (v) => {
    userRefr = v;
    Q.set((0.4 + 0.5 * S()) * userRefr);
  });
  sync();
})();

/* ---- Slider -------------------------------------------------------------- */
/*
 * Faithful port of kube's slider thumb. Motion values: val = position 0..1,
 * n = grabbing, forced = "force active". Active state S = forced || grabbing.
 * Springs: A scale 0.6 → 1.0, X bg alpha 1 → 0.1 (opaque → glass),
 * Q refraction (0.4 → 0.9)·d. The thumb drags from itself or anywhere on the
 * track, with the centre clamped 27px from each end (kube's drag constraints).
 */
(function wireSlider() {
  const el = document.getElementById('slider-el'); // 330x60 container
  const track = el.querySelector('.kslider__track');
  const thumb = document.getElementById('slider-thumb'); // 90x60 glass
  const fill = document.getElementById('slider-fill');
  const force = document.getElementById('slider-force');
  const api = applySlider(thumb, { specular: 0.4, saturation: 7, blur: 0, refraction: 0.4 });

  const PAD = 27; // thumb centre clamps 27px from each track end
  const REST = 0.6;
  const ACTIVE = 1;
  let val = 0.1; // 0..1 (kube inits 10/100)
  let n = 0; // grabbing
  let forced = false;
  let userRefr = 1;
  let grabOffset = 0;

  const A = new Spring(REST, { stiffness: 2000, damping: 80 });
  const X = new Spring(1, { stiffness: 2000, damping: 80 });
  const Q = new Spring(0.4, { stiffness: 170, damping: 26 });

  A.onChange((v) => (thumb.style.transform = `translateX(-50%) scale(${v})`));
  X.onChange((v) => (thumb.style.backgroundColor = `rgba(255, 255, 255, ${v})`));
  Q.onChange((v) => (api.refraction = v));
  thumb.style.boxShadow = '0 3px 14px rgba(0, 0, 0, 0.1)';

  const S = () => (forced || n > 0.5 ? 1 : 0);
  const sync = () => {
    const s = S();
    A.set(REST + (ACTIVE - REST) * s);
    X.set(1 - 0.9 * s);
    Q.set((0.4 + 0.5 * s) * userRefr);
  };

  const layout = () => {
    const w = el.clientWidth;
    thumb.style.left = `${PAD + (w - PAD * 2) * val}px`;
    fill.style.width = `${val * 100}%`;
  };
  const setFromX = (clientX) => {
    const r = el.getBoundingClientRect();
    const min = r.left + PAD;
    const max = r.right - PAD;
    val = clamp01((clientX - min) / (max - min));
    layout();
  };

  thumb.addEventListener('pointerdown', (e) => {
    n = 1;
    const tr = thumb.getBoundingClientRect();
    grabOffset = e.clientX - (tr.left + tr.width / 2); // preserve grab point
    sync();
  });
  track.addEventListener('pointerdown', (e) => {
    n = 1;
    grabOffset = 0;
    sync();
    setFromX(e.clientX);
  });
  window.addEventListener('pointermove', (e) => {
    if (n > 0.5) setFromX(e.clientX - grabOffset);
  });
  const release = () => {
    if (n < 0.5) return;
    n = 0;
    sync();
  };
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);
  force.addEventListener('change', () => {
    forced = force.checked;
    sync();
  });
  window.addEventListener('resize', layout);

  bindStateParams('slider', api, (v) => {
    userRefr = v;
    Q.set((0.4 + 0.5 * S()) * userRefr);
  });
  layout();
  sync();
})();

/* ---- Music Player -------------------------------------------------------- */
(function wirePlayer() {
  const bar = document.getElementById('player-el');
  const playBtn = document.getElementById('player-play');
  const progress = document.getElementById('player-progress');
  const api = applyPlayer(bar, {});
  bindPanel('[data-params="player"]', api, fmt4);

  let playing = false;
  let pct = 33;
  let raf = 0;
  let last = 0;
  progress.style.width = `${pct}%`;

  const tick = (t) => {
    if (!playing) return;
    if (last) {
      pct += ((t - last) / 1000) * 4;
      if (pct >= 100) pct = 0;
      progress.style.width = `${pct}%`;
    }
    last = t;
    raf = requestAnimationFrame(tick);
  };

  playBtn.addEventListener('click', () => {
    playing = !playing;
    playBtn.classList.toggle('is-playing', playing);
    playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    if (playing) {
      last = 0;
      raf = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(raf);
    }
  });
})();
