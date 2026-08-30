// app/lib/offline/offlineCategories.ts
//
// Офлайн-создание/правка/удаление категории. Логика та же, что у товаров
// (offlineProducts.ts): в outbox уходит исходный FormData вместе с настоящим
// File, а для мгновенного превью в UI картинка дополнительно превращается в
// base64 data-URL. Разница только в наборе полей.
import { getUserInfo } from '~/lib/auth-utils';
import { deleteRecord, getRecord, upsertRecord } from '~/lib/offline/db';
import { newLocalId } from '~/lib/offline/localIds';
import type { OfflineCategory } from '~/lib/offline/types';

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function createCategoryOffline(
  formData: FormData
): Promise<{ category: OfflineCategory; outboxBody: Record<string, FormDataEntryValue> }> {
  const user = getUserInfo();
  if (!user) throw new Error('No authenticated user in local session');

  const imageFile = formData.get('image');
  const now = new Date().toISOString();

  const category: OfflineCategory = {
    id: newLocalId(),
    name: String(formData.get('name') ?? ''),
    description: formData.get('description') ? String(formData.get('description')) : null,
    marketId: user.marketId ?? '',
    image: imageFile instanceof File && imageFile.size > 0 ? await fileToDataUrl(imageFile) : null,
    updatedAt: now,
  };

  await upsertRecord('categories', category);

  // Клиентский id → сервер создаст категорию именно с ним, поэтому товары,
  // созданные офлайн с этим categoryId, после синхронизации не «потеряют» категорию.
  const outboxBody: Record<string, FormDataEntryValue> = {
    ...Object.fromEntries(formData.entries()),
    id: category.id,
  };

  return { category, outboxBody };
}

export async function updateCategoryOffline(
  id: string,
  formData: FormData
): Promise<{ category: OfflineCategory; outboxBody: Record<string, FormDataEntryValue> }> {
  const existing = await getRecord<OfflineCategory>('categories', id);
  if (!existing) throw new Error('errors.categoryNotFoundLocally');

  const entries = Object.fromEntries(formData.entries());
  const patch: Partial<OfflineCategory> = {};
  if (entries.name !== undefined) patch.name = String(entries.name);
  if (entries.description !== undefined) patch.description = String(entries.description) || null;

  const imageFile = formData.get('image');
  if (imageFile instanceof File && imageFile.size > 0) {
    patch.image = await fileToDataUrl(imageFile);
  }

  const category: OfflineCategory = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  await upsertRecord('categories', category);

  return { category, outboxBody: entries };
}

export async function deleteCategoryOffline(id: string): Promise<void> {
  await deleteRecord('categories', id);
}
