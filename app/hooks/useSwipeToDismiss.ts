import { animate, useDragControls, useMotionValue, useMotionValueEvent, type PanInfo } from 'motion/react';
import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { haptic } from '~/lib/haptics';

/** Drag distance after which letting go dismisses, capped so a tall sheet is not a long haul. */
const DISMISS_DISTANCE_RATIO = 0.3;
const DISMISS_DISTANCE_MAX = 160;
/** px/s — a flick faster than this dismisses even a short drag. */
const DISMISS_VELOCITY = 500;
const DISMISS_VELOCITY_MIN_DISTANCE = 24;

const SPRING_BACK = { type: 'spring', stiffness: 520, damping: 42 } as const;

interface Options {
  enabled: boolean;
  onDismiss: () => void;
}

function dismissThreshold(height: number) {
  return Math.min(height * DISMISS_DISTANCE_RATIO, DISMISS_DISTANCE_MAX);
}

/**
 * Swipe-down-to-dismiss for a bottom sheet, built on Motion's drag so it moves
 * the way a native sheet does: the sheet follows the finger 1:1 downward, pulls
 * back with resistance upward, the backdrop fades with it, a tick fires as the
 * release point crosses "this will close", and letting go either flings the
 * sheet away (far enough or fast enough) or springs it back with the release
 * velocity carried into the spring.
 *
 * Only elements marked `data-sheet-drag` (the grabber and the title bar) start a
 * drag — the body keeps its own scrolling. The enter/exit slide stays in CSS
 * (`translate`), Motion owns `transform`, so the two compose without fighting.
 */
export function useSwipeToDismiss({ enabled, onDismiss }: Options) {
  const y = useMotionValue(0);
  const controls = useDragControls();
  const popupRef = useRef<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLElement | null>(null);
  const crossed = useRef(false);

  // The backdrop follows the sheet — also while it springs back after a release.
  useMotionValueEvent(y, 'change', (offset) => {
    const overlay = overlayRef.current;
    const popup = popupRef.current;
    if (!overlay || !popup) return;
    overlay.style.opacity = offset > 0 ? String(Math.max(0, 1 - offset / (popup.offsetHeight || 1))) : '';
  });

  // The sheet component outlives open/close; a dismissed sheet must not reopen offset.
  const setPopup = useCallback(
    (node: HTMLElement | null) => {
      popupRef.current = node;
      if (node) y.set(0);
    },
    [y]
  );

  const startDrag = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!enabled || event.button > 0) return;
      const target = event.target as HTMLElement;
      if (!target.closest('[data-sheet-drag]')) return;
      if (target.closest('button, a, input, select, textarea, [role="combobox"]')) return;
      crossed.current = false;
      controls.start(event);
    },
    [controls, enabled]
  );

  const onDrag = useCallback((_: unknown, info: PanInfo) => {
    const height = popupRef.current?.offsetHeight || 1;
    const past = info.offset.y > dismissThreshold(height);
    if (past !== crossed.current) {
      crossed.current = past;
      haptic('selection');
    }
  }, []);

  const onDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      const popup = popupRef.current;
      const height = popup?.offsetHeight || 1;
      const flung = info.velocity.y > DISMISS_VELOCITY && info.offset.y > DISMISS_VELOCITY_MIN_DISTANCE;

      if (info.offset.y <= dismissThreshold(height) && !flung) {
        void animate(y, 0, { ...SPRING_BACK, velocity: info.velocity.y });
        return;
      }

      haptic('light');
      onDismiss();
      // The CSS exit takes it from here. If the owner refused to close, do not leave the sheet stranded half-way down.
      window.setTimeout(() => {
        if (popup?.isConnected && popup.hasAttribute('data-open')) void animate(y, 0, SPRING_BACK);
      }, 450);
    },
    [onDismiss, y]
  );

  return {
    setPopup,
    overlayRef,
    /** Spread on the (motion-wrapped) popup. */
    motionProps: enabled
      ? ({
          drag: 'y',
          dragControls: controls,
          dragListener: false,
          dragConstraints: { top: 0 },
          dragElastic: { top: 0.06 },
          dragMomentum: false,
          style: { y },
          onPointerDown: startDrag,
          onDrag,
          onDragEnd,
        } as const)
      : {},
  };
}
