import { forwardRef, useImperativeHandle, useRef, type HTMLAttributes } from 'react';
import type { LiquidGlassOptions } from '@liquid-glass/core';
import { useLiquidGlass } from './useLiquidGlass.js';

export interface LiquidGlassProps extends HTMLAttributes<HTMLDivElement> {
  /** Effect options forwarded to the engine. */
  glass?: LiquidGlassOptions;
}

/**
 * Convenience wrapper component that applies the liquid-glass effect to a
 * `<div>`. For full control use {@link useLiquidGlass} directly.
 */
export const LiquidGlass = forwardRef<HTMLDivElement, LiquidGlassProps>(
  ({ glass, children, ...rest }, forwardedRef) => {
    const innerRef = useLiquidGlass<HTMLDivElement>(glass);
    const localRef = useRef<HTMLDivElement | null>(null);

    useImperativeHandle(forwardedRef, () => localRef.current as HTMLDivElement);

    const setRef = (node: HTMLDivElement | null) => {
      innerRef.current = node;
      localRef.current = node;
    };

    return (
      <div ref={setRef} {...rest}>
        {children}
      </div>
    );
  },
);
LiquidGlass.displayName = 'LiquidGlass';
