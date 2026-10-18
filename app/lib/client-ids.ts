/**
 * Клиентские (временные) идентификаторы для записей, которые ещё не дошли до сервера.
 *
 * Зачем: должника можно создать без связи и тут же «дать ему долг». Настоящий id
 * у него появится только после ответа сервера, поэтому на время ожидания запись
 * живёт под `local-<uuid>`, а транзакция ссылается именно на этот id. Перед
 * отправкой транзакции id подменяется на настоящий (`resolveRealId`) — очередь
 * последовательная, поэтому к этому моменту должник уже создан.
 *
 * Соответствие «временный → настоящий» хранится в localStorage: после перезапуска
 * приложения очередь продолжает отправку и по-прежнему знает, кто есть кто.
 */

export const CLIENT_ID_PREFIX = 'local-';

const STORAGE_KEY = 'tradecrm-client-ids';

/**
 * `crypto.randomUUID()` требует secure context (https/localhost) — в APK это не
 * проблема (androidScheme: 'https'), но при `cap run --livereload --external`
 * WebView грузит страницу по http с LAN-адреса, и randomUUID оказывается
 * undefined. getRandomValues secure context не требует; Math.random — на случай
 * совсем старого WebView без crypto.
 */
export function createUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  return `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export const createClientId = (): string => `${CLIENT_ID_PREFIX}${createUuid()}`;

export const isClientId = (id: string | null | undefined): id is string =>
  typeof id === 'string' && id.startsWith(CLIENT_ID_PREFIX);

function readMap(): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

// Копия в памяти — на случай, когда localStorage недоступен (приватный режим):
// внутри одной сессии соответствие всё равно не потеряется.
const memory = new Map<string, string>();

function writeMap(map: Record<string, string>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* не критично: останется копия в памяти */
  }
}

/** Запомнить, что временный id стал настоящим (вызывается, когда сервер создал запись). */
export function rememberRealId(clientId: string, realId: string): void {
  if (!isClientId(clientId) || !realId) return;
  memory.set(clientId, realId);
  const map = readMap();
  map[clientId] = realId;
  writeMap(map);
}

/** Настоящий id для временного; для обычного id или ещё не созданной записи — тот же id. */
export function resolveRealId<T extends string | null | undefined>(id: T): T | string {
  if (!isClientId(id)) return id;
  return memory.get(id) ?? readMap()[id] ?? id;
}

/** Забыть все соответствия: при выходе из аккаунта или смене пользователя. */
export function clearClientIds(): void {
  memory.clear();
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ничего */
  }
}
