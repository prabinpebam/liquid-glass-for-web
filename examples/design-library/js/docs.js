/* ============================================================================
   Liquid Glass — Design Library docs.
   Renders the component inventory into a navigable explorer and wires the
   interactions: scrollspy, search filtering, theme + motion toggles, mobile nav.
   The INVENTORY data mirrors docs/design-library/component-inventory.md.

   Interactive parts are mounted as REAL liquid-glass components (components.js):
   they refract the patterned backdrop and animate with spring physics. Icons
   come from Font Awesome. Remaining catalog parts use lightweight CSS mocks.
   ========================================================================== */
import { MOUNTS, glassLens } from './components.js';

/* --- preview mocks: id -> HTML string (pure CSS visuals, no engine needed) - */
const DEMOS = {
  // foundations
  color: `<div class="pv-colors"><span style="background:#dfe7f5"></span><span style="background:#9db4d8"></span><span style="background:#4dabf7"></span><span style="background:#1f6fd6"></span><span style="background:#14306a"></span></div>`,
  type: `<div class="pv-type"><b style="font-size:26px">Aa</b><b style="font-size:18px">Aa</b><b style="font-size:13px;color:var(--d-ink-dim)">Caption</b></div>`,
  space: `<div class="pv-space"><span style="height:10px"></span><span style="height:18px"></span><span style="height:28px"></span><span style="height:40px"></span></div>`,
  radius: `<div class="pv-radii"><span style="border-radius:4px"></span><span style="border-radius:10px"></span><span style="border-radius:18px"></span><span style="border-radius:50%"></span></div>`,
  elevation: `<div class="pv-elev"><span></span><span></span><span></span></div>`,
  motion: `<div class="pv-motion"><span></span><span></span><span></span></div>`,

  // atoms / elements
  surface: `<div style="width:120px;height:74px;border-radius:18px;background:var(--d-glass-2);border:1px solid var(--d-glass-stroke);box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 10px 30px rgba(0,0,0,.3);backdrop-filter:blur(8px)"></div>`,
  text: `<div class="pv-type"><b style="font-size:20px">The quick fox</b><span style="font-size:12px;color:var(--d-ink-dim)">body · label · caption</span></div>`,
  icon: `<div class="pv-row pv-icons" style="color:var(--d-ink)">${ic('magnifying-glass')}${ic('cube')}${ic('plus')}${ic('gear')}${ic('bell')}</div>`,
  divider: `<div style="width:160px;display:grid;gap:10px"><div style="height:1px;background:var(--d-line-strong)"></div><div style="height:1px;background:var(--d-line)"></div></div>`,
  badge: `<div class="pv-badge"><div class="pv-badge__dot">9+</div>${ic('bell')}</div>`,
  avatar: `<div class="pv-avatar">LG</div>`,
  spinner: `<div class="pv-spinner"></div>`,
  progressRing: `<svg width="44" height="44" viewBox="0 0 44 44"><circle cx="22" cy="22" r="18" fill="none" stroke="var(--d-line-strong)" stroke-width="4"/><circle cx="22" cy="22" r="18" fill="none" stroke="var(--d-accent)" stroke-width="4" stroke-linecap="round" stroke-dasharray="113" stroke-dashoffset="38" transform="rotate(-90 22 22)"/></svg>`,
  skeleton: `<div class="pv-skel"><div class="pv-skel__line"></div><div class="pv-skel__line"></div><div class="pv-skel__line"></div></div>`,
  tag: `<div class="pv-row"><span class="pv-tag">Design <span class="pv-tag__x">×</span></span><span class="pv-tag">Glass <span class="pv-tag__x">×</span></span></div>`,
  image: `<div style="width:120px;height:74px;border-radius:12px;background:linear-gradient(135deg,#74c0fc,#4d7cff 60%,#c14dff)"></div>`,
  link: `<span style="color:var(--d-accent-strong);text-decoration:underline;text-underline-offset:3px;font-weight:600">Learn more →</span>`,
  progress: `<div class="pv-progress"><div class="pv-progress__fill"></div></div>`,

  button: `<div class="pv-row"><span class="pv-btn pv-btn--accent">Primary</span><span class="pv-btn">Default</span><span class="pv-btn pv-btn--ghost">Ghost</span></div>`,
  iconButton: `<div class="pv-row"><span class="pv-iconbtn">${ic('plus')}</span><span class="pv-iconbtn">${ic('minus')}</span></div>`,
  fab: `<div class="pv-fab">+</div>`,
  closeButton: `<span class="pv-iconbtn">${ic('xmark')}</span>`,
  input: `<div class="pv-col"><div class="pv-input pv-input--focus">Jane Appleseed</div><div class="pv-input">Placeholder…</div></div>`,
  search: `<div class="pv-input" style="border-radius:999px">${ic('magnifying-glass')} Search…</div>`,
  textarea: `<div class="pv-input" style="height:64px;align-items:flex-start;padding-top:10px;width:200px">Multi-line text…</div>`,
  checkbox: `<div class="pv-row"><span class="pv-check">${ic('check')}</span><span style="width:22px;height:22px;border-radius:7px;border:2px solid var(--d-line-strong)"></span></div>`,
  radio: `<div class="pv-row"><span class="pv-radio"></span><span class="pv-radio pv-radio--off"></span></div>`,
  toggle: `<div class="pv-row"><span class="pv-switch"></span><span class="pv-switch pv-switch--off"></span></div>`,
  slider: `<div class="pv-slider"><div class="pv-slider__fill"></div><div class="pv-slider__thumb"></div></div>`,
  segmented: `<div class="pv-seg"><span class="is-on">Day</span><span>Week</span><span>Month</span></div>`,
  rating: `<div class="pv-row" style="gap:3px;color:#ffd43b">${ic('star')}${ic('star')}${ic('star')}<span style="color:var(--d-line-strong)">${ic('star')}</span></div>`,
  otp: `<div class="pv-row" style="gap:6px">${'<span class="pv-input" style="width:34px;justify-content:center;padding:0">5</span>'.repeat(2)}<span class="pv-input" style="width:34px;justify-content:center;padding:0;border-color:var(--d-accent)">|</span><span class="pv-input" style="width:34px;justify-content:center;padding:0"></span></div>`,

  // components
  formField: `<div class="pv-col" style="justify-items:start;gap:6px"><span style="font-size:12px;color:var(--d-ink-dim)">Email</span><div class="pv-input pv-input--focus">jane@studio.co</div><span style="font-size:11px;color:var(--d-ink-faint)">We'll never share it.</span></div>`,
  tabs: `<div class="pv-tabs"><div class="pv-tabs__row"><span class="pv-tabs__t is-on">Overview</span><span class="pv-tabs__t">Specs</span><span class="pv-tabs__t">Usage</span></div></div>`,
  accordion: `<div class="pv-accordion"><div class="pv-accordion__row"><span>Getting started</span><span>−</span></div><div class="pv-accordion__row"><span>Theming</span><span>+</span></div></div>`,
  breadcrumb: `<div class="pv-breadcrumb">Home <i>/</i> Components <i>/</i> <b>Button</b></div>`,
  pagination: `<div class="pv-pagination"><span>1</span><span class="is-on">2</span><span>3</span><span>…</span><span>9</span></div>`,
  menu: `<div class="pv-menu"><div class="pv-menu__i is-on">Duplicate</div><div class="pv-menu__i">Rename</div><div class="pv-menu__i">Delete</div></div>`,
  tooltip: `<div class="pv-tooltip">Copied to clipboard</div>`,
  alert: `<div class="pv-alert"><span class="pv-alert__dot">✓</span><div><b style="font-size:12.5px">Saved</b><div style="color:var(--d-ink-dim)">Changes are live.</div></div></div>`,
  toast: `<div class="pv-alert" style="border-left-color:var(--d-accent)"><span class="pv-alert__dot" style="background:var(--d-accent)">i</span><div>New version available</div></div>`,
  card: `<div class="pv-card"><div class="pv-card__media"></div><div class="pv-card__body"><div class="pv-card__t">Glass Card</div><div class="pv-card__d">A surface with content.</div></div></div>`,
  stat: `<div class="pv-stat"><div class="pv-stat__l">Revenue</div><div class="pv-stat__n">$48.2k</div><div class="pv-stat__d">▲ 12.4%</div></div>`,
  avatarGroup: `<div class="pv-avatars"><div class="pv-avatar">A</div><div class="pv-avatar">B</div><div class="pv-avatar">C</div><div class="pv-avatar pv-avatar--more">+5</div></div>`,
  table: `<div class="pv-table"><div class="pv-table__r pv-table__r--h"><span>Name</span><span>Role</span></div><div class="pv-table__r"><span>Jane A.</span><span>Owner</span></div><div class="pv-table__r"><span>Milo K.</span><span>Editor</span></div></div>`,
  list: `<div class="pv-menu" style="box-shadow:none"><div class="pv-menu__i" style="display:flex;gap:8px;align-items:center"><span class="pv-avatar" style="width:24px;height:24px;font-size:10px">1</span> Inbox</div><div class="pv-menu__i" style="display:flex;gap:8px;align-items:center"><span class="pv-avatar" style="width:24px;height:24px;font-size:10px">2</span> Drafts</div></div>`,
  timeline: `<div class="pv-col" style="justify-items:start;gap:0;padding-left:6px;border-left:2px solid var(--d-line-strong)">${['Created','Reviewed','Shipped'].map((t,i)=>`<div style="display:flex;gap:8px;align-items:center;padding:5px 0;margin-left:-7px"><span style="width:10px;height:10px;border-radius:50%;background:${i===2?'var(--d-accent)':'var(--d-line-strong)'}"></span><span style="font-size:12.5px;color:var(--d-ink-dim)">${t}</span></div>`).join('')}</div>`,
  emptyState: `<div class="placeholder"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="5" width="16" height="14" rx="2"/><path d="M4 9h16"/></svg><span>No items yet</span></div>`,
  filterChips: `<div class="pv-row"><span class="pv-tag" style="background:var(--d-accent);color:#fff;border-color:transparent">Active</span><span class="pv-tag">Archived</span><span class="pv-tag">Draft</span></div>`,

  // compounds
  navbar: `<div class="pv-navbar"><span class="pv-navbar__dot"></span><span style="font-size:12px;font-weight:600">Studio</span><span class="pv-navbar__sp"></span><span class="pv-navbar__pill"></span></div>`,
  sidebarNav: `<div class="pv-menu" style="width:130px"><div class="pv-menu__i is-on">Dashboard</div><div class="pv-menu__i">Projects</div><div class="pv-menu__i">Settings</div></div>`,
  modal: `<div class="pv-modal"><div class="pv-modal__t">Delete project?</div><div class="pv-modal__d">This action can't be undone.</div><div class="pv-modal__row"><span class="pv-modal__btn">Cancel</span><span class="pv-modal__btn pv-modal__btn--p">Delete</span></div></div>`,
  commandPalette: `<div class="pv-menu" style="width:190px"><div class="pv-input" style="width:auto;margin-bottom:4px">${ic('magnifying-glass')} Type a command…</div><div class="pv-menu__i is-on">→ New file</div><div class="pv-menu__i">→ Open settings</div></div>`,
  dataTable: `<div class="pv-table" style="width:220px"><div class="pv-table__r pv-table__r--h"><span>Invoice</span><span>Status</span></div><div class="pv-table__r"><span>#1024</span><span style="color:#51cf66">Paid</span></div><div class="pv-table__r"><span>#1025</span><span style="color:#ffd43b">Due</span></div></div>`,
  datePicker: `<div class="pv-modal" style="width:170px"><div style="display:flex;justify-content:space-between;font-size:12px;color:var(--d-ink-dim);margin-bottom:6px"><span>June 2026</span><span>‹ ›</span></div><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;font-size:10px;text-align:center">${Array.from({length:21},(_,i)=>`<span style="padding:3px 0;border-radius:5px;${i===12?'background:var(--d-accent);color:#fff':''}">${i+1}</span>`).join('')}</div></div>`,
  chatThread: `<div class="pv-col" style="gap:8px;align-items:stretch;width:200px"><span style="align-self:flex-start;max-width:75%;padding:8px 12px;border-radius:14px 14px 14px 4px;background:var(--d-glass-2);border:1px solid var(--d-glass-stroke);font-size:12.5px">Ready to ship?</span><span style="align-self:flex-end;max-width:75%;padding:8px 12px;border-radius:14px 14px 4px 14px;background:linear-gradient(180deg,#5cb8ff,#4d7cff);color:#fff;font-size:12.5px">Shipping now 🚀</span></div>`,
  mediaPlayer: `<div class="pv-navbar" style="height:48px"><span class="pv-iconbtn" style="width:30px;height:30px;background:var(--d-accent);color:#fff;border:0">▶</span><div class="pv-progress" style="flex:1;width:auto"><div class="pv-progress__fill" style="width:40%"></div></div><span style="font-size:11px;color:var(--d-ink-dim)">1:24</span></div>`,
  pricingTable: `<div class="pv-row" style="gap:8px">${['Free','Pro'].map((t,i)=>`<div class="pv-card" style="width:84px"><div class="pv-card__body" style="text-align:center"><div class="pv-card__t">${t}</div><div class="pv-stat__n" style="font-size:20px">$${i*12}</div></div></div>`).join('')}</div>`,
  kanban: `<div class="pv-row" style="gap:8px;align-items:flex-start">${['To do','Doing'].map(t=>`<div style="width:84px;display:grid;gap:6px"><span style="font-size:10px;color:var(--d-ink-faint);text-transform:uppercase;letter-spacing:.08em">${t}</span><span style="height:24px;border-radius:7px;background:var(--d-glass-2);border:1px solid var(--d-glass-stroke)"></span><span style="height:24px;border-radius:7px;background:var(--d-glass-2);border:1px solid var(--d-glass-stroke)"></span></div>`).join('')}</div>`,
  productCard: `<div class="pv-card"><div class="pv-card__media" style="background:linear-gradient(135deg,#ffa8a8,#ff5470)"></div><div class="pv-card__body"><div class="pv-card__t">Aurora Lamp</div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px"><b style="font-size:14px">$129</b><span class="pv-btn pv-btn--accent" style="height:28px;padding:0 12px;font-size:12px">Add</span></div></div></div>`,
  authForm: `<div class="pv-modal" style="width:180px"><div class="pv-modal__t" style="text-align:center;margin-bottom:10px">Sign in</div><div class="pv-input" style="width:auto;margin-bottom:8px">Email</div><div class="pv-input" style="width:auto;margin-bottom:10px">••••••••</div><span class="pv-btn pv-btn--accent" style="width:100%;justify-content:center">Continue</span></div>`,
  fileUploader: `<div style="width:190px;height:80px;border-radius:12px;border:2px dashed var(--d-line-strong);display:grid;place-items:center;color:var(--d-ink-dim);font-size:12.5px;gap:6px">${ic('cloud-arrow-up')}<span>Drop files here</span></div>`,
  toolbar: `<div class="pv-seg"><span class="pv-iconbtn" style="width:30px;height:30px;background:transparent;border:0"><b>B</b></span><span class="pv-iconbtn" style="width:30px;height:30px;background:transparent;border:0"><i>I</i></span><span class="pv-iconbtn" style="width:30px;height:30px;background:var(--d-glass-2);border:0"><u>U</u></span></div>`,

  // layouts
  appShell: layoutMock([['head','span 2'],['side','1'],['main','1']]),
  grid: `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;width:150px">${'<span style="height:30px;border-radius:6px;background:var(--d-glass-2);border:1px solid var(--d-glass-stroke)"></span>'.repeat(6)}</div>`,
  stack: `<div class="pv-col" style="gap:6px;width:120px">${'<span style="height:20px;width:100%;border-radius:6px;background:var(--d-glass-2);border:1px solid var(--d-glass-stroke)"></span>'.repeat(3)}</div>`,
  splitView: `<div style="display:grid;grid-template-columns:90px 1fr;gap:6px;width:170px;height:80px"><div style="border-radius:8px;background:var(--d-glass-2);border:1px solid var(--d-glass-stroke)"></div><div style="border-radius:8px;background:var(--d-glass);border:1px solid var(--d-glass-stroke)"></div></div>`,
  dashboard: `<div style="display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:32px;gap:6px;width:160px"><span style="grid-column:span 2;border-radius:7px;background:var(--d-glass-2);border:1px solid var(--d-glass-stroke)"></span><span style="border-radius:7px;background:var(--d-glass-2);border:1px solid var(--d-glass-stroke)"></span><span style="border-radius:7px;background:var(--d-glass-2);border:1px solid var(--d-glass-stroke)"></span></div>`,
  hero: `<div style="width:180px;text-align:center;display:grid;gap:6px;justify-items:center"><b style="font-size:18px;letter-spacing:-.02em">Build in glass</b><span style="font-size:11px;color:var(--d-ink-dim)">A landing hero section</span><span class="pv-btn pv-btn--accent" style="height:28px;font-size:12px">Get started</span></div>`,
  authLayout: `<div style="width:170px;height:84px;border-radius:10px;display:grid;place-items:center;background:radial-gradient(circle at 50% 0,rgba(77,124,255,.3),transparent)"><div class="pv-card" style="width:110px"><div class="pv-card__body" style="text-align:center"><div class="pv-card__t">Welcome</div></div></div></div>`,

  // foundations (extra)
  sizing: `<div class="pv-row" style="align-items:flex-end;gap:8px">${[20,26,32,40].map(s=>`<span style="width:30px;height:${s}px;border-radius:7px;background:var(--d-glass-2);border:1px solid var(--d-glass-stroke)"></span>`).join('')}</div>`,
  zindex: `<div style="position:relative;width:120px;height:70px">${[0,1,2].map(i=>`<span style="position:absolute;left:${i*22}px;top:${i*14}px;width:64px;height:40px;border-radius:9px;background:var(--d-glass);border:1px solid var(--d-glass-stroke);box-shadow:0 8px 22px rgba(0,0,0,.28)"></span>`).join('')}</div>`,
  semantic: `<div class="pv-input pv-input--focus" style="box-shadow:0 0 0 3px rgba(77,124,255,.45)">Focused control</div>`,
  breakpoints: `<div class="pv-row" style="align-items:flex-end;gap:6px;color:var(--d-ink-faint);font-size:9px">${[['sm',26],['md',40],['lg',56],['xl',72]].map(([l,w])=>`<div style="display:grid;justify-items:center;gap:3px"><span style="width:${w}px;height:30px;border-radius:6px;background:var(--d-glass-2);border:1px solid var(--d-glass-stroke)"></span>${l}</div>`).join('')}</div>`,
  opacity: `<div class="pv-row" style="gap:6px">${[1,.7,.4,.18].map(o=>`<span style="width:30px;height:30px;border-radius:8px;background:rgba(77,124,255,${o})"></span>`).join('')}</div>`,

  // atoms (extra)
  box: `<div style="width:120px;height:70px;border-radius:12px;background:var(--d-glass-2);border:1px solid var(--d-glass-stroke);display:grid;place-items:center;color:var(--d-ink-faint);font-size:11px">Box</div>`,
  aspectRatio: `<div style="width:128px;aspect-ratio:16/9;border-radius:10px;background:linear-gradient(135deg,#74c0fc,#4d7cff);display:grid;place-items:center;color:#fff;font-size:11px;font-weight:600">16 : 9</div>`,
  scrim: `<div style="position:relative;width:130px;height:74px;border-radius:11px;overflow:hidden;background:linear-gradient(135deg,#74c0fc,#c14dff)"><div style="position:absolute;inset:0;background:rgba(8,12,24,.5)"></div><div style="position:absolute;inset:0;display:grid;place-items:center;color:#fff;font-size:11px">Scrim</div></div>`,
  heading: `<div class="pv-col" style="gap:3px;justify-items:start"><b style="font-size:22px;letter-spacing:-.02em">Heading 1</b><b style="font-size:16px">Heading 2</b><b style="font-size:13px;color:var(--d-ink-dim)">Heading 3</b></div>`,
  code: `<span style="font-family:ui-monospace,Menlo,monospace;font-size:12.5px;background:var(--d-glass-2);border:1px solid var(--d-glass-stroke);border-radius:6px;padding:4px 8px;color:var(--d-accent-strong)">attachGlass(el)</span>`,
  kbd: `<div class="pv-row" style="gap:5px">${['⌘','K'].map(k=>`<span style="min-width:24px;height:26px;display:grid;place-items:center;border-radius:7px;background:var(--d-glass-2);border:1px solid var(--d-line-strong);box-shadow:0 2px 0 var(--d-line-strong);font-size:12px;font-weight:600">${k}</span>`).join('')}</div>`,
  truncate: `<div style="width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12.5px;color:var(--d-ink-dim)">This single line of text is clamped with an ellipsis…</div>`,
  visuallyHidden: `<div class="pv-col" style="gap:6px;justify-items:center"><span class="pv-iconbtn">${ic('cart-shopping')}</span><span style="font-size:10px;color:var(--d-ink-faint)">label: “Cart, 3 items”</span></div>`,
  skipLink: `<span class="pv-btn pv-btn--accent" style="height:30px;font-size:12px">Skip to content</span>`,

  // layouts (extra)
  cluster: `<div class="pv-row" style="flex-wrap:wrap;gap:5px;width:150px;justify-content:flex-start">${['Glass','Motion','Design','UI','Rim','Bezel'].map(t=>`<span class="pv-tag">${t}</span>`).join('')}</div>`,
  center: `<div style="width:150px;height:78px;border-radius:10px;border:1px dashed var(--d-line-strong);display:grid;place-items:center"><span style="width:80px;height:40px;border-radius:8px;background:var(--d-glass-2);border:1px solid var(--d-glass-stroke)"></span></div>`,
  container: `<div style="width:160px;display:grid;gap:5px;justify-items:center"><span style="width:120px;height:14px;border-radius:5px;background:var(--d-glass-2);border:1px solid var(--d-glass-stroke)"></span><span style="width:120px;height:34px;border-radius:7px;background:var(--d-glass);border:1px solid var(--d-glass-stroke)"></span><span style="width:120px;height:14px;border-radius:5px;background:var(--d-glass-2);border:1px solid var(--d-glass-stroke)"></span></div>`,
  settingsLayout: `<div style="display:grid;grid-template-columns:60px 1fr;gap:6px;width:170px;height:80px"><div style="display:grid;gap:4px">${'<span style="height:14px;border-radius:5px;background:var(--d-glass-2);border:1px solid var(--d-glass-stroke)"></span>'.repeat(4)}</div><div style="border-radius:8px;background:var(--d-glass);border:1px solid var(--d-glass-stroke)"></div></div>`,
  threeColumn: `<div style="display:grid;grid-template-columns:44px 1fr 44px;gap:5px;width:170px;height:80px">${'<div style="border-radius:7px;background:var(--d-glass-2);border:1px solid var(--d-glass-stroke)"></div>'.repeat(1)}<div style="border-radius:7px;background:var(--d-glass);border:1px solid var(--d-glass-stroke)"></div><div style="border-radius:7px;background:var(--d-glass-2);border:1px solid var(--d-glass-stroke)"></div></div>`,
  pricingPage: `<div class="pv-row" style="gap:6px;align-items:stretch">${['Free','Pro','Max'].map((t,i)=>`<div class="pv-card" style="width:58px;${i===1?'outline:2px solid var(--d-accent)':''}"><div class="pv-card__body" style="text-align:center;padding:8px 6px"><div style="font-size:10px;color:var(--d-ink-dim)">${t}</div><b style="font-size:14px">$${i*9}</b></div></div>`).join('')}</div>`,
  docsPage: `<div style="display:grid;grid-template-columns:42px 1fr 32px;gap:6px;width:175px;height:80px"><div style="display:grid;gap:3px">${'<span style="height:9px;border-radius:4px;background:var(--d-glass-2)"></span>'.repeat(5)}</div><div style="display:grid;gap:5px;align-content:start"><span style="height:12px;width:70%;border-radius:5px;background:var(--d-line-strong)"></span>${'<span style="height:7px;border-radius:4px;background:var(--d-glass-2)"></span>'.repeat(4)}</div><div style="display:grid;gap:3px">${'<span style="height:7px;border-radius:4px;background:var(--d-glass-2)"></span>'.repeat(3)}</div></div>`,
  errorPage: `<div style="width:160px;text-align:center;display:grid;gap:4px;justify-items:center"><b style="font-size:30px;letter-spacing:-.03em">404</b><span style="font-size:11px;color:var(--d-ink-dim)">Page not found</span><span class="pv-btn pv-btn--accent" style="height:26px;font-size:11px">Go home</span></div>`,
};

