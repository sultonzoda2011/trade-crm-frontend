import { WifiOff } from 'lucide-react';

/**
 * Товар/категория трогают остаток и цену — если разрешить редактировать их
 * офлайн, при синхронизации может случиться last-write-wins на складе.
 * Поэтому эти формы просто требуют интернет, без офлайн-варианта — банер
 * объясняет почему кнопка неактивна, а не просто дизейблит её молча.
 */
export function RequiresOnlineBanner() {
  return (
    <div className="border-warning/30 bg-warning/10 text-warning-foreground flex items-center gap-2 rounded-lg border p-3 text-sm">
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>Нет подключения к интернету — эта форма требует сеть.</span>
    </div>
  );
}
