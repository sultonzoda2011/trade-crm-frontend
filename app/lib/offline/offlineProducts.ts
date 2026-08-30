// app/lib/offline/offlineProducts.ts
//
// Офлайн-создание товара. В отличие от транзакций, тут почти нет бизнес-
// логики на бэкенде (валидация полей + сохранение файла) — основная
// сложность в другом: сохранить сам File (фото) так, чтобы он пережил
// перезапуск приложения и корректно доехал до сервера при синхронизации.
//
// IndexedDB умеет хранить File/Blob "как есть" (structured clone), поэтому
// оригинальный File кладём прямо в outbox — это даёт точный byte-in-byte
// файл при отправке. Для МГНОВЕННОГО превью в UI (Product.image — это
// строка-URL, а не File) параллельно делаем base64 data-URL.
import { getUserInfo } from '~/lib/auth-utils';
import { upsertRecord } from '~/lib/offline/db';
import { newLocalId } from '~/lib/offline/localIds';
import type { OfflineProduct } from '~/lib/offline/types';

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Возвращает и локально сохранённый товар, и «сырые» поля для outbox (см. api/products.ts). */
export async function createProductOffline(
  formData: FormData
): Promise<{ product: OfflineProduct; outboxBody: Record<string, FormDataEntryValue> }> {
  const user = getUserInfo();
  if (!user) throw new Error('No authenticated user in local session');

  const name = String(formData.get('name') ?? '');
  const description = formData.get('description');
  const price = Number(formData.get('price') ?? 0);
  const quantity = Number(formData.get('quantity') ?? 0);
  const unit = (formData.get('unit') as OfflineProduct['unit']) || 'PCS';
  const lowStockThreshold = Number(formData.get('lowStockThreshold') ?? 10);
  const categoryId = formData.get('categoryId');
  const imageFile = formData.get('image');

  const now = new Date().toISOString();
  const image = imageFile instanceof File && imageFile.size > 0 ? await fileToDataUrl(imageFile) : null;

  const product: OfflineProduct = {
    id: newLocalId(),
    name,
    description: description ? String(description) : null,
    price,
    quantity,
    marketId: user.marketId ?? '',
    categoryId: categoryId ? String(categoryId) : null,
    unit,
    lowStockThreshold,
    image,
    createdAt: now,
    updatedAt: now,
  };

  await upsertRecord('products', product);

  // outbox хранит ИСХОДНЫЙ FormData целиком (включая настоящий File), чтобы
  // при синхронизации отправить ровно то же самое, без повторной кодировки.
  const outboxBody = Object.fromEntries(formData.entries());

  return { product, outboxBody };
}
