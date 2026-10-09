import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';

/**
 * Минимальное расстояние (px) по горизонтали, которое считается свайпом.
 */
const SWIPE_THRESHOLD = 60;

/**
 * Максимальное отношение вертикального смещения к горизонтальному.
 * Свайп с большим углом (преимущественно вертикальный) игнорируется.
 */
const AXIS_LOCK_RATIO = 0.5;

/** Режим свайп-навигации для текущей страницы. */
export type SwipeMode =
  /** Горизонтальный переход между вкладками BottomNav. */
  | 'tabs'
  /** Свайп вправо — назад (как кнопка «Back» в iOS). */
  | 'back'
  /** Свайп отключён. */
  | 'disabled';

interface SwipeNavOptions {
  /** Целевой роут при свайпе влево (→ следующий таб, только в режиме tabs). */
  nextUrl: string | null;
  /** Целевой роут при свайпе вправо (→ предыдущий таб, только в режиме tabs). */
  prevUrl: string | null;
  /** Режим навигации. */
  mode: SwipeMode;
}

interface TouchState {
  startX: number;
  startY: number;
  /** Фиксируем режим на момент touchstart, чтобы избежать race condition при смене страницы. */
  mode: SwipeMode;
  nextUrl: string | null;
  prevUrl: string | null;
  handled: boolean;
}

/**
 * Возвращает обработчики touch-событий для горизонтального свайп-навигации.
 *
 * Режим tabs:  свайп влево → следующий таб, вправо → предыдущий.
 * Режим back:  свайп вправо → navigate(-1) (детальные страницы, формы).
 * Режим disabled: ничего не делает.
 */
export function useSwipeNav({ nextUrl, prevUrl, mode }: SwipeNavOptions) {
  const navigate = useNavigate();
  const touch = useRef<TouchState | null>(null);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (mode === 'disabled') return;
      const t = e.touches[0];
      // Захватываем режим и URLs на момент начала жеста
      touch.current = {
        startX: t.clientX,
        startY: t.clientY,
        mode,
        nextUrl,
        prevUrl,
        handled: false,
      };
    },
    [mode, nextUrl, prevUrl]
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const state = touch.current;
      if (!state || state.handled || state.mode === 'disabled') return;
      state.handled = true;

      const t = e.changedTouches[0];
      const dx = t.clientX - state.startX;
      const dy = t.clientY - state.startY;

      if (Math.abs(dx) < SWIPE_THRESHOLD) return;
      if (Math.abs(dy) > Math.abs(dx) * (1 - AXIS_LOCK_RATIO)) return;

      if (state.mode === 'back') {
        // Только свайп вправо (← на экране, dx > 0) = назад
        if (dx > 0) navigate(-1);
        return;
      }

      if (state.mode === 'tabs') {
        if (dx < 0 && state.nextUrl) {
          navigate(state.nextUrl);
        } else if (dx > 0 && state.prevUrl) {
          navigate(state.prevUrl);
        }
      }
    },
    [navigate]
  );

  return { onTouchStart, onTouchEnd };
}
