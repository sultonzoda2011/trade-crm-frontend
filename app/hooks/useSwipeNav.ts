import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';

/**
 * Минимальное расстояние (px) по горизонтали, которое считается свайпом.
 * Не слишком маленькое — чтобы не мешать скроллу; не слишком большое — чтобы работало комфортно.
 */
const SWIPE_THRESHOLD = 60;

/**
 * Максимальное отношение вертикального смещения к горизонтальному.
 * Свайп с большим углом (преимущественно вертикальный) игнорируется.
 */
const AXIS_LOCK_RATIO = 0.5;

interface SwipeNavOptions {
  /** Целевой роут при свайпе влево (→ следующий таб). */
  nextUrl: string | null;
  /** Целевой роут при свайпе вправо (→ предыдущий таб). */
  prevUrl: string | null;
  /** Отключить хук полностью (например, на форм-страницах). */
  disabled?: boolean;
}

interface TouchState {
  startX: number;
  startY: number;
  handled: boolean;
}

/**
 * Возвращает обработчики touch-событий для горизонтального свайп-перехода
 * между соседними вкладками нижней навигации.
 *
 * Использование:
 * ```tsx
 * const { onTouchStart, onTouchEnd } = useSwipeNav({ prevUrl, nextUrl });
 * <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
 *   <Outlet />
 * </div>
 * ```
 */
export function useSwipeNav({ nextUrl, prevUrl, disabled }: SwipeNavOptions) {
  const navigate = useNavigate();
  const touch = useRef<TouchState | null>(null);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;
      const t = e.touches[0];
      touch.current = { startX: t.clientX, startY: t.clientY, handled: false };
    },
    [disabled]
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || !touch.current || touch.current.handled) return;
      touch.current.handled = true;

      const t = e.changedTouches[0];
      const dx = t.clientX - touch.current.startX;
      const dy = t.clientY - touch.current.startY;

      // Проверяем, что свайп достаточно горизонтальный
      if (Math.abs(dx) < SWIPE_THRESHOLD) return;
      if (Math.abs(dy) > Math.abs(dx) * (1 - AXIS_LOCK_RATIO)) return;

      if (dx < 0 && nextUrl) {
        // Свайп влево → следующий таб
        navigate(nextUrl);
      } else if (dx > 0 && prevUrl) {
        // Свайп вправо → предыдущий таб
        navigate(prevUrl);
      }
    },
    [disabled, nextUrl, prevUrl, navigate]
  );

  return { onTouchStart, onTouchEnd };
}