function ic(name) {
  return `<i class="fa-solid fa-${name}" aria-hidden="true"></i>`;
}
function layoutMock() {
  return `<div style="width:160px;height:84px;display:grid;grid-template-columns:46px 1fr;grid-template-rows:24px 1fr;gap:5px"><span style="grid-column:span 2;border-radius:6px;background:var(--d-glass-2);border:1px solid var(--d-glass-stroke)"></span><span style="border-radius:6px;background:var(--d-glass-2);border:1px solid var(--d-glass-stroke)"></span><span style="border-radius:6px;background:var(--d-glass);border:1px solid var(--d-glass-stroke)"></span></div>`;
}

/* ---------------------------------- inventory data ------------------------ */
/* item = [name, status, purpose, demoKey?]   status: 'built' | 'planned'     */
const INVENTORY = [
  {
    id: 'foundations', label: 'Foundations', layer: 'L0',
    blurb: 'Tokens only — the values every other tier consumes. No markup.',
    groups: [
      { label: 'Core scales', items: [
        ['Color', 'built', 'Neutral + accent ramps and status colors.', 'color'],
        ['Typography', 'built', 'Font families, weights and the type scale.', 'type'],
        ['Spacing', 'built', '4px-based spacing scale.', 'space'],
        ['Sizing', 'built', 'Control heights, icon sizes, stroke widths.', 'sizing'],
        ['Radius', 'built', 'Corner radii including pill.', 'radius'],
        ['Elevation', 'built', 'Shadow scale rest → raised → lifted.', 'elevation'],
      ]},
      { label: 'Material & motion', items: [
        ['Glass / material', 'built', 'Transparent and frosted surfaces with per-material controls.', 'materialLab'],
        ['Motion', 'built', 'Durations, easings, spring families, presets.', 'motion'],
        ['Z-index', 'built', 'Stacking scale base → toast.', 'zindex'],
        ['Semantic', 'built', 'Control height/padding, focus ring defaults.', 'semantic'],
        ['Breakpoints', 'built', 'Responsive thresholds + container queries.', 'breakpoints'],
        ['Opacity / state', 'built', 'Hover / pressed / disabled / selected.', 'opacity'],
      ]},
    ],
  },
  {
    id: 'atoms', label: 'Atoms', layer: 'L1',
    blurb: 'Indivisible, mostly non-interactive primitives. Render one thing.',
    groups: [
      { label: 'Structure & surface', items: [
        ['Surface', 'built', 'The glass shell + sole engine attach point.', 'surface'],
        ['Divider', 'built', 'Horizontal or vertical rule.', 'divider'],
        ['Box / Frame', 'built', 'Generic styled container.', 'box'],
        ['Aspect ratio box', 'built', 'Locks a child to a ratio.', 'aspectRatio'],
        ['Scrim', 'built', 'Dimming layer behind overlays.', 'scrim'],
      ]},
      { label: 'Typography & content', items: [
        ['Text', 'built', 'Body / label / caption text variants.', 'text'],
        ['Heading', 'built', 'Semantic h1–h6 on the type scale.', 'heading'],
        ['Link', 'built', 'Inline navigational text.', 'link'],
        ['Code', 'built', 'Monospace inline code.', 'code'],
        ['Kbd', 'built', 'Keyboard key glyph.', 'kbd'],
        ['Truncate', 'built', 'Single / multi-line clamp.', 'truncate'],
      ]},
      { label: 'Indicators & status', items: [
        ['Icon', 'built', 'Masked SVG glyph from the registry.', 'icon'],
        ['Badge', 'built', 'Small count or label overlay.', 'badge'],
        ['Tag / Chip', 'built', 'Static labeled token.', 'tag'],
        ['Spinner', 'built', 'Indeterminate circular loader.', 'spinner'],
        ['Progress (linear)', 'built', 'Determinate bar.', 'progress'],
        ['Progress (ring)', 'built', 'Determinate ring.', 'progressRing'],
        ['Skeleton', 'built', 'Shimmer placeholder block.', 'skeleton'],
      ]},
      { label: 'Media & a11y', items: [
        ['Image', 'built', 'Responsive image with fit/placeholder.', 'image'],
        ['Avatar', 'built', 'User image / initials / fallback.', 'avatar'],
        ['VisuallyHidden', 'built', 'Screen-reader-only content.', 'visuallyHidden'],
        ['Skip link', 'built', '“Skip to content”.', 'skipLink'],
      ]},
    ],
  },
  {
    id: 'elements', label: 'Elements', layer: 'L1',
    blurb: 'Indivisible interactive single controls — the form/control primitives.',
    groups: [
      { label: 'Buttons & actions', items: [
        ['Button', 'built', 'Solid / outline / ghost / accent variants.', 'button'],
        ['Icon button', 'built', 'Icon-only action.', 'iconButton'],
        ['FAB', 'built', 'Floating action button.', 'fab'],
        ['Toggle button', 'built', 'Pressable on/off button.', 'toggleButton'],
        ['Split button', 'built', 'Primary action + menu caret.', 'splitButton'],
        ['Close button', 'built', 'Standardized dismiss.', 'closeButton'],
      ]},
      { label: 'Text entry', items: [
        ['Text input', 'built', 'Single-line text.', 'input'],
        ['Textarea', 'built', 'Multi-line, auto-grow.', 'textarea'],
        ['Search input', 'built', 'Query field with clear.', 'search'],
        ['Number / Stepper', 'built', 'Numeric with +/−.', 'numberStepper'],
        ['Password input', 'built', 'Masked + reveal toggle.', 'password'],
        ['OTP input', 'built', 'Segmented one-time code.', 'otp'],
        ['Tag input', 'built', 'Free-form multi-value entry.', 'tagInput'],
      ]},
      { label: 'Selection & toggles', items: [
        ['Checkbox', 'built', 'Boolean, incl. indeterminate.', 'checkbox'],
        ['Radio', 'built', 'Single choice in a group.', 'radio'],
        ['Switch', 'built', 'On/off — the kube switch.', 'toggle'],
        ['Slider', 'built', 'Single-value range — the kube slider.', 'slider'],
        ['Segmented control', 'built', 'Inline exclusive options.', 'segmented'],
        ['Rating', 'built', 'Star / heart score input.', 'rating'],
        ['Select', 'built', 'Native dropdown.', 'select'],
        ['File input', 'built', 'Choose file(s).', 'fileInput'],
      ]},
    ],
  },
  {
    id: 'components', label: 'Components', layer: 'L2',
    blurb: 'Molecules — a few atoms/elements composed into one functional unit.',
    groups: [
      { label: 'Forms', items: [
        ['Form field', 'built', 'Label + control + help + error.', 'formField'],
        ['Combobox', 'built', 'Input + filtered listbox.', 'combobox'],
        ['Autocomplete', 'built', 'Typeahead suggestions.', 'autocomplete'],
        ['Radio group', 'built', 'Set of radios.', 'radioGroup'],
        ['Input group', 'built', 'Prefix / suffix addons.', 'inputGroup'],
      ]},
      { label: 'Navigation', items: [
        ['Tabs', 'built', 'Tab list + panels.', 'tabs'],
        ['Breadcrumb', 'built', 'Hierarchical trail.', 'breadcrumb'],
        ['Pagination', 'built', 'Page navigation.', 'pagination'],
        ['Menu', 'built', 'List of actionable items.', 'menu'],
        ['Dropdown menu', 'built', 'Trigger + menu.', 'dropdownMenu'],
        ['Stepper', 'built', 'Numbered step indicator.', 'stepper'],
      ]},
      { label: 'Disclosure & overlays', items: [
        ['Accordion', 'built', 'Stacked expandable sections.', 'accordion'],
        ['Tooltip', 'built', 'Hover / focus hint.', 'tooltip'],
        ['Popover', 'built', 'Anchored floating panel.', 'popover'],
        ['Tree', 'built', 'Hierarchical expandable list.', 'tree'],
      ]},
      { label: 'Feedback', items: [
        ['Alert', 'built', 'Contextual success / warn / error.', 'alert'],
        ['Toast', 'built', 'Transient notification.', 'toast'],
        ['Banner', 'built', 'Page-level announcement.', 'banner'],
        ['Empty state', 'built', 'No-data placeholder + action.', 'emptyState'],
        ['Loading overlay', 'built', 'Blocking spinner region.', 'loadingOverlay'],
      ]},
      { label: 'Data display', items: [
        ['Card', 'built', 'Header / body / footer container.', 'card'],
        ['List', 'built', 'Vertical itemized content.', 'list'],
        ['Stat / KPI', 'built', 'Single number + delta.', 'stat'],
        ['Avatar group', 'built', 'Stacked avatars + overflow.', 'avatarGroup'],
        ['Timeline', 'built', 'Chronological events.', 'timeline'],
        ['Table (basic)', 'built', 'Static rows / columns.', 'table'],
        ['Filter chips', 'built', 'Toggleable filter tokens.', 'filterChips'],
      ]},
      { label: 'Composed', items: [
        ['Search bar', 'built', 'Glass search field + action.', 'search'],
        ['Button group', 'built', 'Joined button set.', 'buttonGroup'],
        ['Quantity selector', 'built', '−/value/+ control.', 'quantity'],
        ['Media object', 'built', 'Media + adjacent text.', 'mediaObject'],
      ]},
    ],
  },
  {
    id: 'compounds', label: 'Compound', layer: 'L3',
    blurb: 'Organisms — multiple components working together as a region or flow.',
    groups: [
      { label: 'App chrome & navigation', items: [
        ['Navbar / App bar', 'built', 'Top application bar.', 'navbar'],
        ['Sidebar nav', 'built', 'Primary side navigation.', 'sidebarNav'],
        ['Toolbar', 'built', 'Action / format strip.', 'toolbar'],
        ['Command palette', 'built', 'Searchable command launcher.', 'commandPalette'],
        ['Page header', 'built', 'Title + meta + actions.', 'pageHeader'],
        ['Footer', 'built', 'Site / app footer link groups.', 'footer'],
      ]},
      { label: 'Overlays & flows', items: [
        ['Modal / Dialog', 'built', 'Centered focus-trapped overlay.', 'modal'],
        ['Drawer / Sheet', 'built', 'Edge / bottom sliding panel.', 'drawer'],
        ['Notification center', 'built', 'Inbox of notifications.', 'notificationCenter'],
        ['Onboarding tour', 'built', 'Coachmark sequence.', 'onboardingTour'],
      ]},
      { label: 'Forms & data entry', items: [
        ['Form (full)', 'built', 'Multi-section validated form.', 'formFull'],
        ['Wizard', 'built', 'Stepped flow with progress.', 'wizard'],
        ['Login / Auth form', 'built', 'Sign-in / up / reset.', 'authForm'],
        ['Date picker', 'built', 'Calendar + input.', 'datePicker'],
        ['File uploader', 'built', 'Drag-drop + progress list.', 'fileUploader'],
        ['Rich text editor', 'built', 'WYSIWYG + toolbar.', 'richTextEditor'],
        ['Settings panel', 'built', 'Grouped preference controls.', 'settingsPanel'],
      ]},
      { label: 'Data & dashboards', items: [
        ['Data table', 'built', 'Sort / filter / select / paginate.', 'dataTable'],
        ['Data grid', 'built', 'Virtualized editable grid.', 'dataGrid'],
        ['Chart card', 'built', 'Titled chart + legend.', 'chartCard'],
        ['Calendar / Scheduler', 'built', 'Month / week / day views.', 'scheduler'],
        ['Kanban board', 'built', 'Columns of draggable cards.', 'kanban'],
        ['Faceted filter panel', 'built', 'Filters + active chips.', 'facetedFilter'],
      ]},
      { label: 'Communication & media', items: [
        ['Chat thread', 'built', 'Message list + composer.', 'chatThread'],
        ['Comment thread', 'built', 'Nested comments + reply.', 'commentThread'],
        ['Media player', 'built', 'Full audio / video player.', 'mediaPlayer'],
        ['Image gallery', 'built', 'Grid + lightbox viewer.', 'imageGallery'],
        ['Carousel', 'built', 'Swipeable slides + controls.', 'carousel'],
        ['User / Profile card', 'built', 'Identity summary + actions.', 'profileCard'],
      ]},
      { label: 'Commerce', items: [
        ['Product card', 'built', 'Image + price + actions.', 'productCard'],
        ['Pricing table', 'built', 'Tiered plan comparison.', 'pricingTable'],
        ['Cart / Mini-cart', 'built', 'Line items + totals.', 'cart'],
        ['Checkout flow', 'built', 'Address / payment / review.', 'checkout'],
      ]},
    ],
  },
  {
    id: 'layouts', label: 'Layouts', layer: 'L4',
    blurb: 'Page / region scaffolds and the structural primitives that arrange everything.',
    groups: [
      { label: 'Structural primitives', items: [
        ['Stack (V/H)', 'built', 'Even-spaced flow.', 'stack'],
        ['Grid', 'built', 'Responsive N-column grid.', 'grid'],
        ['Cluster / Inline', 'built', 'Wrapping inline group.', 'cluster'],
        ['Center', 'built', 'Horizontally center + max-width.', 'center'],
        ['Sidebar layout', 'built', 'Fixed side + fluid main.', 'splitView'],
        ['Container / Section', 'built', 'Max-width content band.', 'container'],
      ]},
      { label: 'Application shells', items: [
        ['App shell', 'built', 'Header + sidebar + content + footer.', 'appShell'],
        ['Dashboard layout', 'built', 'Nav + widget grid.', 'dashboard'],
        ['Master–detail', 'built', 'List + detail pane.', 'splitView'],
        ['Settings layout', 'built', 'Section nav + panels.', 'settingsLayout'],
        ['Three-column (feed)', 'built', 'Nav + feed + aside.', 'threeColumn'],
      ]},
      { label: 'Page templates', items: [
        ['Auth page', 'built', 'Centered card on backdrop.', 'authLayout'],
        ['Landing / Marketing', 'built', 'Hero + sections + footer.', 'hero'],
        ['Hero section', 'built', 'Headline + CTA + media.', 'hero'],
        ['Pricing page', 'built', 'Plans + FAQ.', 'pricingPage'],
        ['Docs page', 'built', 'Sidebar + prose + on-this-page.', 'docsPage'],
        ['Empty / Error / 404', 'built', 'Status pages.', 'errorPage'],
      ]},
    ],
  },
];

