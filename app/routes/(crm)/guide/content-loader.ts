import { fallbackLng } from '~/lib/i18n';

/**
 * Vite инлайнит все markdown-файлы справочника как сырые строки прямо в чанк
 * роута /guide (eager glob). Никаких сетевых запросов в рантайме — важно для
 * оффлайна в Android-APK. Паттерн относительный (без скобок из "(crm)"),
 * поэтому extglob-скобки в шаблоне не мешают.
 */
const modules = import.meta.glob('./content/*/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

// Индексируем содержимое по ключу "lng/id" (например, "ru/basics").
const byKey: Record<string, string> = {};
for (const path in modules) {
  const match = path.match(/\/content\/([^/]+)\/([^/]+)\.md$/);
  if (match) byKey[`${match[1]}/${match[2]}`] = modules[path];
}

/**
 * Возвращает markdown-тело раздела на нужном языке. Если перевода нет —
 * откатывается на язык по умолчанию (ru), затем на пустую строку.
 */
export function getSectionBody(id: string, lng: string): string {
  return byKey[`${lng}/${id}`] ?? byKey[`${fallbackLng}/${id}`] ?? '';
}
