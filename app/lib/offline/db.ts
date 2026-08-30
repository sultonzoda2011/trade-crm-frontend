// app/lib/offline/db.ts
//
// Локальное хранилище офлайн-данных на чистом IndexedDB, без внешних
// зависимостей и без нативных плагинов Capacitor. WebView в Capacitor
// (на Android — системный Chrome-движок) поддерживает IndexedDB "из коробки",
// поэтому не нужен ни @capacitor-community/sqlite, ни какая-либо настройка
// в capacitor.config.ts — работает одинаково в браузере (`npm run dev`)
// и в собранном APK.
//
// Структура:
//   records  — универсальное хранилище сущностей: { key: "entity:id", entity, id, data, updatedAt }
//              (products / categories / debtors / transactions)
//   outbox   — очередь несинхронизированных действий, см. outbox.ts
//   meta     — служебные значения (lastSyncedAt и т.п.)

export type OfflineEntity = 'products' | 'categories' | 'debtors' | 'transactions';

const DB_NAME = 'tradecrm-offline';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function hasIndexedDB(): boolean {
  return typeof indexedDB !== 'undefined';
}

function openDb(): Promise<IDBDatabase> {
  if (!hasIndexedDB()) {
    return Promise.reject(new Error('IndexedDB is not available in this environment'));
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('records')) {
        const store = db.createObjectStore('records', { keyPath: 'key' });
        store.createIndex('entity', 'entity', { unique: false });
      }
      if (!db.objectStoreNames.contains('outbox')) {
        const store = db.createObjectStore('outbox', { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  return dbPromise;
}

/** true, если IndexedDB реально доступен и открывается (не приватный режим и т.п.). */
export async function isOfflineStoreAvailable(): Promise<boolean> {
  try {
    await openDb();
    return true;
  } catch {
    return false;
  }
}

function tx<T>(storeName: string, mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(storeName, mode);
        const store = t.objectStore(storeName);
        const req = run(store);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

// ---------- records ----------

export interface StoredRecord<T = unknown> {
  key: string;
  entity: OfflineEntity;
  id: string;
  data: T;
  updatedAt: string;
}

const recordKey = (entity: OfflineEntity, id: string) => `${entity}:${id}`;

export async function upsertRecord<T extends { id: string; updatedAt?: string }>(
  entity: OfflineEntity,
  data: T
): Promise<void> {
  const row: StoredRecord<T> = {
    key: recordKey(entity, data.id),
    entity,
    id: data.id,
    data,
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  };
  await tx('records', 'readwrite', (store) => store.put(row));
}

export async function upsertRecords<T extends { id: string; updatedAt?: string }>(
  entity: OfflineEntity,
  items: T[]
): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction('records', 'readwrite');
    const store = t.objectStore('records');
    for (const data of items) {
      store.put({
        key: recordKey(entity, data.id),
        entity,
        id: data.id,
        data,
        updatedAt: data.updatedAt ?? new Date().toISOString(),
      } satisfies StoredRecord<T>);
    }
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}

export async function deleteRecord(entity: OfflineEntity, id: string): Promise<void> {
  await tx('records', 'readwrite', (store) => store.delete(recordKey(entity, id)));
}

export async function getRecord<T>(entity: OfflineEntity, id: string): Promise<T | null> {
  const row = await tx<StoredRecord<T> | undefined>('records', 'readonly', (store) => store.get(recordKey(entity, id)));
  return row?.data ?? null;
}

export async function listRecords<T>(entity: OfflineEntity): Promise<T[]> {
  const db = await openDb();
  return new Promise<T[]>((resolve, reject) => {
    const t = db.transaction('records', 'readonly');
    const index = t.objectStore('records').index('entity');
    const range = IDBKeyRange.only(entity);
    const result: T[] = [];
    const cursorReq = index.openCursor(range);
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result;
      if (cursor) {
        result.push((cursor.value as StoredRecord<T>).data);
        cursor.continue();
      } else {
        resolve(result);
      }
    };
    cursorReq.onerror = () => reject(cursorReq.error);
  });
}

// ---------- meta ----------

export async function getMeta(key: string): Promise<string | null> {
  const row = await tx<{ key: string; value: string } | undefined>('meta', 'readonly', (store) => store.get(key));
  return row?.value ?? null;
}

export async function setMeta(key: string, value: string): Promise<void> {
  await tx('meta', 'readwrite', (store) => store.put({ key, value }));
}

// ---------- outbox (см. также outbox.ts — тонкая обёртка с доменными хелперами) ----------

export interface OutboxRow {
  id: string;
  method: 'post' | 'patch' | 'put' | 'delete';
  url: string;
  body: unknown;
  entity: OfflineEntity;
  localId: string;
  createdAt: string;
  status: 'pending' | 'syncing' | 'error';
  error?: string;
}

export async function addOutboxRow(row: OutboxRow): Promise<void> {
  await tx('outbox', 'readwrite', (store) => store.add(row));
}

export async function listOutboxRows(): Promise<OutboxRow[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction('outbox', 'readonly');
    const store = t.objectStore('outbox');
    const req = store.getAll();
    req.onsuccess = () => {
      // FIFO: очередь обязана применяться в порядке создания, иначе,
      // например, оплата долга может уйти на сервер раньше самого долга.
      const rows = (req.result as OutboxRow[]).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      resolve(rows);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function updateOutboxRow(id: string, patch: Partial<OutboxRow>): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction('outbox', 'readwrite');
    const store = t.objectStore('outbox');
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const current = getReq.result as OutboxRow | undefined;
      if (!current) return resolve();
      store.put({ ...current, ...patch });
    };
    getReq.onerror = () => reject(getReq.error);
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}

export async function removeOutboxRow(id: string): Promise<void> {
  await tx('outbox', 'readwrite', (store) => store.delete(id));
}

export async function countPendingOutbox(): Promise<number> {
  const rows = await listOutboxRows();
  return rows.filter((r) => r.status !== 'error').length;
}
