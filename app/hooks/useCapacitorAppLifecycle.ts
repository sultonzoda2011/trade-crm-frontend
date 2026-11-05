import { useEffect } from 'react';
import { focusManager } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';

/**
 * Синхронизирует жизненный цикл приложения (Android App State)
 * с фокусом TanStack Query (focusManager).
 *
 * В Android WebView стандартные события window focus/blur не всегда срабатывают
 * при сворачивании и восстановлении приложения. @capacitor/app 'appStateChange'
 * гарантирует точное уведомление о восстановлении приложения (isActive: true),
 * позволяя TanStack Query безопасно актуализировать данные с учётом staleTime.
 */
export function useCapacitorAppLifecycle() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;
    let removeListener: (() => void) | undefined;

    void (async () => {
      try {
        const { App } = await import('@capacitor/app');
        if (cancelled) return;

        const handle = await App.addListener('appStateChange', (state) => {
          focusManager.setFocused(state.isActive);
        });

        removeListener = () => void handle.remove();
      } catch {
        // Веб или среда без плагина
      }
    })();

    return () => {
      cancelled = true;
      removeListener?.();
    };
  }, []);
}
