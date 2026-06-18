# Liquid Glass — Component inventory (the build reference)

> The exhaustive catalog of everything the library should be able to render —
> the **source list** we build the design library from. It is organized into the
> five tiers the design system uses, mapped onto the L0–L4 layer model from
> [design-spec.md](design-spec.md). Each entry is a single, named building block
> with a one-line purpose; entries already in the scaffold are marked **built**,
> everything else is **planned**.
>
> This is a *coverage* document: the goal is that the union of these parts is
> enough to assemble the large majority of web apps and marketing/product UIs in
> use today — dashboards, SaaS apps, e‑commerce, social/chat, content sites,
> settings, auth, and editors.

---

## How the tiers map to the layer model

| Tier (this doc) | Layer | Definition |
| --- | --- | --- |
| **Foundations** | L0 | Tokens only — no markup. Values every other tier consumes. |
| **Atoms** | L1 | Indivisible, mostly *non‑interactive* primitives. Render one thing, compose nothing else from the library. |
| **Elements** | L1 | Indivisible *interactive* single controls (the form/control primitives). Same layer as atoms, split out for clarity. |
| **Components** | L2 | Molecules — a few atoms/elements composed into one functional unit. |
| **Compound components** | L3 | Organisms — multiple components working together as a self‑contained region/flow. |
| **Layouts** | L4 | Page/region scaffolds and the structural primitives that arrange everything else. |

Composition rule (LG‑P3): a part may only use parts at or below its own layer.
Every interactive part renders inert markup from a factory and gets behavior from
an attachable controller (LG‑P12); every glassy part is a `surface` with content
(LG‑P7) drawing from the closed material palette (LG‑P13).

**Status legend:** `built` = present in `packages/ui` today · `planned` = on this
reference, not yet implemented.

---

## L0 — Foundations (tokens)

| Token family | Purpose | Status |
| --- | --- | --- |
| Color | Neutral ramp, accent ramp, status (success/warn/danger/info), on‑glass text | built |
| Typography | Font families, weights, type scale (caption→display), line‑heights | built |
| Spacing | 4px‑based spacing scale | built |
| Sizing | Control heights, icon sizes, stroke widths | built |
| Radius | Corner radii incl. `pill` | built |
| Elevation | Shadow scale (rest→raised→lifted) | built |
| Glass / material | Bezel, thickness, blur, refraction inset (px), refraction, tint, stroke, specular | built |
| Motion | Durations, easings, spring families, activation, presets | built |
| Z‑index | Stacking scale (base→popup→toast) | built |
| Semantic | Control height/padding, focus ring, default surface radius | built |
| Breakpoints | Responsive thresholds + container queries | planned |
| Opacity / state | Hover/pressed/disabled/selected state opacities | planned |
| Border | Border widths + styles (separate from glass stroke) | planned |
| Aspect ratios | Common media ratios (1:1, 4:3, 16:9, golden) | planned |

---

## L1 — Atoms (non‑interactive primitives)

### Structure & surface
| Atom | Purpose | Status |
| --- | --- | --- |
| Surface | The glass shell + sole engine attach point | built |
| Box / Frame | Generic styled container (padding/radius/elevation), non‑glass | planned |
| Divider / Separator | Horizontal or vertical rule | planned |
| Spacer | Explicit whitespace unit | planned |
| Scrim / Overlay backdrop | Dimming layer behind overlays | planned |
| Portal root | Mount point for overlays/toasts | planned |
| Aspect ratio box | Locks child to a ratio | planned |

### Typography & content
| Atom | Purpose | Status |
| --- | --- | --- |
| Text | Body/label/caption text variants | built |
| Heading | Semantic h1–h6 with type scale | planned |
| Link / Anchor | Inline navigational text | planned |
| Code (inline) | Monospace inline code | planned |
| Kbd | Keyboard key glyph | planned |
| Blockquote | Quoted text block | planned |
| List markers | Ordered/unordered/description list styling | planned |
| Truncate / Ellipsis | Single/multi‑line clamp | planned |
| Highlight / Mark | Emphasis background | planned |

### Indicators & status
| Atom | Purpose | Status |
| --- | --- | --- |
| Icon | Masked SVG glyph from the registry | built |
| Badge / Counter | Small count or label overlay | planned |
| Dot / Status indicator | Online/offline/state dot | planned |
| Tag / Chip (display) | Static labeled token | planned |
| Pill / Label | Rounded status label | planned |
| Spinner | Indeterminate circular loader | planned |
| Progress (linear) | Determinate bar | planned |
| Progress (circular/ring) | Determinate ring | planned |
| Skeleton | Shimmer placeholder block | planned |
| Keycap / Shortcut hint | Shortcut affordance | planned |

