/**
 * Класс устройства по объёму памяти — чтобы на слабых телефонах отключать самые дорогие эффекты.
 *
 * Пишет `data-perf="lite" | "full"` на <html>; CSS (global.css, «Лёгкий режим эффектов»)
 * по нему выключает backdrop-filter. Сейчас это единственная разница между режимами.
 *
 * `navigator.deviceMemory` отдаёт приблизительные гигабайты, округлённые до степени двойки (…2, 4, 8),
 * только в защищённом контексте — в Capacitor он есть (схема https). Если значения нет, считаем устройство обычным.
 * Порог подобран без замеров на устройствах — это настройка, а не закон: если плавность на 4 ГБ телефонах
 * окажется хорошей, понизьте LITE_MAX_MEMORY_GB до 2.
 *
 * Принудительно: localStorage.setItem('perf', 'lite' | 'full') и перезапуск.
 */
const LITE_MAX_MEMORY_GB = 4;

export type DeviceTier = 'lite' | 'full';

export function detectDeviceTier(): DeviceTier {
  try {
    const forced = window.localStorage.getItem('perf');
    if (forced === 'lite' || forced === 'full') return forced;
  } catch {
    // Хранилище недоступно — решаем по железу.
  }

  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return typeof memory === 'number' && memory <= LITE_MAX_MEMORY_GB ? 'lite' : 'full';
}

export function applyDeviceTier(): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.perf = detectDeviceTier();
}
