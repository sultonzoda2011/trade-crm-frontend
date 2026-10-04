import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { haptic } from '~/lib/haptics';

interface DragState {
  pointerId: number;
  startY: number;
  lastY: number;
  lastT: number;
  /** px/ms, smoothed — a flick should dismiss a sheet that was not dragged far. */
  velocity: number;
  crossed: boolean;
}

/** Drag distance after which letting go dismisses, capped so a tall sheet is not a long haul. */
const DISMISS_DISTANCE_RATIO = 0.3;
const DISMISS_DISTANCE_MAX = 160;
const DISMISS_VELOCITY = 0.6;
const DISMISS_VELOCITY_MIN_DISTANCE = 24;

interface Options {
  enabled: boolean;
  onDismiss: () => void;
}

/**
 * Swipe-down-to-dismiss for a bottom sheet, the way a native sheet behaves:
 * the sheet follows the finger, the backdrop fades with it, a tick fires when
 * the release point crosses "this will close", and letting go either flings it
 * away (far enough, or fast enough) or springs it back.
 *
 * Only elements marked `data-sheet-drag` start a drag — the grabber and the
 * title bar. The body keeps its normal scrolling, which is why this does not try
 * to hijack a scroll gesture. Movement is written straight to the element's
 * `transform` (the enter/exit slide uses the separate `translate` property, so
 * the two compose) to avoid a React render per pointer move.
 */
export function useSwipeToDismiss({ enabled, onDismiss }: Options) {
  const popupRef = useRef<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLElement | null>(null);
  const drag = useRef<DragState | null>(null);

  const settle = useCallback(() => {
    const popup = popupRef.current;
    const overlay = overlayRef.current;
    if (popup) {
      popup.style.transform = '';
      popup.style.transition = '';
    }
    if (overlay) {
      overlay.style.opacity = '';
      overlay.style.transition = '';
    }
  }, []);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const popup = popupRef.current;
      if (!enabled || !popup || event.button > 0) return;

      const target = event.target as HTMLElement;
      if (!target.closest('[data-sheet-drag]')) return;
      if (target.closest('button, a, input, select, textarea, [role="combobox"]')) return;

      drag.current = {
        pointerId: event.pointerId,
        startY: event.clientY,
        lastY: event.clientY,
        lastT: event.timeStamp,
        velocity: 0,
        crossed: false,
      };
      popup.setPointerCapture(event.pointerId);
      popup.style.transition = 'none';
      if (overlayRef.current) overlayRef.current.style.transition = 'none';
    },
    [enabled]
  );

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const state = drag.current;
    const popup = popupRef.current;
    if (!state || !popup || event.pointerId !== state.pointerId) return;

    const raw = event.clientY - state.startY;
    // Upward pull is damped (rubber band) instead of detaching the sheet from the edge.
    const offset = raw >= 0 ? raw : -Math.sqrt(-raw) * 1.5;
    popup.style.transform = `translateY(${offset}px)`;

    const height = popup.offsetHeight || 1;
    if (overlayRef.current) overlayRef.current.style.opacity = String(Math.max(0, 1 - Math.max(raw, 0) / height));

    const dt = Math.max(event.timeStamp - state.lastT, 1);
    state.velocity = 0.8 * state.velocity + 0.2 * ((event.clientY - state.lastY) / dt);
    state.lastY = event.clientY;
    state.lastT = event.timeStamp;

    const threshold = Math.min(height * DISMISS_DISTANCE_RATIO, DISMISS_DISTANCE_MAX);
    const crossed = raw > threshold;
    if (crossed !== state.crossed) {
      state.crossed = crossed;
      haptic('selection');
    }
  }, []);

  const finish = useCallback(
    (event: ReactPointerEvent<HTMLElement>, cancelled: boolean) => {
      const state = drag.current;
      const popup = popupRef.current;
      if (!state || !popup || event.pointerId !== state.pointerId) return;
      drag.current = null;
      if (popup.hasPointerCapture(event.pointerId)) popup.releasePointerCapture(event.pointerId);

      const raw = event.clientY - state.startY;
      const height = popup.offsetHeight || 1;
      const threshold = Math.min(height * DISMISS_DISTANCE_RATIO, DISMISS_DISTANCE_MAX);
      const flung = state.velocity > DISMISS_VELOCITY && raw > DISMISS_VELOCITY_MIN_DISTANCE;
      const dismiss = !cancelled && (raw > threshold || flung);

      // Hand the transform back to the stylesheet transition so both the exit slide and the spring-back animate.
      popup.style.transition = '';
      if (overlayRef.current) overlayRef.current.style.transition = '';

      if (!dismiss) {
        settle();
        return;
      }

      haptic('light');
      onDismiss();
      // If the owner refused to close, the sheet must not stay stranded half-way down.
      window.setTimeout(() => {
        if (popup.isConnected && popup.hasAttribute('data-open')) settle();
      }, 450);
    },
    [onDismiss, settle]
  );

  return {
    popupRef,
    overlayRef,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: (event: ReactPointerEvent<HTMLElement>) => finish(event, false),
      onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => finish(event, true),
    },
  };
}