### Media
| Atom | Purpose | Status |
| --- | --- | --- |
| Image | Responsive image with fit/placeholder | planned |
| Avatar | User image/initials/fallback | planned |
| Thumbnail | Fixed media preview | planned |
| Video (bare) | Native video element wrapper | planned |
| Icon‑graphic / Illustration slot | Decorative artwork holder | planned |

### Utility & accessibility
| Atom | Purpose | Status |
| --- | --- | --- |
| VisuallyHidden | Screen‑reader‑only content | planned |
| Focus ring | Shared focus outline utility | planned |
| Live region | Polite/assertive announcer | planned |
| Skip link | "Skip to content" | planned |

---

## L1 — Elements (interactive single controls)

### Buttons & actions
| Element | Purpose | Status |
| --- | --- | --- |
| Button | Solid/outline/ghost/text/subtle/accent variants | built |
| Icon button | Icon‑only action | planned |
| FAB | Floating action button | planned |
| Toggle button | Pressable on/off button | planned |
| Split button | Primary action + menu caret | planned |
| Link button | Anchor styled as button | planned |
| Close button | Standardized dismiss "×" | planned |
| Copy button | Copy‑to‑clipboard affordance | planned |

### Text entry
| Element | Purpose | Status |
| --- | --- | --- |
| Text input | Single‑line text | planned |
| Textarea | Multi‑line, auto‑grow | planned |
| Password input | Masked + reveal toggle | planned |
| Search input | Query field with clear | planned |
| Number input / Stepper | Numeric with increment/decrement | planned |
| PIN / OTP input | Segmented one‑time code | planned |
| Tag / Token input | Free‑form multi‑value entry | planned |
| Inline edit | Click‑to‑edit text | planned |
| Masked input | Phone/credit‑card/format masks | planned |

### Selection & toggles
| Element | Purpose | Status |
| --- | --- | --- |
| Checkbox | Boolean, incl. indeterminate | planned |
| Radio | Single choice in a group | planned |
| Switch / Toggle | On/off (the kube switch) | built |
| Slider | Single‑value range (the kube slider) | planned |
| Range slider | Dual‑thumb min/max | planned |
| Segmented control | Inline mutually exclusive options | planned |
| Select (native) | Native dropdown | planned |
| Rating | Star/heart score input | planned |
| Color swatch / picker input | Pick a color | planned |
| File input | Choose file(s) | planned |

### Date & time (primitive)
| Element | Purpose | Status |
| --- | --- | --- |
| Date input | Typed/parsed date field | planned |
| Time input | Typed time field | planned |
| Month/Week input | Period field | planned |

---

## L2 — Components (molecules)

### Forms
| Component | Purpose | Status |
| --- | --- | --- |
| Form field | Label + control + help + error wiring | planned |
| Fieldset / Field group | Grouped related fields | planned |
| Input group / Addon | Prefix/suffix around an input | planned |
| Checkbox group | Set of checkboxes | planned |
| Radio group | Set of radios | planned |
| Toggle group | Multi/single segmented toggles | planned |
| Combobox | Input + filtered listbox | planned |
| Autocomplete | Typeahead suggestions | planned |
| Multi‑select | Token‑producing select | planned |
| Form actions bar | Submit/cancel cluster | planned |

### Navigation
| Component | Purpose | Status |
| --- | --- | --- |
| Tabs | Tab list + panels | planned |
| Breadcrumb | Hierarchical trail | planned |
| Pagination | Page navigation | planned |
| Menu | List of actionable items | planned |
| Menu item / Submenu | Row + nested flyout | planned |
| Dropdown menu | Trigger + menu | planned |
| Nav list / Sidebar item | Vertical nav entry | planned |
| Stepper (navigation) | Numbered step indicator | planned |
| Anchor nav / On‑this‑page | In‑page section links | planned |
| Link list / Footer links | Grouped link columns | planned |

### Disclosure
| Component | Purpose | Status |
| --- | --- | --- |
| Accordion | Stacked expandable sections | planned |
| Disclosure / Collapse | Single show/hide region | planned |
| Tree / Tree item | Hierarchical expandable list | planned |
| Show‑more / Read‑more | Truncated content expander | planned |

