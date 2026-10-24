import { useEffect, useRef } from 'react';
import { useReducedMotion } from './useReducedMotion';
/** Motion is scoped to decoration and disabled for touch/reduced motion. */
export function useDepthMotion<T extends HTMLElement>() {
  const ref = useRef<T>(null); const reduced = useReducedMotion();
  useEffect(() => {
    const element = ref.current;
    if (!element || reduced || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    let frame = 0;
    const move = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const bounds = element.getBoundingClientRect();
        const x = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
        const y = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1));
        element.style.setProperty('--pointer-x', `${x * 12}px`); element.style.setProperty('--pointer-y', `${y * 9}px`);
        element.style.setProperty('--rotate-x', `${-y * 3}deg`); element.style.setProperty('--rotate-y', `${x * 5}deg`);
      });
    };
    const reset = () => { cancelAnimationFrame(frame); ['--pointer-x','--pointer-y','--rotate-x','--rotate-y'].forEach(p => element.style.removeProperty(p)); };
    element.addEventListener('pointermove',move); element.addEventListener('pointerleave',reset);
    return () => { element.removeEventListener('pointermove',move); element.removeEventListener('pointerleave',reset); reset(); };
  }, [reduced]);
  return ref;
}
