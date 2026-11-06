import { Capacitor } from '@capacitor/core';

let hidden = false;

/**
 * Прячет системный сплэш Android, когда приложение нарисовало первый экран.
 *
 * Системный сплэш (иконка на цвете приложения) держится с запуска процесса — это
 * закрывает холодный старт WebView и инициализацию i18n, пока на экране ещё нечего показывать.
 * Звать после того, как смонтирован layout с реальным содержимым (см. useHideNativeSplash):
 * раньше — на экране вспыхнет пустой фон, позже — сплэш просто дольше задержит вход.
 *
 * Безопасно звать много раз и в браузере (там ничего не делает). Если JS так и не дойдёт до
 * этого места, сплэш уберёт нативный таймер `launchShowDuration` из capacitor.config.ts.
 */
export function hideNativeSplash(): void {
  if (hidden || typeof window === 'undefined' || !Capacitor.isNativePlatform()) return;
  hidden = true;

  // Два кадра: первый коммитит React, второй — реально рисует его. Прячем после второго,
  // иначе между сплэшем и содержимым мелькнёт пустой кадр.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      void import('@capacitor/splash-screen')
        .then(({ SplashScreen }) => SplashScreen.hide({ fadeOutDuration: 180 }))
        .catch(() => {
          // Нет плагина или сплэш уже скрыт — ничего не делаем.
        });
    });
  });
}
