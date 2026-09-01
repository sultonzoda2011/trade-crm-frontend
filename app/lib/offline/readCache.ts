import { getStore } from './store';

// Кэш ответов на GET-запросы (getAll всех сущностей: products, categories,
// debtors, markets, sellers, transactions...). Ключ — полный URL с query-
// параметрами, поэтому разные страницы/фильтры/сортировки кэшируются
// отдельно. Подключается один раз в app/lib/client.ts (axios-интерцептор),
// так что все существующие useQuery-хуки получают офлайн-фоллбек бесплатно,
// без правок в каждом отдельном хуке.

function cacheKey(url: string, params?: unknown): string {
  return params ? `${url}?${JSON.stringify(params)}` : url;
}

export async function readFromCache<T>(url: string, params?: unknown): Promise<T | null> {
  const store = await getStore('cache');
  const raw = await store.get(cacheKey(url, params));
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function writeToCache(url: string, params: unknown, data: unknown): Promise<void> {
  const store = await getStore('cache');
  await store.set(cacheKey(url, params), JSON.stringify(data));
}
