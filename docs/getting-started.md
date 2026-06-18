# Getting started

> The library is in **scaffolding** stage. This guide documents the **target** usage
> so the API and DX are clear while implementation lands (see
> [../PROJECT-PLAN.md](../PROJECT-PLAN.md)).

## Install

```bash
pnpm add @liquid-glass/core
# framework wrappers (optional)
pnpm add @liquid-glass/react
pnpm add @liquid-glass/web-component
```

## Vanilla

```ts
import { liquidGlass } from '@liquid-glass/core';

const handle = liquidGlass(document.querySelector('.panel')!, {
  radius: 24,
  bezel: 18,
  thickness: 1.5,      // refractive index (glass ≈ 1.5)
  surface: 'convex',
  scale: 1,
  blur: 1,
  specular: { opacity: 0.4, saturation: 6 },
  mode: 'backdrop',    // 'backdrop' (Chromium) | 'filter' (cross-browser)
  fallback: 'blur',
});

// cheap fade without rebuilding maps
handle.setScale(0.5);

// reconfigure
handle.update({ bezel: 24 });

// clean up
handle.dispose();
```

```css
.panel {
  /* give it something to refract behind it */
  background: rgba(255, 255, 255, 0.08);
  border-radius: 24px;
}
```

## React

```tsx
import { useRef } from 'react';
import { useLiquidGlass } from '@liquid-glass/react';

function GlassCard() {
  const ref = useRef<HTMLDivElement>(null);
  useLiquidGlass(ref, { radius: 24, bezel: 18, thickness: 1.5 });
  return <div ref={ref} className="panel">Hello</div>;
}
```

## Web component

```html
<script type="module" src="/node_modules/@liquid-glass/web-component/dist/index.js"></script>

<liquid-glass radius="24" bezel="18" thickness="1.5" mode="backdrop">
  <p>Glass content</p>
</liquid-glass>
```

## Notes

- For the true "see-through panel" look use `mode: 'backdrop'` in a Chromium browser.
- For cross-browser, use `mode: 'filter'` (distorts the element's own content) or rely
  on the `fallback`. See [compatibility](compatibility.md).
