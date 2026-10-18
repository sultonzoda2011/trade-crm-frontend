/**
 * Когда именно операция дошла до сервера (в памяти, не персистится).
 *
 * Нужно оверлею списков (offline-overlay.ts): строка «в очереди» должна исчезнуть
 * не в момент ответа сервера, а когда список успел перезапроситься и показывает
 * уже настоящую запись — иначе между ответом и обновлением списка запись на
 * мгновение пропала бы, а потом появилась бы снова.
 *
 * Ключ — Idempotency-Key операции: он уникален и переживает перезапуск очереди.
 */

/** Сколько отправленная операция вообще может влиять на списки — страховка, если список так и не обновился. */
export const SENT_OVERLAY_MAX_MS = 60_000;

const sentAt = new Map<string, number>();

export function markSent(idempotencyKey: string): void {
  sentAt.set(idempotencyKey, Date.now());
}

export function getSentAt(idempotencyKey: string): number | undefined {
  return sentAt.get(idempotencyKey);
}

export function forgetSent(idempotencyKey: string): void {
  sentAt.delete(idempotencyKey);
}

export function clearSent(): void {
  sentAt.clear();
}
