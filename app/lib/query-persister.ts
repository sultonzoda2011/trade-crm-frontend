import type { DehydratedState, Query } from '@tanstack/react-query';
import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client';
import { toPlainError } from '~/lib/offline-errors';
import { offlineStorage } from '~/lib/offline-storage';

/**
 * Бампается только при несовместимом изменении формы кеша (например,
 * серьёзный рефакторинг query-keys), чтобы старые персистентные записи
 * не ломали новую версию приложения — см. `buster` в persistQueryClient.
 */
export const CACHE_BUSTER = 'v1';

/**
 * Персистер кеша: ПО СТРОКЕ НА ЗАПРОС, а не одним блобом.
 *
 * Первая версия (createAsyncStoragePersister) писала весь кеш одной строкой
 * JSON. Пока в кеше десятки КБ — это работает, но «синхронизировать всё»
 * кладёт в него мегабайты, и тут две беды:
 *   1. Android читает SQLite через CursorWindow (~2 МБ): строка больше окна
 *      просто не читается, и ВЕСЬ кеш пропадает при следующем запуске.
 *   2. Любое изменение одного запроса переписывало бы весь блоб целиком.
 *
 * Теперь каждый запрос лежит под ключом `q:<queryHash>`, пишется только если
 * изменился (сравнение по dataUpdatedAt) и читается батчами по суммарному
 * размеру. Очередь офлайн-мутаций — отдельная небольшая строка `m:state`.
 */

const QUERY_PREFIX = 'q:';
const MUTATIONS_KEY = 'm:state';
const META_KEY = 'meta';
/** Ключ, под которым прошлая версия хранила весь кеш одним блобом. */
const LEGACY_KEY = 'tradecrm-query-cache';
const LEGACY_FLAG = 'tradecrm-cache-legacy-cleaned';

/** Запрос крупнее этого (в символах) не сохраняется: в память он попадёт, на диск — нет. */
const MAX_ROW_CHARS = 600_000;
/** Без throttle запись шла бы на каждый чих кеша. */
const FLUSH_DELAY_MS = 1000;
const RETRY_DELAY_MS = 5000;
const MAX_FLUSH_RETRIES = 3;

type DehydratedQuery = DehydratedState['queries'][number];
type DehydratedMutation = DehydratedState['mutations'][number];

/** queryHash → отпечаток последней записанной на диск версии. */
const known = new Map<string, string>();
/** Последняя записанная сериализация очереди ('' — очередь на диске пуста). */
let knownMutations = '';

let pending: PersistedClient | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let retries = 0;
/** Все операции с диском идут строго по очереди: сброс кеша не должен пересечься с записью. */
let chain: Promise<unknown> = Promise.resolve();

const fingerprint = (query: DehydratedQuery) => String(query.state.dataUpdatedAt);

/**
 * Неудачный повторный запрос (слабая сеть!) переводит запрос в status 'error', но
 * данные прошлой загрузки остаются. Для диска важно именно «данные есть»: пишем их
 * как успешные, иначе после перезапуска страница покажет ошибку вместо кеша.
 */
function asSuccess(query: DehydratedQuery): DehydratedQuery {
  const { state } = query;
  if (state.status === 'success' && !state.error) return query;
  return {
    ...query,
    state: { ...state, status: 'success', error: null, errorUpdatedAt: 0, fetchFailureCount: 0, fetchFailureReason: null },
  };
}

/** Очередь на диск: только то, что ещё предстоит отправить или что упало и ждёт решения пользователя. */
function serializeMutations(mutations: DehydratedMutation[]): string {
  const alive = mutations
    .filter((mutation) => mutation.state.status === 'pending' || mutation.state.status === 'error')
    .map((mutation) => ({
      ...mutation,
      state: {
        ...mutation.state,
        // Ответ и контекст в очереди не нужны; а ошибку axios нельзя писать на
        // диск как есть — в ней лежит config с заголовком Authorization.
        data: undefined,
        context: undefined,
        failureReason: null,
        error: mutation.state.error ? toPlainError(mutation.state.error) : null,
        // Отправка, прерванная закрытием приложения, после запуска снова
        // «ждёт сети» — иначе resumePausedMutations её не подхватит.
        isPaused: mutation.state.status === 'pending' ? true : mutation.state.isPaused,
      },
    }));
  return alive.length > 0 ? JSON.stringify(alive) : '';
}

