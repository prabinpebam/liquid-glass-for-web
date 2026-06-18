import {
  liquidGlass,
  type LiquidGlassHandle,
  type LiquidGlassOptions,
  type SurfaceKind,
} from '@liquid-glass/core';

const NUMERIC_ATTRS = ['radius', 'bezel', 'thickness', 'scale', 'blur'] as const;

/**
 * `<liquid-glass>` custom element. Wraps slotted content and applies the
 * refraction effect, reflecting numeric/string attributes to engine options.
 *
 * ```html
 * <liquid-glass radius="24" bezel="16" surface="convex">Frosted</liquid-glass>
 * ```
 *
 * See ../../../docs/getting-started.md.
 */
export class LiquidGlassElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return [...NUMERIC_ATTRS, 'surface', 'mode', 'fallback'];
  }

  #handle: LiquidGlassHandle | null = null;

  connectedCallback(): void {
    this.#handle = liquidGlass(this, this.#readOptions());
  }

  disconnectedCallback(): void {
    this.#handle?.dispose();
    this.#handle = null;
  }

  attributeChangedCallback(): void {
    this.#handle?.update(this.#readOptions());
  }

  #readOptions(): LiquidGlassOptions {
    const opts: LiquidGlassOptions = {};
    for (const attr of NUMERIC_ATTRS) {
      const raw = this.getAttribute(attr);
      if (raw !== null) (opts as Record<string, unknown>)[attr] = Number(raw);
    }
    const surface = this.getAttribute('surface');
    if (surface) opts.surface = surface as SurfaceKind;
    const mode = this.getAttribute('mode');
    if (mode === 'filter' || mode === 'backdrop') opts.mode = mode;
    const fallback = this.getAttribute('fallback');
    if (fallback === 'blur' || fallback === 'none') opts.fallback = fallback;
    return opts;
  }
}

/** Register `<liquid-glass>` (idempotent). */
export function defineLiquidGlassElement(tag = 'liquid-glass'): void {
  if (typeof customElements === 'undefined') return;
  if (!customElements.get(tag)) customElements.define(tag, LiquidGlassElement);
}