### Overlays & contextual
| Component | Purpose | Status |
| --- | --- | --- |
| Tooltip | Hover/focus hint | planned |
| Popover | Anchored floating panel | planned |
| Context menu | Right‑click menu | planned |
| Dropdown panel | Rich anchored panel | planned |
| Hovercard | Preview‑on‑hover card | planned |

### Feedback & status
| Component | Purpose | Status |
| --- | --- | --- |
| Alert / Inline message | Contextual success/warn/error/info | planned |
| Banner | Page‑level announcement | planned |
| Toast / Snackbar | Transient notification | planned |
| Callout / Note | Highlighted aside | planned |
| Empty state | No‑data placeholder + action | planned |
| Error state | Inline failure + retry | planned |
| Loading overlay | Blocking spinner region | planned |
| Progress steps | Multi‑step progress trail | planned |
| Result / Status screen | Success/failure summary | planned |

### Data display
| Component | Purpose | Status |
| --- | --- | --- |
| Card | Content container w/ header/body/footer | planned |
| List / List item | Vertical itemized content | planned |
| Description list | Key/value pairs | planned |
| Stat / KPI / Metric | Single number + delta | planned |
| Tag list / Chip group | Collection of chips | planned |
| Avatar group | Stacked avatars + overflow | planned |
| Timeline | Chronological events | planned |
| Table (basic) | Static rows/columns | planned |
| Tooltip‑label / Definition | Inline term + meaning | planned |
| Comparison row | Feature compare line | planned |

### Media
| Component | Purpose | Status |
| --- | --- | --- |
| Media object | Image/avatar + adjacent text | planned |
| Figure / Caption | Media with caption | planned |
| Image grid tile | Gallery cell | planned |
| Audio control bar | Play/seek/volume strip | planned |
| Video control bar | Transport + fullscreen | planned |

### Search & buttons (composed)
| Component | Purpose | Status |
| --- | --- | --- |
| Search bar | Glass search field + action (the kube searchbox) | built |
| Button group | Joined button set | planned |
| Filter chips | Toggleable filter tokens | planned |
| Quantity selector | −/value/+ control | planned |

---

## L3 — Compound components (organisms)

### App chrome & navigation
| Compound | Purpose | Status |
| --- | --- | --- |
| Navbar / App bar | Top application bar | planned |
| Sidebar / Nav drawer | Primary side navigation | planned |
| Navigation rail | Compact icon nav | planned |
| Bottom navigation | Mobile tab bar | planned |
| Toolbar | Action/format strip | planned |
| Command palette | Searchable command launcher | planned |
| Global search | Search + suggestions + results | planned |
| Breadcrumb bar | Trail + page actions | planned |
| Page header | Title + meta + actions | planned |
| Footer | Site/app footer with link groups | planned |

### Overlays & flows
| Compound | Purpose | Status |
| --- | --- | --- |
| Modal / Dialog | Centered focus‑trapped overlay | planned |
| Confirm dialog | Yes/no destructive confirm | planned |
| Drawer / Sheet | Edge/bottom sliding panel | planned |
| Popover menu | Anchored multi‑section menu | planned |
| Notification center | Inbox of notifications | planned |
| Toast region | Stacked toast manager | planned |
| Onboarding tour | Coachmark sequence | planned |
| Cookie consent | Consent banner + prefs | planned |

### Forms & data entry
| Compound | Purpose | Status |
| --- | --- | --- |
| Form (full) | Multi‑section validated form | planned |
| Wizard / Multi‑step form | Stepped flow with progress | planned |
| Login / Auth form | Sign‑in/up/reset | planned |
| Date picker | Calendar + input | planned |
| Date range picker | Dual‑calendar range | planned |
| Time / Scheduler picker | Time + duration selection | planned |
| Color picker (full) | Wheel/sliders/swatches | planned |
| File uploader / Dropzone | Drag‑drop + progress list | planned |
| Rich text editor | WYSIWYG + toolbar | planned |
| Settings panel | Grouped preference controls | planned |

### Data & tables
| Compound | Purpose | Status |
| --- | --- | --- |
| Data table | Sort/filter/select/paginate | planned |
| Data grid | Virtualized editable grid | planned |
| Tree table | Hierarchical rows | planned |
| List with toolbar | Bulk‑action list view | planned |
| Faceted filter panel | Filters + active chips | planned |
| Chart card | Titled chart + legend | planned |
| Dashboard widget | Draggable stat/chart tile | planned |
| Calendar / Scheduler | Month/week/day event views | planned |
| Kanban board | Columns of draggable cards | planned |
| Stats grid | KPI dashboard row | planned |