/* ----------------------------------- rendering ---------------------------- */
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

function itemId(catId, name) { return `${catId}--${slug(name)}`; }

function renderNav() {
  const nav = document.getElementById('nav');
  nav.innerHTML = INVENTORY.map((cat) => {
    const count = cat.groups.reduce((n, g) => n + g.items.length, 0);
    const links = cat.groups.flatMap((g) => g.items).map(([name, status]) =>
      `<li><a class="nav__link" href="#${itemId(cat.id, name)}" data-name="${name.toLowerCase()}">
         <span>${name}</span><span class="nav__count">${status === 'built' ? '●' : ''}</span>
       </a></li>`).join('');
    return `<div class="nav__group" data-cat="${cat.id}">
      <a class="nav__cat" href="#${cat.id}"><span class="nav__cat-mark"></span>${cat.label}
        <span class="nav__count" style="margin-left:auto">${count}</span></a>
      <ul class="nav__list">${links}</ul>
    </div>`;
  }).join('');
}

function renderToc() {
  document.getElementById('toc').innerHTML = INVENTORY.map((cat) =>
    `<li><a class="toc__link" href="#${cat.id}" data-toc="${cat.id}">${cat.label}</a></li>`).join('');
}

function renderHeroStats() {
  let built = 0, total = 0;
  INVENTORY.forEach((c) => c.groups.forEach((g) => g.items.forEach((i) => { total++; if (i[1] === 'built') built++; })));
  const stats = [
    [INVENTORY.length, 'Tiers'],
    [total, 'Catalog parts'],
    [built, 'Built today'],
    ['L0–L4', 'Layer model'],
  ];
  document.getElementById('heroStats').innerHTML = stats.map(([n, l]) =>
    `<div class="stat"><div class="stat__n">${n}</div><div class="stat__l">${l}</div></div>`).join('');
}

