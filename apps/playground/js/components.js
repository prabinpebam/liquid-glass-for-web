/**
 * Component catalogue for the playground gallery.
 *
 * Each entry is rendered twice by js/app.js:
 *   1. In the consolidated overview (display only).
 *   2. As an individual card with its own glass controls.
 *
 * `defaults` are per-component overrides on top of the gallery base settings.
 * `html` must contain exactly one `[data-glass]` element (the glass shell).
 */
export const COMPONENTS = [
  {
    id: 'pill',
    label: 'Capsule button',
    wide: false,
    defaults: { radius: 28, bezel: 18 },
    html: `<div class="glass pill" data-glass>Primary action</div>`,
  },
  {
    id: 'segmented',
    label: 'Segmented control',
    wide: false,
    defaults: { radius: 20, bezel: 16 },
    html: `<div class="glass segmented" data-glass>
      <button class="seg seg--on">Day</button><button class="seg">Week</button><button class="seg">Month</button>
    </div>`,
  },
  {
    id: 'toggle',
    label: 'Toggle',
    wide: false,
    defaults: { radius: 22, bezel: 18 },
    html: `<div class="glass toggle" data-glass role="switch" aria-checked="true"><span class="toggle__knob"></span></div>`,
  },
  {
    id: 'slider',
    label: 'Slider',
    wide: false,
    defaults: { radius: 14, bezel: 12 },
    html: `<div class="glass slider" data-glass><span class="slider__fill"></span><span class="slider__thumb"></span></div>`,
  },
  {
    id: 'searchbar',
    label: 'Search field',
    wide: true,
    defaults: { radius: 22, bezel: 14 },
    html: `<div class="glass searchbar" data-glass><span class="ico ico--search"></span><span class="searchbar__ph">Search</span></div>`,
  },
  {
    id: 'tabbar',
    label: 'Floating tab bar',
    wide: true,
    defaults: { radius: 30, bezel: 16 },
    html: `<nav class="glass tabbar" data-glass>
      <button class="tab tab--on"><span class="ico ico--home"></span>Home</button>
      <button class="tab"><span class="ico ico--search"></span>Search</button>
      <button class="tab"><span class="ico ico--star"></span>Saved</button>
      <button class="tab"><span class="ico ico--user"></span>You</button>
    </nav>`,
  },
  {
    id: 'navbar',
    label: 'Navigation bar',
    wide: true,
    defaults: { radius: 22, bezel: 16 },
    html: `<div class="glass navbar" data-glass>
      <button class="navbar__back"><span class="ico ico--back"></span></button>
      <span class="navbar__title">Library</span>
      <button class="navbar__more"><span class="ico ico--more"></span></button>
    </div>`,
  },
  {
    id: 'menu',
    label: 'Context menu',
    wide: false,
    defaults: { radius: 18, bezel: 12 },
    html: `<div class="glass menu" data-glass>
      <div class="menu__item">Copy</div><div class="menu__item">Share</div>
      <div class="menu__item">Duplicate</div><div class="menu__item menu__item--danger">Delete</div>
    </div>`,
  },
  {
    id: 'widget',
    label: 'Widget card',
    wide: false,
    defaults: { radius: 26, bezel: 20 },
    html: `<div class="glass widget" data-glass>
      <div class="widget__row"><span>Weather</span><span class="widget__big">21&deg;</span></div>
      <div class="widget__sub">Partly cloudy &middot; H:24 L:14</div>
    </div>`,
  },
  {
    id: 'player',
    label: 'Now-playing controls',
    wide: true,
    defaults: { radius: 26, bezel: 18 },
    html: `<div class="glass player" data-glass>
      <div class="player__art"></div>
      <div class="player__meta"><strong>Midnight Drive</strong><span>Neon Highways</span>
        <div class="player__bar"><i></i></div></div>
      <div class="player__ctrls">
        <button class="ico ico--prev"></button><button class="ico ico--pause"></button><button class="ico ico--next"></button>
      </div>
    </div>`,
  },
  {
    id: 'badge',
    label: 'Badge / pill',
    wide: false,
    defaults: { radius: 16, bezel: 14 },
    html: `<div class="glass badge" data-glass>Notifications <b>3</b></div>`,
  },
  {
    id: 'dock',
    label: 'Dock',
    wide: true,
    defaults: { radius: 28, bezel: 16 },
    html: `<div class="glass dock" data-glass>
      <span class="dock__app" style="--c: #ff6b6b"></span>
      <span class="dock__app" style="--c: #4dabf7"></span>
      <span class="dock__app" style="--c: #51cf66"></span>
      <span class="dock__app" style="--c: #ffd43b"></span>
      <span class="dock__app" style="--c: #cc5de8"></span>
    </div>`,
  },
];
