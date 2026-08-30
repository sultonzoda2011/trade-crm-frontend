// app/lib/offline/localIds.ts
//
// Все id в Prisma-схеме — String @id @default(uuid()), без autoincrement.
// Значит клиент может сам сгенерировать uuid для новой записи offline и
// отправить его на сервер при создании (Prisma принимает явный id в create).
// Это убирает целый класс проблем remapping'а временных id при синхронизации:
// офлайн-запись создаётся сразу с тем id, который у неё останется навсегда.

export function newLocalId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // Фолбэк для окружений без crypto.randomUUID (старые WebView) — не
  // криптостойкий, но уникальности внутри одного устройства достаточно.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