/* Wide live demos span two gallery columns so horizontal compounds fit. */
const WIDE = new Set([
  'materialLab',
  'navbar', 'mediaPlayer', 'toolbar', 'commandPalette', 'modal', 'authForm',
  'datePicker', 'chatThread', 'dataTable', 'table', 'pricingTable', 'productCard',
  'pageHeader', 'footer', 'banner', 'formFull', 'settingsPanel', 'richTextEditor',
  'dataGrid', 'chartCard', 'scheduler', 'kanban', 'facetedFilter', 'imageGallery',
  'carousel', 'profileCard', 'cart', 'checkout', 'mediaObject', 'stepper',
  'breadcrumb', 'inputGroup', 'notificationCenter', 'drawer', 'wizard', 'commentThread',
]);

function renderSections() {
  document.getElementById('sections').innerHTML = INVENTORY.map((cat) => {
    const groups = cat.groups.map((g) => {
      const cards = g.items.map(([name, status, purpose, demo]) => {
        const id = itemId(cat.id, name);
        const live = demo && MOUNTS[demo];
        const wide = live && WIDE.has(demo);
        const preview = live
          ? `<div class="pv pv--live" data-mount="${demo}"></div>`
          : demo && DEMOS[demo]
            ? `<div class="pv">${DEMOS[demo]}</div>`
            : `<div class="placeholder"><i class="fa-regular fa-square-full" aria-hidden="true"></i><span>Preview soon</span></div>`;
        return `<article class="spec${wide ? ' spec--wide' : ''}" id="${id}" data-name="${name.toLowerCase()}" data-purpose="${purpose.toLowerCase()}">
          <div class="spec__demo">${preview}</div>
          <div class="spec__body">
            <div class="spec__name">${name}<span class="chip chip--${status}">${status}</span></div>
            <p class="spec__desc">${purpose}</p>
          </div>
        </article>`;
      }).join('');
      return `<div class="group" id="${cat.id}-${slug(g.label)}">
        <h3 class="group__title">${g.label}</h3>
        <div class="gallery">${cards}</div>
      </div>`;
    }).join('');
    return `<section class="cat" id="${cat.id}" data-cat-section="${cat.id}">
      <div class="cat__head">
        <span class="cat__eyebrow">${cat.label}</span>
        <h2 class="cat__title">${cat.label}<span class="cat__layer">${cat.layer}</span></h2>
        <p class="cat__blurb">${cat.blurb}</p>
      </div>
      ${groups}
    </section>`;
  }).join('');
}

