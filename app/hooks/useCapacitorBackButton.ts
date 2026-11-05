import { useEffect } from 'react';
import { executeTopBackHandler } from '~/lib/back-handler';
import { getClientUser } from '~/lib/auth-utils';
import { Role } from '~/types/common';

function isRootRoute(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const user = getClientUser();
  const isSeller = user?.role === Role.Seller;

  if (path === '/login' || path === '/auth/login') return true;
  if (path === '/' || path === '') return true;

  if (isSeller) {
    return path === '/transactions';
  }
  return path === '/dashboard';
}

/**
 * Предсказуемая система обработки Android Back Button:
 *
 * Приоритет:
 * 1. Кастомный стек обработчиков (executeTopBackHandler).
 * 2. Открытый Bottom Sheet ([data-slot="sheet-content"]).
 * 3. Открытый Dialog или Modal ([data-slot="dialog-content"]).
 * 4. Открытое меню, Picker, Combobox или всплывающий календарь.
 * 5. Навигация назад по истории приложения.
 * 6. Если пользователь на корневом экране — сворачивание приложения (App.minimizeApp),
 *    исключая случайное закрытие или белый экран.
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
        return; // Веб-среда без Capacitor
      }
      if (cancelled) return;

      const handle = await App.addListener('backButton', () => {
        // 1. Проверяем зарегистрированные кастомные обработчики
        if (executeTopBackHandler()) {
          return;
        }

        // 2. Закрытие Bottom Sheet
        const openSheet = document.querySelector<HTMLElement>(
          '[data-slot="sheet-content"][data-open], [data-slot="sheet-content"]:not([data-closed])'
        );
        if (openSheet) {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
          return;
        }

        // 3. Закрытие Dialog / Modal
        const openDialog = document.querySelector<HTMLElement>(
          '[data-slot="dialog-content"][data-open], [data-slot="dialog-content"]:not([data-closed])'
        );
        if (openDialog) {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
          return;
        }

        // 4. Закрытие Dropdown / Combobox / Popover / Flatpickr
        const openMenuOrPicker = document.querySelector<HTMLElement>(
          '[data-slot="combobox-content"][data-open], [data-slot="dropdown-menu-content"][data-open], .flatpickr-calendar.open'
        );
        if (openMenuOrPicker) {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
          return;
        }

        // 5. Корневой экран -> Сворачивание
        if (isRootRoute()) {
          void App.minimizeApp();
          return;
        }

        // 6. Навигация назад
        const historyIdx = (window.history.state as { idx?: number } | null)?.idx;
        if (typeof historyIdx === 'number' ? historyIdx > 0 : window.history.length > 1) {
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
