import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

/**
 * Тактильная обратная связь для ключевых действий и жестов.
 *
 * В Android-оболочке работает через нативный плагин @capacitor/haptics,
 * обеспечивая физический системный отклик. В браузере при поддержке
 * откатывается к Vibration API. Ошибки безопасно глушатся,
 * вызывающий код никогда не должен оборачивать вызов в try/catch.
 */
export type HapticKind = 'selection' | 'light' | 'medium' | 'success' | 'warning' | 'error';

const FALLBACK_VIBRATION_MS: Record<HapticKind, number | number[]> = {
  selection: 6,
  light: 10,
  medium: 18,
  success: [10, 40, 10],
  warning: [18, 50, 18],
  error: [25, 60, 25, 60, 35],
};

/**
 * Одно действие может вызвать отклик с двух сторон сразу — например, мутация (общий «успех» в query-client)
 * и экран успеха (showSuccess). Два одинаковых «успеха» подряд ощущаются как дрожь, а не подтверждение,
 * поэтому одинаковое уведомление в пределах этого окна считаем одним.
 */
const DEDUPE_WINDOW_MS = 250;
let lastKind: HapticKind | null = null;
let lastAt = 0;

export function haptic(kind: HapticKind = 'light'): void {
  if (typeof window === 'undefined') return;

  // Только «уведомления»: быстрые тики выбора (стрелки порядка, прокрутка пикера) должны отзываться на каждый тап.
  if (kind === 'success' || kind === 'warning' || kind === 'error') {
    const now = Date.now();
    if (kind === lastKind && now - lastAt < DEDUPE_WINDOW_MS) return;
    lastKind = kind;
    lastAt = now;
  }

  try {
    if (Capacitor.isNativePlatform()) {
      switch (kind) {
        case 'selection':
          void Haptics.selectionChanged().catch(() => {});
          break;
        case 'success':
          void Haptics.notification({ type: NotificationType.Success }).catch(() => {});
          break;
        case 'warning':
          void Haptics.notification({ type: NotificationType.Warning }).catch(() => {});
          break;
        case 'error':
          void Haptics.notification({ type: NotificationType.Error }).catch(() => {});
          break;
        case 'medium':
          void Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
          break;
        case 'light':
        default:
          void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
          break;
      }
      return;
    }

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(FALLBACK_VIBRATION_MS[kind]);
    }
  } catch {
    // Тактильный отклик — улучшение UX; никогда не прерывает вызывающее действие.
  }
}