/* --------------------------- live glass mounts ---------------------------- */
/* Replace the [data-mount] hosts with REAL liquid-glass components. */
function mountLive() {
  document.querySelectorAll('[data-mount]').forEach((host) => {
    if (host.dataset.mounted) return;
    const make = MOUNTS[host.dataset.mount];
    if (!make) return;
    host.appendChild(make());
    host.dataset.mounted = '1';
  });
}

/* Featured, draggable precision-lens showcase in the hero. */
function mountHeroLens() {
  const host = document.getElementById('heroDemo');
  if (host) host.appendChild(glassLens());
}

/* ----------------------------------- scrollspy ---------------------------- */
function setupScrollspy() {
  const navLinks = [...document.querySelectorAll('.nav__group')];
  const tocLinks = [...document.querySelectorAll('.toc__link')];
  const sections = [...document.querySelectorAll('[data-cat-section]')];

  const setActive = (id) => {
    navLinks.forEach((g) => g.classList.toggle('is-active-cat', g.dataset.cat === id));
    tocLinks.forEach((l) => l.classList.toggle('is-active', l.dataset.toc === id));
    // highlight current category's nav links subtly via the active group
    document.querySelectorAll('.nav__cat').forEach((c) => {
      c.style.color = c.parentElement.dataset.cat === id ? 'var(--d-ink)' : '';
    });
  };

  const io = new IntersectionObserver((entries) => {
    const visible = entries.filter((e) => e.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) setActive(visible.target.dataset.catSection);
  }, { rootMargin: '-20% 0px -65% 0px', threshold: [0, 0.25, 0.5, 1] });
  sections.forEach((s) => io.observe(s));

  // active individual item link while scrolling
  const items = [...document.querySelectorAll('.spec')];
  const allLinks = new Map([...document.querySelectorAll('.nav__link')].map((a) => [a.getAttribute('href').slice(1), a]));
  const itemIo = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const link = allLinks.get(e.target.id);
      if (link && e.isIntersecting) {
        document.querySelectorAll('.nav__link.is-active').forEach((a) => a.classList.remove('is-active'));
        link.classList.add('is-active');
        link.scrollIntoView({ block: 'nearest' });
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px' });
  items.forEach((i) => itemIo.observe(i));
}

/* ----------------------------------- search ------------------------------- */
function setupSearch() {
  const input = document.getElementById('search');
  const sections = [...document.querySelectorAll('.cat')];

  const apply = (q) => {
    const term = q.trim().toLowerCase();
    let anyTotal = 0;
    sections.forEach((sec) => {
      let secHits = 0;
      sec.querySelectorAll('.group').forEach((group) => {
        let groupHits = 0;
        group.querySelectorAll('.spec').forEach((card) => {
          const hit = !term || card.dataset.name.includes(term) || card.dataset.purpose.includes(term);
          card.style.display = hit ? '' : 'none';
          if (hit) groupHits++;
        });
        group.style.display = groupHits ? '' : 'none';
        secHits += groupHits;
      });
      sec.style.display = secHits ? '' : 'none';
      anyTotal += secHits;
    });
    // nav filter
    document.querySelectorAll('.nav__link').forEach((a) => {
      const hit = !term || a.dataset.name.includes(term);
      a.style.display = hit ? '' : 'none';
    });
    document.querySelectorAll('.nav__group').forEach((g) => {
      const visible = [...g.querySelectorAll('.nav__link')].some((a) => a.style.display !== 'none');
      g.style.display = visible ? '' : 'none';
    });

    let empty = document.getElementById('emptyMsg');
    if (!anyTotal) {
      if (!empty) {
        empty = el(`<p class="empty" id="emptyMsg"></p>`);
        document.getElementById('sections').appendChild(empty);
      }
      empty.textContent = `No parts match “${q}”.`;
      empty.style.display = '';
    } else if (empty) empty.style.display = 'none';
  };

  input.addEventListener('input', () => apply(input.value));
  // "/" focuses search
  window.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== input) { e.preventDefault(); input.focus(); }
    if (e.key === 'Escape' && document.activeElement === input) { input.value = ''; apply(''); input.blur(); }
  });
}

