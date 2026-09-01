// Единая точка проверки платформы: нативный Android (Capacitor) vs всё
// остальное (веб-браузер, Vercel-деплой). SQLite-плагин
// используем только на native — на остальных таргетах он не установлен
// физически на устройстве и упадёт при вызове, поэтому везде, где мы его
// трогаем, сначала проверяем эту функцию (как и другие app/hooks/useCapacitor*).
export async function isNativePlatform(): Promise<boolean> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}
