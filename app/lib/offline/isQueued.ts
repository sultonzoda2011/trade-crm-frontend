// Синтетический ответ, который client.ts возвращает вместо реального успеха,
// когда мутация была поставлена в офлайн-очередь (см. app/lib/client.ts).
// Три места вызова (create-транзакция, оплата, возврат) проверяют это, чтобы
// показать корректный тост вместо "успешно выполнено".
export function isOfflineQueuedResponse(data: unknown): boolean {
  return Boolean(data && typeof data === 'object' && (data as any).offlineQueued === true);
}
