/**
 * @liquid-glass/ui — token-driven, layered design library for liquid glass.
 *
 * Built on top of @liquid-glass/core. See:
 *   - ../../docs/design-library/design-spec.md
 *   - ../../docs/design-library/architecture-spec.md
 *
 * Single default export, mirroring the layered structure:
 *   primitives  — shared building blocks (el, icon)
 *   factories   — every create* by name (L1–L4)
 *   material    — tokens → engine binder
 *   personalization — token-override helpers on :root
 */
import manifest from './library.manifest.json' assert { type: 'json' };

import { el, icon, bind, unbind, bindWhenConnected, refresh, refreshAll } from './core/index.js';

// L1 atoms
import { createSurface } from './atoms/surface/surface.js';
import { createText } from './atoms/text/text.js';
import { createIcon } from './atoms/icon/icon.js';

// L2 components
import { createButton } from './components/button/button.js';
import { createToggle } from './components/toggle/toggle.js';

// L3 compounds
import { createSearchbar } from './compound/searchbar/searchbar.js';

// Physics runtime (the motion system's engine; see motion-spec.md)
import { Spring, createSpring, readSpring, activation, elastics, prefersReducedMotion } from './behaviors/springs.js';

// Interaction behaviors (LG-P12): attached to rendered nodes, never in factories.
import { attachToggle } from './behaviors/toggle.js';

const root = () => document.documentElement;

/** Apply a named theme (token overrides on a target; default :root, subtree-capable). */
function applyTheme(mode = 'dark', target = root()) { target.setAttribute('data-lg-theme', mode); refreshAll(); }

/** Apply a density mode (re-points spacing / control-height tokens). */
function applyDensity(mode = 'comfortable', target = root()) { target.setAttribute('data-lg-density', mode); refreshAll(); }

/** Turn glass transparency on/off (re-points tint/blur tokens to solid). */
function applyTransparency(on = true, target = root()) {
  target.setAttribute('data-lg-transparency', on ? 'on' : 'off');
  refreshAll();
}

/** Toggle the high-contrast accessibility mode (opaque surfaces, LG-P9). */
function applyContrast(high = false, target = root()) {
  target.setAttribute('data-lg-contrast', high ? 'high' : 'normal');
  refreshAll();
}

/** Select a global motion preset (closed set, retunes durations + springs together). */
function applyMotion(preset = 'default', target = root()) {
  if (preset === 'default') target.removeAttribute('data-lg-motion');
  else target.setAttribute('data-lg-motion', preset);
}

/** Set the accent color; writes the derived ramp onto the target's tokens. */
function applyAccent(hex, target = root()) {
  const s = target.style;
  s.setProperty('--lg-color-accent', hex);
  s.setProperty('--lg-color-accent-hover', mix(hex, '#ffffff', 0.18));
  s.setProperty('--lg-color-accent-pressed', mix(hex, '#000000', 0.14));
}

/** Tiny hex mix helper for the accent ramp. */
function mix(hex, with_, t) {
  const a = parse(hex), b = parse(with_);
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}
function parse(hex) {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

export default {
  manifest,
  primitives: { el, icon },
  factories: {
    surface: createSurface,
    text: createText,
    icon: createIcon,
    button: createButton,
    toggle: createToggle,
    searchbar: createSearchbar,
  },
  material: { bind, unbind, bindWhenConnected, refresh, refreshAll },
  motion: { Spring, createSpring, readSpring, activation, elastics, prefersReducedMotion },
  behaviors: { attachToggle },
  personalization: { applyTheme, applyDensity, applyTransparency, applyContrast, applyAccent, applyMotion },
};
