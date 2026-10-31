import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { productsApi } from '~/api/products';
import { queryKeys } from '~/lib/query-keys';

/**
 * Архив вместо удаления: товар пропадает из списка и из продажи, а история и чеки остаются.
 * Не офлайн-мутация (как пополнение): без сети — обычный тост «нет соединения».
 */
export function useArchiveProduct() {
  const { t } = useTranslation('products');
  const queryClient = useQueryClient();

  const archive = useMutation({
    networkMode: 'always',
    mutationFn: (id: string) => productsApi.archive(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.entity('products') });
      toast.success(t('archive.success'));
    },
  });

  const restore = useMutation({
    networkMode: 'always',
    mutationFn: (id: string) => productsApi.unarchive(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.entity('products') });
      toast.success(t('archive.restored'));
    },
  });

  return { archive, restore, isPending: archive.isPending || restore.isPending };
}
