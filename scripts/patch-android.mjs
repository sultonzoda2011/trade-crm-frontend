#!/usr/bin/env node
/**
 * Нативная доводка Android-проекта.
 *
 * Папка android/ не хранится в git (.gitignore) — CI создаёт её заново через
 * `npx cap add android`. Значит всё, что нельзя выразить в capacitor.config.ts
 * (темы, цвета окна, MainActivity, подпись релиза), живёт здесь и накатывается
 * сразу после `cap add android` / `cap sync android`.
 *
 * Скрипт идемпотентный: повторный запуск ничего не ломает. Если шаблон Capacitor
 * изменился и ожидаемый кусок не найден — скрипт падает с понятной ошибкой,
 * а не молча собирает «ненастроенное» приложение.
 *
 * Запуск:  node scripts/patch-android.mjs
 * Env:     ANDROID_VERSION_CODE, ANDROID_VERSION_NAME — версия сборки (CI ставит run_number)
 *          ANDROID_KEYSTORE_PATH / _PASSWORD, ANDROID_KEY_ALIAS / _PASSWORD — подпись релиза (читает gradle)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const ROOT = process.cwd();
const ANDROID = join(ROOT, 'android');
const APP = join(ANDROID, 'app');
const RES = join(APP, 'src/main/res');

if (!existsSync(APP)) {
  console.error('android/app не найден. Сначала: npx cap add android');
  process.exit(1);
}

const read = (path) => readFileSync(path, 'utf8');
const write = (path, content) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
};

/** Заменяет кусок, либо убеждается, что он уже заменён. Нет ни того ни другого — шаблон изменился, падаем. */
function patch(path, { find, replace, alreadyDone, label }) {
  const source = read(path);
  if (alreadyDone && source.includes(alreadyDone)) {
    console.log(`  = ${label} (уже применено)`);
    return;
  }
  if (typeof find === 'string' ? !source.includes(find) : !find.test(source)) {
    console.error(`  ✗ ${label}: ожидаемый фрагмент не найден в ${path} — шаблон Capacitor изменился`);
    process.exit(1);
  }
  write(path, source.replace(find, replace));
  console.log(`  + ${label}`);
}

// Цвета окна = токены --background приложения (global.css): #f2f2f7 / #000000.
// Окно видно до первого кадра WebView; без этого при запуске мелькает белое/серое.
const LIGHT_BG = '#F2F2F7';
const DARK_BG = '#000000';

console.log('Цвета окна');
write(
  join(RES, 'values/colors_app.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="app_background">${LIGHT_BG}</color>
</resources>
`
);
write(
  join(RES, 'values-night/colors_app.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="app_background">${DARK_BG}</color>
</resources>
`
);

console.log('Темы (styles.xml)');
const styles = join(RES, 'values/styles.xml');

// Основная тема: цвет окна и прозрачные (без «затемнения») системные панели жестов.
patch(styles, {
  label: 'AppTheme.NoActionBar: цвет окна, без контрастной плашки панелей',
  alreadyDone: 'android:enforceNavigationBarContrast',
  find: /(<style name="AppTheme\.NoActionBar"[^>]*>[\s\S]*?<item name="android:background">@null<\/item>)/,
  replace: `$1
        <item name="android:windowBackground">@color/app_background</item>
        <item name="android:enforceNavigationBarContrast">false</item>
        <item name="android:enforceStatusBarContrast">false</item>`,
});

// Стартовая тема: системный сплэш Android 12+ на цвете приложения, с логотипом-иконкой, и переход в основную тему.
patch(styles, {
  label: 'AppTheme.NoActionBarLaunch: фон и иконка системного сплэша',
  alreadyDone: 'windowSplashScreenBackground',
  find: /(<style name="AppTheme\.NoActionBarLaunch"[^>]*>[\s\S]*?<item name="android:background">@drawable\/splash<\/item>)/,
  replace: `$1
        <item name="windowSplashScreenBackground">@color/app_background</item>
        <item name="windowSplashScreenAnimatedIcon">@mipmap/ic_launcher_foreground</item>
        <item name="postSplashScreenTheme">@style/AppTheme.NoActionBar</item>`,
});

console.log('MainActivity');
const mainActivity = join(APP, 'src/main/java/com/tradecrm/app/MainActivity.java');
write(
  mainActivity,
  `package com.tradecrm.app;

import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = getBridge().getWebView();
        if (webView != null) {
            // Без «резинки»/свечения на краях WebView: прокрутка в приложении
            // сама решает, что делать на краю (pull-to-refresh, шторки).
            webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
            // По умолчанию фон WebView белый — в тёмной теме это вспышка до первого кадра.
            // Цвет берётся из ресурсов, поэтому сам следует светлой/тёмной теме системы.
            webView.setBackgroundColor(ContextCompat.getColor(this, R.color.app_background));
        }
    }
}
`
);
console.log('  + MainActivity.java');

console.log('Версия и подпись (app/build.gradle)');
const gradle = join(APP, 'build.gradle');

const versionCode = process.env.ANDROID_VERSION_CODE;
const versionName = process.env.ANDROID_VERSION_NAME;
if (versionCode) {
  if (!/^\d+$/.test(versionCode)) {
    console.error(`ANDROID_VERSION_CODE должен быть числом, получено: ${versionCode}`);
    process.exit(1);
  }
  patch(gradle, {
    label: `versionCode ${versionCode}`,
    find: /versionCode \d+/,
    replace: `versionCode ${versionCode}`,
  });
}
if (versionName) {
  if (!/^[\w.\-+]+$/.test(versionName)) {
    console.error(`ANDROID_VERSION_NAME содержит недопустимые символы: ${versionName}`);
    process.exit(1);
  }
  patch(gradle, {
    label: `versionName ${versionName}`,
    find: /versionName "[^"]*"/,
    replace: `versionName "${versionName}"`,
  });
}

// Подпись релиза читается из окружения при сборке — ключ и пароли в репозиторий не попадают.
// Без ANDROID_KEYSTORE_PATH release-сборка остаётся неподписанной (CI в этом случае собирает debug).
patch(gradle, {
  label: 'signingConfigs.release из окружения',
  alreadyDone: 'ANDROID_KEYSTORE_PATH',
  find: /(\n\s*)buildTypes \{/,
  replace: `$1signingConfigs {
        release {
            def keystorePath = System.getenv('ANDROID_KEYSTORE_PATH')
            if (keystorePath) {
                storeFile file(keystorePath)
                storePassword System.getenv('ANDROID_KEYSTORE_PASSWORD')
                keyAlias System.getenv('ANDROID_KEY_ALIAS')
                keyPassword System.getenv('ANDROID_KEY_PASSWORD')
            }
        }
    }
$1buildTypes {`,
});

patch(gradle, {
  label: 'buildTypes.release использует подпись',
  alreadyDone: 'signingConfig signingConfigs.release',
  find: /(release \{\s*\n\s*)(minifyEnabled false)/,
  replace: `$1if (System.getenv('ANDROID_KEYSTORE_PATH')) {
                signingConfig signingConfigs.release
            }
            $2`,
});

console.log('\nГотово.');
