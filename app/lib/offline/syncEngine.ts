// app/lib/offline/syncEngine.ts
//
// Двигатель синхронизации: push (реплей outbox на сервер в исходном порядке)
// + pull (инкрементальный снапшот с /sync/pull). Вызывается при появлении
// сети и при возврате приложения из фона — см. useSyncEngine.ts.
import { apiClient } from '~/lib/client';
import { getMeta, listOutboxRows, removeOutboxRow, setMeta, updateOutboxRow, upsertRecords } from '~/lib/offline/db';
import { appendToFormData } from '~/lib/form-data';
import { getIsOnline } from '~/lib/offline/networkStatus';
import { useSyncStore } from '~/store/useSyncStore';

let syncInFlight: Promise<void> | null = null;

/**
 * true только для настоящей сетевой ошибки axios (нет ответа от сервера
 * вообще — таймаут, DNS, обрыв, OfflineError). ВАЖНО отличать от любой
 * другой ошибки (баг в коде, некорректные данные в outbox и т.п.) — раньше
 * тут была проверка `!error?.response`, под которую попадала ЛЮБАЯ ошибка
 * без .response, включая обычный TypeError из appendToFormData. Такая
 * ошибка пробрасывалась наружу из pushOutbox() и обрывала весь runSync() —
 * pullSince() (запрос /sync/pull) в этом случае не вызывался ВООБЩЕ.
 */
function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { isAxiosError?: boolean; name?: string; response?: unknown };
  if (err.name === 'OfflineError') return true;
  return !!err.isAxiosError && !err.response;
}

async function pushOutbox(): Promise<void> {
  let rows: Awaited<ReturnType<typeof listOutboxRows>>;
  try {
    rows = await listOutboxRows();
  } catch (error) {
    console.error('[sync] failed to read outbox from IndexedDB, skipping push', error);
    return; // не блокируем pull из-за проблемы с локальной БД
  }

  for (const row of rows) {
    if (row.status === 'error') continue; // ждёт ручного разбора, не блокирует остальные

    await updateOutboxRow(row.id, { status: 'syncing' });
    try {
      // products (create/update) уходят как multipart, всё остальное — JSON,
      // как обычные REST-вызовы, реплеятся через тот же apiClient.
      if (row.entity === 'products') {
        const formData = appendToFormData(row.body as Record<string, unknown>);
        await apiClient.request({ method: row.method, url: row.url, data: formData, headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await apiClient.request({ method: row.method, url: row.url, data: row.body });
      }
      await removeOutboxRow(row.id);
    } catch (error: any) {
      if (isNetworkError(error)) {
        // Сети снова нет (пропала посреди синка) — прекращаем пуш, порядок
        // должен сохраниться, следующая попытка начнётся с этой же записи.
        console.warn('[sync] push interrupted: no network, will retry later', row.entity, row.id);
        await updateOutboxRow(row.id, { status: 'pending' });
        return; // НЕ throw — pull должен всё равно попытаться выполниться
      }
      // Сервер ответил и отклонил операцию (например, не хватило остатка,
      // потому что другой продавец успел продать раньше), ИЛИ это баг в
      // коде (например, битые данные в самой записи outbox) — в обоих
      // случаях это не временная проблема сети: помечаем как error и идём
      // дальше по очереди, а не блокируем всё вокруг.
      const message = error?.response?.data?.message ?? error?.message ?? String(error);
      console.error('[sync] push failed for outbox row, marking as error', row.entity, row.id, message);
      await updateOutboxRow(row.id, {
        status: 'error',
        error: Array.isArray(message) ? message.join(', ') : String(message),
      });
    }
  }
}

async function pullSince(): Promise<void> {
  const since = (await getMeta('lastSyncedAt')) ?? undefined;
  console.info('[sync] pulling /sync/pull since=', since ?? '(full snapshot)');
  const { data } = await apiClient.get('/sync/pull', { params: since ? { since } : {} });
  const payload = data?.data ?? data; // на случай, если интерцептор что-то ещё обернёт

  if (payload.products?.length) await upsertRecords('products', payload.products);
  if (payload.categories?.length) await upsertRecords('categories', payload.categories);
  if (payload.debtors?.length) await upsertRecords('debtors', payload.debtors);
  if (payload.transactions?.length) await upsertRecords('transactions', payload.transactions);

  await setMeta('lastSyncedAt', payload.serverTime);
  console.info(
    '[sync] pull ok:',
    payload.products?.length ?? 0, 'products,',
    payload.categories?.length ?? 0, 'categories,',
    payload.debtors?.length ?? 0, 'debtors,',
    payload.transactions?.length ?? 0, 'transactions'
  );
}

async function refreshPendingCount(): Promise<void> {
  const rows = await listOutboxRows();
  useSyncStore.getState().setPendingCount(rows.filter((r) => r.status !== 'error').length);
}

/**
 * Запускает push+pull, если сеть есть. Безопасно вызывать многократно
 * подряд (network flapping, App resume + Network listener одновременно) —
 * параллельные вызовы схлопываются в один запущенный проход.
 *
 * push и pull теперь НЕ связаны через один try/catch: ошибка в push (в т.ч.
 * баг, а не сеть) больше не может помешать pull — /sync/pull всегда
 * пытается выполниться отдельно.
 */
export async function runSync(): Promise<void> {
  if (!getIsOnline()) {
    console.info('[sync] skipped: offline (networkStatus)');
    return;
  }
  if (syncInFlight) return syncInFlight;

  const store = useSyncStore.getState();
  store.setPhase('syncing');

  syncInFlight = (async () => {
    let lastError: unknown = null;

    try {
      await pushOutbox();
    } catch (error) {
      console.error('[sync] push crashed unexpectedly', error);
      lastError = error;
    }

    try {
      await pullSince();
    } catch (error) {
      console.error('[sync] pull failed', error);
      lastError = error;
    }

    if (lastError) {
      store.setPhase('error');
      store.setLastError((lastError as any)?.message ?? 'sync failed');
    } else {
      store.setLastSyncedAt(new Date().toISOString());
      store.setLastError(null);
      store.setPhase('idle');
    }

    await refreshPendingCount();
    syncInFlight = null;
  })();

  return syncInFlight;
}

/** Вызывать один раз при старте приложения, чтобы бейдж сразу показал реальное число pending. */
export async function initSyncState(): Promise<void> {
  await refreshPendingCount();
}

