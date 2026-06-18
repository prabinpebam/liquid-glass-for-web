# @liquid-glass/react

React bindings for [`@liquid-glass/core`](../core/README.md).

## Install

```bash
pnpm add @liquid-glass/react @liquid-glass/core react react-dom
```

## Hook

```tsx
import { useLiquidGlass } from '@liquid-glass/react';

function Card() {
  const ref = useLiquidGlass<HTMLDivElement>({ radius: 24, bezel: 16, surface: 'convex' });
  return <div ref={ref} className="glass">Frosted</div>;
}
```

## Component

```tsx
import { LiquidGlass } from '@liquid-glass/react';

<LiquidGlass glass={{ bezel: 20, blur: 3 }} className="glass">
  Frosted
</LiquidGlass>;
```

The hook re-applies options when they change and disposes the effect on unmount.

## License

MIT. See [docs/attribution.md](../../docs/attribution.md).
