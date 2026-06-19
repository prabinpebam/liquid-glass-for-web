import type {
  LiquidGlassHandle,
  LiquidGlassOptions,
  ResolvedOptions,
} from './types.js';
import { resolveSurface } from './surface/index.js';
import { buildDisplacementField } from './refraction/displacement-field.js';
import { toDisplacementMap, type MapGeometry } from './maps/displacement-map.js';
import { toSpecularMap } from './maps/specular-map.js';
import { CHROMATIC_SPREAD_RATIO, buildFilter, nextFilterId } from './filter/svg-filter.js';

const DEFAULTS: ResolvedOptions = {
  width: 0,
  height: 0,
  radius: 24,
  bezel: 16,
  thickness: 1.5,
  surface: 'convex',
  scale: 1,
  chromatic: 1,
  blur: 2,
  mode: 'backdrop',
  fallback: 'blur',
  specular: { opacity: 0.4, saturation: 1, angle: -Math.PI / 4 },
};

function resolveOptions(el: HTMLElement, opts: LiquidGlassOptions): ResolvedOptions {
  const rect = el.getBoundingClientRect();
  return {
    ...DEFAULTS,
    ...opts,
    width: opts.width ?? (Math.round(rect.width) || DEFAULTS.width),
    height: opts.height ?? (Math.round(rect.height) || DEFAULTS.height),
    specular: { ...DEFAULTS.specular, ...(opts.specular ?? {}) },
  };
}

/** Lazily-created shared host for all generated `<filter>` defs. */
let defsHost: SVGSVGElement | null = null;
let defsRefs = 0;

function acquireDefs(): SVGDefsElement {
  if (!defsHost) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.position = 'absolute';
    svg.style.width = '0';
    svg.style.height = '0';
    svg.style.overflow = 'hidden';
    svg.style.pointerEvents = 'none';
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svg.appendChild(defs);
    document.body.appendChild(svg);
    defsHost = svg;
  }
  defsRefs++;
  return defsHost.querySelector('defs')!;
}

function releaseDefs(): void {
  defsRefs = Math.max(0, defsRefs - 1);
  if (defsRefs === 0 && defsHost) {
    defsHost.remove();
    defsHost = null;
  }
}

function supportsBackdropFilterUrl(): boolean {
  if (typeof CSS === 'undefined' || !CSS.supports) return false;
  return (
    CSS.supports('backdrop-filter', 'url(#x)') ||
    CSS.supports('-webkit-backdrop-filter', 'url(#x)')
  );
}

/**
 * Apply a liquid-glass refraction effect to `el`.
 *
 * Orchestrates the documented pipeline (surface → displacement field →
 * displacement/specular maps → SVG filter → CSS apply) and returns a handle for
 * live updates, cheap scale tweaks, and disposal.
 *
 * See ../../docs/architecture.md.
 */
export function liquidGlass(el: HTMLElement, options: LiquidGlassOptions = {}): LiquidGlassHandle {
  if (typeof document === 'undefined') {
    throw new Error('liquid-glass: liquidGlass() requires a DOM');
  }

  const defs = acquireDefs();
  const filterId = nextFilterId();
  let resolved = resolveOptions(el, options);
  let currentScale = resolved.scale;
  let filterEl: SVGFilterElement | null = null;
  let disposed = false;

  function effectiveMode(): 'filter' | 'backdrop' {
    if (resolved.mode === 'backdrop' && !supportsBackdropFilterUrl()) {
      return resolved.fallback === 'blur' ? 'backdrop' : 'filter';
    }
    return resolved.mode;
  }

  function applyCss(): void {
    const mode = effectiveMode();
    const ref = `url(#${filterId})`;
    if (mode === 'backdrop') {
      if (supportsBackdropFilterUrl()) {
        el.style.backdropFilter = ref;
        (el.style as unknown as Record<string, string>)['webkitBackdropFilter'] = ref;
      } else if (resolved.fallback === 'blur') {
        const blur = `blur(${resolved.blur}px)`;
        el.style.backdropFilter = blur;
        (el.style as unknown as Record<string, string>)['webkitBackdropFilter'] = blur;
      }
    } else {
      el.style.filter = ref;
    }
  }

  function rebuild(): void {
    if (disposed) return;
    const surface = resolveSurface(resolved.surface);
    const field = buildDisplacementField(surface, resolved.bezel, resolved.thickness);

    const geo: MapGeometry = {
      width: resolved.width,
      height: resolved.height,
      radius: resolved.radius,
      bezel: resolved.bezel,
    };
    if (geo.width <= 0 || geo.height <= 0) return; // not measurable yet

    const displacement = toDisplacementMap(field, geo);
    const specular =
      resolved.specular.opacity > 0 ? toSpecularMap(field, geo, resolved.specular) : null;

    const next = buildFilter({
      id: filterId,
      width: geo.width,
      height: geo.height,
      displacement,
      specular,
      scale: field.maxDisplacement * currentScale,
      chromatic: resolved.chromatic,
      blur: resolved.blur,
    });

    if (filterEl) filterEl.replaceWith(next);
    else defs.appendChild(next);
    filterEl = next;
    applyCss();
  }

  // Auto-resize: rebuild maps when the element's box changes.
  const ro = new ResizeObserver(() => {
    if (disposed) return;
    const rect = el.getBoundingClientRect();
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    if (w !== resolved.width || h !== resolved.height) {
      resolved = { ...resolved, width: w, height: h };
      rebuild();
    }
  });
  ro.observe(el);

  rebuild();

  return {
    update(partial) {
      if (disposed) return;
      resolved = { ...resolved, ...partial, specular: { ...resolved.specular, ...(partial.specular ?? {}) } };
      currentScale = resolved.scale;
      rebuild();
    },
    setScale(scale) {
      if (disposed || !filterEl) return;
      currentScale = scale;
      const field = buildDisplacementField(
        resolveSurface(resolved.surface),
        resolved.bezel,
        resolved.thickness,
      );
      setFilterDisplacementScale(filterEl, field.maxDisplacement * scale, resolved.chromatic);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      ro.disconnect();
      filterEl?.remove();
      filterEl = null;
      el.style.filter = '';
      el.style.backdropFilter = '';
      (el.style as unknown as Record<string, string>)['webkitBackdropFilter'] = '';
      releaseDefs();
    },
  };
}

function setFilterDisplacementScale(filterEl: SVGFilterElement, scale: number, chromatic: number): void {
  const spread = Math.abs(scale) * CHROMATIC_SPREAD_RATIO * Math.max(0, chromatic);
  const r = filterEl.querySelector('feDisplacementMap[data-lg-channel="r"]');
  const g = filterEl.querySelector('feDisplacementMap[data-lg-channel="g"]');
  const b = filterEl.querySelector('feDisplacementMap[data-lg-channel="b"]');
  if (r && g && b) {
    r.setAttribute('scale', String(Math.max(0, scale - spread)));
    g.setAttribute('scale', String(scale));
    b.setAttribute('scale', String(scale + spread));
    return;
  }

  const base = filterEl.querySelector('feDisplacementMap[data-lg-channel="base"]') ??
    filterEl.querySelector('feDisplacementMap');
  base?.setAttribute('scale', String(scale));
}