### Communication & social
| Compound | Purpose | Status |
| --- | --- | --- |
| Chat / Message thread | Message list + composer | planned |
| Comment thread | Nested comments + reply | planned |
| Activity feed | Chronological updates | planned |
| Mention/Tag composer | @/# aware input | planned |
| Reaction bar | Emoji/like reactions | planned |
| User card / Profile card | Identity summary + actions | planned |
| Mentions popover | User picker flyout | planned |

### Media & content
| Compound | Purpose | Status |
| --- | --- | --- |
| Media player | Full audio/video player (kube player) | planned |
| Image gallery / Lightbox | Grid + zoom viewer | planned |
| Carousel | Swipeable slides + controls | planned |
| Video hero | Background‑video header | planned |
| Article / Prose body | Long‑form content renderer | planned |

### Commerce
| Compound | Purpose | Status |
| --- | --- | --- |
| Product card | Image + price + actions | planned |
| Product detail | Gallery + variants + buy box | planned |
| Pricing table | Tiered plan comparison | planned |
| Cart / Mini‑cart | Line items + totals | planned |
| Checkout flow | Address/payment/review steps | planned |
| Order summary | Itemized totals | planned |
| Review list | Ratings + reviews | planned |

---

## L4 — Layouts (structural primitives & page scaffolds)

### Structural primitives (composable)
| Layout primitive | Purpose | Status |
| --- | --- | --- |
| Stack (V/H) | Even‑spaced flow | planned |
| Inline / Cluster | Wrapping inline group | planned |
| Grid | Responsive N‑column grid | planned |
| Columns | Explicit multi‑column | planned |
| Center | Horizontally center + max‑width | planned |
| Cover | Vertically centered full‑height region | planned |
| Sidebar layout | Fixed side + fluid main | planned |
| Switcher | Auto row→column at threshold | planned |
| Reel | Horizontal scroll strip | planned |
| Frame | Aspect‑locked media frame | planned |
| Container / Section | Max‑width content band | planned |
| Spacer / Gap | Structural whitespace | planned |

### Application shells
| Layout | Purpose | Status |
| --- | --- | --- |
| App shell | Header + sidebar + content + footer | planned |
| Dashboard layout | Nav + widget grid | planned |
| Master–detail / Split view | List + detail pane | planned |
| Settings layout | Section nav + panels | planned |
| Three‑column (feed) | Nav + feed + aside | planned |
| Focused/task layout | Distraction‑free single column | planned |
| Full‑screen canvas | Editor/board surface | planned |

### Page templates
| Layout | Purpose | Status |
| --- | --- | --- |
| Auth page | Centered card on backdrop | planned |
| Landing / Marketing page | Hero + sections + footer | planned |
| Hero section | Headline + CTA + media | planned |
| Feature section | Feature grid/alternating | planned |
| Pricing page | Plans + FAQ | planned |
| Content / Docs page | Sidebar + prose + on‑this‑page | planned |
| Profile page | Header + tabs + content | planned |
| Search results page | Filters + result list | planned |
| Empty / Error / 404 / 500 | Status pages | planned |
| Print layout | Print‑optimized view | planned |

### Responsive & overlay infrastructure
| Layout | Purpose | Status |
| --- | --- | --- |
| Breakpoint provider | Responsive context/container queries | planned |
| Overlay layer / Portal stack | Z‑ordered overlay management | planned |
| Sticky region | Sticky header/footer/sidebar | planned |
| Scroll area | Styled custom scroll container | planned |
| Resizable panes | Draggable split panels | planned |

---

## Coverage notes

- **What this covers:** SaaS dashboards, admin tools, content/marketing sites,
  e‑commerce, social/chat, settings/account, auth, editors, and media apps — the
  bulk of mainstream web UI.
- **Deliberately out of scope (for now):** domain‑specific widgets (maps, code
  editors, spreadsheets, 3D/canvas tooling, video timelines) — these compose
  *on top of* the primitives above rather than belonging in the core library.
- **Sequencing:** build bottom‑up — finish L0/L1, then the L2 molecules most
  components depend on (form field, menu, card, tabs, dialog), then L3/L4. Each
  addition must clear LG‑P10 (nothing existing ± a variant already fits) and be
  registered in [`library.manifest.json`](../../packages/ui/library.manifest.json).
- This inventory is the **source list**; the manifest remains the **authoritative
  built inventory**. An item is "real" only once it is in the manifest.
