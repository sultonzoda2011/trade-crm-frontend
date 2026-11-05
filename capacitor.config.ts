import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

/**
 * TradeCRM — мобильная обёртка.
 *
 * appId: 'com.tradecrm.app'
 * webDir: 'build/client' — react-router.config.ts стоит ssr: false,
 * поэтому `npm run build` кладёт статический SPA-бандл именно туда.
 */
const config: CapacitorConfig = {
  appId: 'com.tradecrm.app',
  appName: 'TradeCRM',
  webDir: 'build/client',
  server: {
    androidScheme: 'https',
  },
  plugins: {
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
