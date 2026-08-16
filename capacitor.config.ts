import type { CapacitorConfig } from '@capacitor/cli';

/**
 * TradeCRM — мобильная обёртка.
 *
 * appId — поменять на реальный (обратный домен, напр. com.tradecrm.app)
 * перед `npx cap add android` / `npx cap add ios`, менять его после
 * первого релиза в стор нельзя.
 *
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
    StatusBar: {
      // overlaysWebView: false — статус-бар не наезжает на контент,
      // цвет/стиль синхронизируем в рантайме с темой (см. app/lib/capacitor-status-bar.ts)
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
