import { useEffect } from 'react';
import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core';

/**
 * Синхронизирует стиль и цвет системных панелей (Status Bar и Navigation/Gesture Bar)
 * с текущей темой приложения.
 *
 * Capacitor 8 SystemBars управляет иконками статус-бара и навигационной панели
 * на Android 15/16 (где edge-to-edge обязателен и StatusBar.setBackgroundColor игнорируется).
 * Для устройств с Android <15 дополнительно задаётся фоновый цвет статус-бара
 * (#f2f2f7 для светлой темы, #000000 для тёмной темы) через @capacitor/status-bar.
 */
export function useCapacitorStatusBar(currentTheme: string | undefined) {
  useEffect(() => {
    if (!currentTheme) return;
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;

    void (async () => {
      const isDark = currentTheme === 'dark';

      // 1. Управление системными панелями через Capacitor 8 SystemBars API (Android 14/15/16)
      try {
        await SystemBars.setStyle({
          style: isDark ? SystemBarsStyle.Dark : SystemBarsStyle.Light,
        });
      } catch {
        // Игнорируем ошибку, если платформа/webview не поддерживает вызов
      }

      if (cancelled) return;

      // 2. Обратная совместимость для Android <15: установка фонового цвета
      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        if (cancelled) return;

        await StatusBar.setStyle({
          style: isDark ? Style.Dark : Style.Light,
        }).catch(() => {});

        // Цвет фона точно соответствует CSS-переменной --background
        await StatusBar.setBackgroundColor({
          color: isDark ? '#000000' : '#f2f2f7',
        }).catch(() => {});
      } catch {
        // Веб или среда без плагина
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentTheme]);
}