function setupDropdown(root, { value, onChange }) {
  if (!root) return;
  const trigger = root.querySelector('.dd__trigger');
  const valueEl = root.querySelector('.dd__value');
  const menu = root.querySelector('.dd__menu');
  const options = Array.from(root.querySelectorAll('.dd__option'));

  const setOpen = (open) => {
    root.classList.toggle('is-open', open);
    trigger.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
    if (open) menu.focus({ preventScroll: true });
  };
  const setValue = (next, notify = true) => {
    const option = options.find((item) => item.dataset.value === next) || options[0];
    root.dataset.value = option.dataset.value;
    valueEl.textContent = option.textContent.trim();
    options.forEach((item) => {
      const selected = item === option;
      item.classList.toggle('is-on', selected);
      item.setAttribute('aria-selected', String(selected));
    });
    if (notify) onChange(option.dataset.value);
  };
  const move = (dir) => {
    const current = Math.max(0, options.findIndex((item) => item.classList.contains('is-on')));
    const next = options[(current + dir + options.length) % options.length];
    next.focus({ preventScroll: true });
  };

  trigger.addEventListener('click', () => setOpen(!root.classList.contains('is-open')));
  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(true); options.find((item) => item.classList.contains('is-on'))?.focus({ preventScroll: true }); }
  });
  menu.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); trigger.focus({ preventScroll: true }); }
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); document.activeElement?.click(); }
  });
  options.forEach((option) => option.addEventListener('click', () => { setValue(option.dataset.value); setOpen(false); trigger.focus({ preventScroll: true }); }));
  document.addEventListener('click', (e) => { if (!root.contains(e.target)) setOpen(false); });
  setValue(value, false);
}