async function doFlush(): Promise<void> {
  timer = null;
  const client = pending;
  pending = null;
  if (!client) return;

  const seen = new Set<string>();
  const writes: Array<readonly [string, string]> = [];
  const removes: string[] = [];
  const nextKnown = new Map<string, string>();
  const removedHashes: string[] = [];

  for (const query of client.clientState.queries) {
    seen.add(query.queryHash);
    const print = fingerprint(query);
    if (known.get(query.queryHash) === print) continue;

    const json = JSON.stringify(asSuccess(query));
    if (json.length > MAX_ROW_CHARS) {
      // Слишком большой для надёжного чтения с Android — на диск не кладём,
      // а устаревшую версию этой строки убираем, чтобы не показать старое.
      removes.push(QUERY_PREFIX + query.queryHash);
    } else {
      writes.push([QUERY_PREFIX + query.queryHash, json]);
    }
    nextKnown.set(query.queryHash, print);
  }

  // Запрос исчез из кеша (removeQueries / clear / gc) — убираем его строку.
  for (const hash of known.keys()) {
    if (!seen.has(hash)) {
      removes.push(QUERY_PREFIX + hash);
      removedHashes.push(hash);
    }
  }

  const mutationsJson = serializeMutations(client.clientState.mutations);
  const mutationsChanged = mutationsJson !== knownMutations;
  if (mutationsChanged) {
    if (mutationsJson) writes.push([MUTATIONS_KEY, mutationsJson]);
    else removes.push(MUTATIONS_KEY);
  }

  if (writes.length === 0 && removes.length === 0) return;

  // Метка времени идёт первой в том же пакете: строки без неё не восстановятся.
  writes.unshift([META_KEY, JSON.stringify({ timestamp: client.timestamp, buster: client.buster })]);

  const wrote = await offlineStorage.setMany(writes);
  const removed = removes.length > 0 ? await offlineStorage.removeMany(removes) : true;

  if (wrote) {
    for (const [hash, print] of nextKnown) known.set(hash, print);
    if (mutationsChanged && mutationsJson) knownMutations = mutationsJson;
  }
  if (removed) {
    for (const hash of removedHashes) known.delete(hash);
    if (mutationsChanged && !mutationsJson) knownMutations = '';
  }

  // Запись не удалась (диск, закрытая база) — не считаем сохранённым и пробуем ещё раз.
  if ((!wrote || !removed) && retries < MAX_FLUSH_RETRIES) {
    retries += 1;
    pending ??= client;
    schedule(RETRY_DELAY_MS);
  } else {
    retries = 0;
  }
}

function runFlush(): Promise<void> {
  const job = chain.then(doFlush, doFlush);
  chain = job.catch(() => undefined);
  return job;
}

function schedule(delay = FLUSH_DELAY_MS) {
  if (timer) return;
  timer = setTimeout(() => void runFlush(), delay);
}

/** Дописать на диск всё, что ещё ждёт throttle — перед тем как приложение уйдёт в фон. */
export function flushPersistedCache(): Promise<void> {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  return runFlush();
}

if (typeof document !== 'undefined') {
  const onHide = () => {
    if (document.visibilityState === 'hidden') void flushPersistedCache();
  };
  document.addEventListener('visibilitychange', onHide);
  window.addEventListener('pagehide', () => void flushPersistedCache());
}

/** Раскладывает ключи по пакетам, чтобы один ответ SQLite не превысил окно курсора. */
function batchKeysByBytes(infos: Array<{ key: string; bytes: number }>): string[][] {
  const batches: string[][] = [];
  let current: string[] = [];
  let bytes = 0;
  for (const info of infos) {
    if (current.length > 0 && (bytes + info.bytes > offlineStorage.BATCH_BYTES || current.length >= 100)) {
      batches.push(current);
      current = [];
      bytes = 0;
    }
    current.push(info.key);
    bytes += info.bytes;
  }
  if (current.length > 0) batches.push(current);
  return batches;
}

