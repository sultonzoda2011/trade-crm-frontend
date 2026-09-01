import { getStore } from './store';

// Очередь отложенных мутаций. Сознательно узкий охват — только то, что
// реально нужно офлайн для этого приложения: создание транзакции, оплата
// долга, возврат. Остальные сущности (products/categories/debtors/markets/
// sellers) офлайн только читаются из readCache, без очереди на запись.
// Удаление НИКОГДА не ставится в очередь — этот кейс сюда не заводим вовсе.
export type QueuedKind = 'transaction:create' | 'transaction:pay' | 'transaction:refund';
export type QueueStatus = 'pending' | 'syncing' | 'failed';

export interface QueuedMutation {
  id: string; // = Idempotency-Key, отправляется на бэк как есть
  kind: QueuedKind;
  method: 'post' | 'patch';
  url: string; // относительный путь, напр. '/transactions' или '/transactions/{id}/pay'
  payload: unknown;
  status: QueueStatus;
  attempts: number;
  error: string | null;
  createdAt: string;
}

const MAX_ATTEMPTS = 5;

export async function enqueueMutation(
  input: Pick<QueuedMutation, 'kind' | 'method' | 'url' | 'payload'>
): Promise<QueuedMutation> {
  const store = await getStore('queue');
  const item: QueuedMutation = {
    id: crypto.randomUUID(),
    status: 'pending',
    attempts: 0,
    error: null,
    createdAt: new Date().toISOString(),
    ...input,
  };
  await store.set(item.id, JSON.stringify(item));
  return item;
}

export async function listQueue(): Promise<QueuedMutation[]> {
  const store = await getStore('queue');
  const keys = await store.keys();
  const items = await Promise.all(keys.map((k) => store.get(k)));
  return items
    .filter((raw): raw is string => raw !== null)
    .map((raw) => JSON.parse(raw) as QueuedMutation)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt)); // FIFO — важно для create -> pay/refund той же транзакции
}

export async function updateQueueItem(id: string, patch: Partial<QueuedMutation>): Promise<void> {
  const store = await getStore('queue');
  const raw = await store.get(id);
  if (!raw) return;
  const merged = { ...(JSON.parse(raw) as QueuedMutation), ...patch };
  await store.set(id, JSON.stringify(merged));
}

export async function removeQueueItem(id: string): Promise<void> {
  const store = await getStore('queue');
  await store.delete(id);
}

export function hasExceededRetries(item: QueuedMutation): boolean {
  return item.attempts >= MAX_ATTEMPTS;
}
