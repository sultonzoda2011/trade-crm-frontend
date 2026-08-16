import { useEffect } from 'react';

/**
 * Обработка аппаратной кнопки "назад" на Android внутри Capacitor-обёртки.
 * В обычном браузере (веб) capacitor-плагин не установлен физически на
 * устройстве — App.addListener просто не сработает, хук безопасен и там,
 * и там (динамический import, чтобы веб-сборка не тянула нативный плагин).
 *
 * Логика:
 * 1. Если открыт Dialog/Sheet (наш ui-кит на base-ui, оба используют
 *    data-slot="dialog-content" / "sheet-content" и закрываются по Escape
 *    "из коробки") — шлём synthetic Escape вместо навигации.
 * 2. Иначе, если есть куда возвращаться в истории — history.back().
 * 3. Иначе (мы на корневом экране, например /dashboard) — сворачиваем
 *    приложение, а не "проваливаемся" в пустой экран/выход из WebView.
 */
export function useCapacitorBackButton() {
  useEffect(() => {
    let removeListener: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      let App: typeof import('@capacitor/app').App;
      try {
        ({ App } = await import('@capacitor/app'));
      } catch {
        return; // плагин не установлен (обычный веб) — ничего не делаем
      }
      if (cancelled) return;

      const handle = await App.addListener('backButton', () => {
        const openOverlay = document.querySelector<HTMLElement>(
          '[data-slot="dialog-content"][data-open], [data-slot="sheet-content"][data-open]'
        );

        if (openOverlay) {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
          return;
        }

        if (window.history.length > 1) {
          window.history.back();
        } else {
          void App.minimizeApp();
        }
      });

      removeListener = () => void handle.remove();
    })();

    return () => {
      cancelled = true;
      removeListener?.();
    };
  }, []);
}
