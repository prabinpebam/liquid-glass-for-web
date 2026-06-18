# @liquid-glass/element

A framework-free `<liquid-glass>` custom element built on
[`@liquid-glass/core`](../core/README.md).

## Install

```bash
pnpm add @liquid-glass/element @liquid-glass/core
```

## Use

```html
<script type="module">
  import '@liquid-glass/element'; // auto-registers <liquid-glass>
</script>

<liquid-glass radius="24" bezel="16" surface="convex" blur="2">
  Frosted content
</liquid-glass>
```

### Attributes

| Attribute | Type | Maps to |
| --- | --- | --- |
| `radius` | number | corner radius (px) |
| `bezel` | number | refractive rim width (px) |
| `thickness` | number | refractive index |
| `scale` | number | effect strength 0..1 |
| `blur` | number | backdrop blur (px) |
| `surface` | `convex` \| `concave` \| `lip` \| `flat` | bezel profile |
| `mode` | `backdrop` \| `filter` | apply mode |
| `fallback` | `blur` \| `none` | backdrop fallback |

Attribute changes update the effect live.

## License

MIT. See [docs/attribution.md](../../docs/attribution.md).