/**
 * Прошлая версия хранила кеш одним блобом. Если он ещё читается — переносим его
 * построчно, чтобы после обновления приложения офлайн-данные не пропали. Если не
 * читается (слишком большой) — просто удаляем. Выполняется один раз.
 */
async function migrateLegacyBlob(): Promise<void> {
  try {
    if (typeof window === 'undefined' || window.localStorage.getItem(LEGACY_FLAG)) return;
  } catch {
    return;
  }

  const raw = await offlineStorage.getItem(LEGACY_KEY);
  if (raw !== null) {
    try {
      const legacy = JSON.parse(raw) as PersistedClient;
      if (legacy?.buster === CACHE_BUSTER && legacy.clientState?.queries) {
        pending = legacy;
        await runFlush();
      }
    } catch {
      /* битый блоб — просто удалим */
    }
  }
  await offlineStorage.removeItem(LEGACY_KEY);

  try {
    window.localStorage.setItem(LEGACY_FLAG, '1');
  } catch {
    /* не критично — миграция просто повторится */
  }
}

export const queryPersister: Persister = {
  persistClient(client) {
    pending = client;
    schedule();
  },

  async restoreClient() {
    known.clear();
    knownMutations = '';
    await migrateLegacyBlob();

    const metaRaw = await offlineStorage.getItem(META_KEY);
    if (!metaRaw) return undefined;

    let meta: { timestamp?: number; buster?: string };
    try {
      meta = JSON.parse(metaRaw);
    } catch {
      return undefined;
    }

    const infos = await offlineStorage.listKeys(QUERY_PREFIX);
    const queries: DehydratedQuery[] = [];
    const corrupt: string[] = [];

    for (const keys of batchKeysByBytes(infos)) {
      const values = await offlineStorage.getMany(keys);
      for (const [key, raw] of values) {
        try {
          const query = JSON.parse(raw) as DehydratedQuery;
          queries.push(query);
          known.set(query.queryHash, fingerprint(query));
        } catch {
          corrupt.push(key);
        }
      }
    }
    if (corrupt.length > 0) void offlineStorage.removeMany(corrupt);

    let mutations: DehydratedMutation[] = [];
    const mutationsRaw = await offlineStorage.getItem(MUTATIONS_KEY);
    if (mutationsRaw) {
      try {
        mutations = JSON.parse(mutationsRaw) as DehydratedMutation[];
        knownMutations = mutationsRaw;
      } catch {
        /* битая очередь — лучше потерять её, чем уронить восстановление кеша */
      }
    }

    return {
      timestamp: meta.timestamp ?? 0,
      buster: meta.buster ?? '',
      clientState: { queries, mutations },
    };
  },

  async removeClient() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    pending = null;
    const job = chain.then(async () => {
      known.clear();
      knownMutations = '';
      await offlineStorage.clear();
    });
    chain = job.catch(() => undefined);
    await job;
  },
};

/**
 * Что вообще стоит держать на диске. Поиск «на лету» (палитра команд, выпадающие
 * списки с поиском, строка поиска в таблице) порождает по запросу на каждый
 * набранный префикс — за год их набегут тысячи, а офлайн повторить именно этот
 * поиск никто не станет.
 */
export function shouldPersistQuery(query: Query): boolean {
  // Не `status === 'success'`: запрос, у которого последнее обновление не удалось,
  // всё равно хранит данные прошлой загрузки — их нельзя терять (см. asSuccess).
  if (query.state.data === undefined) return false;

  const key = query.queryKey as readonly unknown[];
  const kind = key[1];
  const params = key[2] as { search?: unknown } | null | undefined;

  if (kind === 'options') {
    // useAsyncSelectOptions дописывает debounced-поиск последним элементом ключа.
    const last = key[key.length - 1];
    if (typeof last === 'string' && last !== '') return false;
    if (typeof params?.search === 'string' && params.search !== '') return false;
  }
  if (kind === 'list' && typeof params?.search === 'string' && params.search.trim() !== '') return false;

  return true;
}
