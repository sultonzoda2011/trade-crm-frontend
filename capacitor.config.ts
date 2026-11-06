import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

/**
 * TradeCRM — мобильная обёртка.
 *
 * appId: 'com.tradecrm.app'
 * webDir: 'build/client' — react-router.config.ts стоит ssr: false,
 * поэтому `npm run build` кладёт статический SPA-бандл именно туда.
 *
 * Нативные настройки, которых нет в этом файле (темы, цвета окна, MainActivity,
 * подпись релиза), накатывает scripts/patch-android.mjs после `cap add android`.
 */
const config: CapacitorConfig = {
  appId: 'com.tradecrm.app',
  appName: 'TradeCRM',
  webDir: 'build/client',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      // Системный сплэш держится, пока приложение не нарисовало первый экран:
      // его прячет app/lib/native-splash.ts (hideNativeSplash). Таймер ниже —
      // страховка на случай, если JS не стартовал: сплэш не должен висеть вечно.
      launchAutoHide: true,
      launchShowDuration: 4000,
      launchFadeOutDuration: 180,
    },
    SystemBars: {
      // Capacitor 8: пробрасывает переменные --safe-area-inset-* в :root
      // и корректно учитывает IME и navigation bar на Android 15/16
      insetsHandling: 'css',
      style: 'DEFAULT',
    },
    StatusBar: {
      // Для Android <15: синхронизация цвета статус-бара
      overlaysWebView: false,
    },
    Keyboard: {
      resize: KeyboardResize.Body,
      resizeOnFullScreen: true,
    },
  },
};

export default config;
