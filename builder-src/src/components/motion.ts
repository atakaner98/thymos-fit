import { useEffect } from "react";

/** Honour the OS "reduce motion" setting everywhere motion is introduced. */
export function prefersReducedMotion(): boolean {
  if (typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Runs `onFrame` on scroll/resize, coalesced into one animation frame so a
 * fast scroll never queues more work than the compositor can drain. Callers
 * must only write transforms and custom properties from it — never read
 * layout after writing, or every frame costs a forced reflow.
 *
 * `onFrame` must be stable (useCallback), otherwise the listener re-binds on
 * every render.
 */
export function useScrollFx(onFrame: () => void, enabled = true): void {
  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    const tick = () => {
      frame = 0;
      onFrame();
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    onFrame();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [onFrame, enabled]);
}