/* ----------------------------------- chrome ------------------------------- */
function setupChrome() {
  const html = document.documentElement;

  // theme
  const saved = localStorage.getItem('lg-docs-theme');
  if (saved) { html.dataset.theme = saved; html.dataset.lgTheme = saved; }
  document.getElementById('themeToggle').addEventListener('click', () => {
    const next = html.dataset.theme === 'dark' ? 'light' : 'dark';
    html.dataset.theme = next; html.dataset.lgTheme = next;
    localStorage.setItem('lg-docs-theme', next);
  });

  // motion preset (sets the @liquid-glass/ui token attribute)
  setupDropdown(document.getElementById('motionSelect'), {
    value: html.getAttribute('data-lg-motion') || 'default',
    onChange(v) {
      if (v === 'default') html.removeAttribute('data-lg-motion');
      else html.setAttribute('data-lg-motion', v);
    },
  });

  // background preset (global) — line grid or a rotated landscape photo
  const savedBg = localStorage.getItem('lg-docs-bg') || 'grid';
  html.setAttribute('data-bg', savedBg);
  setupDropdown(document.getElementById('bgSelect'), {
    value: savedBg,
    onChange(v) {
      html.setAttribute('data-bg', v);
      localStorage.setItem('lg-docs-bg', v);
    },
  });

  // mobile nav
  const sidebar = document.getElementById('sidebar');
  const scrim = document.getElementById('scrim');
  const toggle = document.getElementById('navToggle');
  const close = () => { sidebar.classList.remove('is-open'); scrim.hidden = true; toggle.setAttribute('aria-expanded', 'false'); };
  toggle.addEventListener('click', () => {
    const open = sidebar.classList.toggle('is-open');
    scrim.hidden = !open; toggle.setAttribute('aria-expanded', String(open));
  });
  scrim.addEventListener('click', close);
  document.getElementById('nav').addEventListener('click', (e) => { if (e.target.closest('a')) close(); });
}

/* ----------------------------------- init --------------------------------- */
renderNav();
renderToc();
renderHeroStats();
renderSections();
mountLive();
mountHeroLens();
setupScrollspy();
setupSearch();
setupChrome();
