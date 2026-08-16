import { useEffect } from 'react';

/**
 * Синхронизирует цвет/стиль нативного статус-бара с текущей темой приложения.
 * currentTheme приходит уже посчитанным (theme === 'system' ? systemTheme : theme),
 * см. вызов в app/root.tsx.
 */
export function useCapacitorStatusBar(currentTheme: string | undefined) {
  useEffect(() => {
    if (!currentTheme) return;
    let cancelled = false;

    void (async () => {
      let StatusBar: typeof import('@capacitor/status-bar').StatusBar;
      let Style: typeof import('@capacitor/status-bar').Style;
      try {
        ({ StatusBar, Style } = await import('@capacitor/status-bar'));
      } catch {
        return; // веб — плагина нет, ничего не делаем
      }
      if (cancelled) return;

      const isDark = currentTheme === 'dark';
      await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
      try {
        // Android-only: на iOS цвет статус-бара не настраивается через плагин
        await StatusBar.setBackgroundColor({ color: isDark ? '#0a0a0a' : '#ffffff' });
      } catch {
        // iOS — ожидаемо, ничего не делаем
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentTheme]);
}
