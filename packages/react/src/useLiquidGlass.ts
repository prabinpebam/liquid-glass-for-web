import { useEffect, useRef } from 'react';
import { liquidGlass, type LiquidGlassHandle, type LiquidGlassOptions } from '@liquid-glass/core';

/**
 * Attach the liquid-glass effect to a ref'd element and keep it in sync with
 * `options`. Returns a ref to spread onto the target element.
 *
 * See ../../../docs/reference/getting-started.md.
 */
export function useLiquidGlass<T extends HTMLElement = HTMLElement>(
  options: LiquidGlassOptions = {},
) {
  const ref = useRef<T | null>(null);
  const handleRef = useRef<LiquidGlassHandle | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    handleRef.current = liquidGlass(ref.current, options);
    return () => {
      handleRef.current?.dispose();
      handleRef.current = null;
    };
    // Mount/unmount only; live updates handled by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    handleRef.current?.update(options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(options)]);

  return ref;
}
