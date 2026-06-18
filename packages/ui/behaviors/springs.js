/**
 * Liquid Glass — physics runtime (the motion system's engine).
 *
 * This is the single, framework-free implementation of the spring physics that
 * every interactive behavior (Switch, Slider, Lens, …) shares. It is the code
 * side of docs/design-library/motion-spec.md: behaviors pick a named spring
 * FAMILY and read the shared ACTIVATION endpoints from tokens, instead of
 * hard-coding stiffness/damping/feel at a call site (MO-1, MO-2, MO-3).
 *
 * Tokens come from tokens/motion.css. Reading them at attach time means motion
 * presets ([data-lg-motion]) and reduced-motion flow through automatically.
 */

/* ----------------------------------------------------------------------------
 * Spring — framer-motion-style `useSpring`: a damped harmonic oscillator
 * integrated with semi-implicit Euler at a fixed sub-step for stability.
 * Set a target; the spring resolves the path and self-stops at rest.
 * ------------------------------------------------------------------------- */
export class Spring {
  /**
   * @param {number} value initial (and target) value
   * @param {{stiffness?:number, damping?:number, mass?:number}} [config]
   */
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

  /** Subscribe to value changes; fires immediately. Returns an unsubscribe fn. */
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

  /** True while the spring is animating. */
  get active() {
    return this._raf !== 0;
  }

  /** Snap instantly to a value (used for reduced motion and initial layout). */
  jump(v) {
    this.value = this.target = v;
    this.velocity = 0;
    if (this._raf) {
      cancelAnimationFrame(this._raf);
      this._raf = 0;
    }
    this._emit();
  }

  /** Animate toward a new target. */
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

/* ----------------------------------------------------------------------------
 * Token bridge — resolve the motion tokens into runtime numbers.
 * ------------------------------------------------------------------------- */

const num = (style, name, fallback) => {
  const raw = style.getPropertyValue(name).trim();
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
};

/** The closed catalog of spring families (motion-spec §4). */
export const SPRING_FAMILIES = ['snap', 'glide', 'settle', 'grab', 'jelly', 'damp'];

/**
 * Resolve a named spring family to its `{stiffness, damping}` from the motion
 * tokens on `root` (defaults to the document element).
 * @param {string} family one of SPRING_FAMILIES (or the legacy 'knob' / 'lens')
 * @param {Element} [root]
 * @returns {{stiffness:number, damping:number}}
 */
export function readSpring(family, root = document.documentElement) {
  if (!SPRING_FAMILIES.includes(family) && family !== 'knob' && family !== 'lens') {
    console.error(`[liquid-glass] unknown spring family "${family}"; pick one of ${SPRING_FAMILIES.join(', ')} (MO-2).`);
    family = 'settle';
  }
  const s = getComputedStyle(root);
  return {
    stiffness: num(s, `--lg-motion-spring-${family}-stiffness`, 170),
    damping: num(s, `--lg-motion-spring-${family}-damping`, 26),
  };
}

/** True when the library is in reduced-motion mode (token-driven, MO-5). */
export function prefersReducedMotion(root = document.documentElement) {
  return num(getComputedStyle(root), '--lg-motion-reduce', 0) >= 1;
}

/**
 * Create a token-bound spring for a named family. Honours reduced motion: when
 * `--lg-motion-reduce` is set, `set()` jumps straight to the target.
 * @param {string} family
 * @param {number} value initial value
 * @param {Element} [root] element to read tokens from (use the attached node's root)
 * @returns {Spring}
 */
export function createSpring(family, value, root = document.documentElement) {
  const spring = new Spring(value, readSpring(family, root));
  if (prefersReducedMotion(root)) {
    const origSet = spring.set.bind(spring);
    spring.set = (target) => spring.jump(target);
    spring._origSet = origSet;
  }
  return spring;
}

/**
 * Read the shared activation endpoints (motion-spec §3) so a behavior can build
 * the resting -> engaged transition without hard-coding values. Per-control
 * scale endpoints are passed in by the caller (instance dimensions, LG-P2).
 * @param {Element} [root]
 */
export function activation(root = document.documentElement) {
  const s = getComputedStyle(root);
  return {
    glassAlphaRest: num(s, '--lg-motion-glass-alpha-rest', 1),
    glassAlphaActive: num(s, '--lg-motion-glass-alpha-active', 0.1),
    refractionRest: num(s, '--lg-motion-refraction-rest', 0.4),
    refractionActive: num(s, '--lg-motion-refraction-active', 0.9),
  };
}

/** Read the velocity / elastic constants (motion-spec §5). */
export function elastics(root = document.documentElement) {
  const s = getComputedStyle(root);
  return {
    squashVelocity: num(s, '--lg-motion-squash-velocity', 5000),
    squashFloor: num(s, '--lg-motion-squash-floor', 0.7),
    velocityRelax: num(s, '--lg-motion-velocity-relax', 0.8),
    rubberBand: num(s, '--lg-motion-rubber-band', 22),
  };
}

/** Linear interpolation helper used by the activation transition. */
export const lerp = (a, b, t) => a + (b - a) * t;
