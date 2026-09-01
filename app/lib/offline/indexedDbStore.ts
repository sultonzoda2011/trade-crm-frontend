import type { KvStore } from './kvStore';

// IndexedDB-реализация KvStore — используется везде, где нет нативного
// Android-рантайма (веб-превью в браузере, Electron webview, Vercel-деплой).
// Один объект-стор "kv" с составным ключом `${namespace}:${key}`, чтобы не
// плодить отдельные IndexedDB stores под каждую сущность.
const DB_NAME = 'trade-crm-offline';
const STORE_NAME = 'kv';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

export function createIndexedDbStore(namespace: string): KvStore {
  const fullKey = (key: string) => `${namespace}:${key}`;

  return {
    async get(key) {
      const db = await openDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(fullKey(key));
        req.onsuccess = () => resolve((req.result as string | undefined) ?? null);
        req.onerror = () => reject(req.error);
      });
    },

    async set(key, value) {
      const db = await openDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(value, fullKey(key));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    },

    async delete(key) {
      const db = await openDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(fullKey(key));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    },

    async keys(prefix) {
      const db = await openDb();
      const search = prefix ? fullKey(prefix) : `${namespace}:`;
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).getAllKeys();
        req.onsuccess = () => {
          const all = (req.result as string[]).filter((k) => k.startsWith(search));
          resolve(all.map((k) => k.slice(namespace.length + 1)));
        };
        req.onerror = () => reject(req.error);
      });
    },
  };
}
