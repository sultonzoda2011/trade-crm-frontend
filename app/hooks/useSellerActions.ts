import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { sellersApi } from '~/api/sellers';
import { invalidateEntityCache, queryKeys } from '~/lib/query-keys';

/**
 * Что обновить после любой операции над продавцом: сам список/карточку/сводку,
 * ленту заработка и баланс, а ещё профиль — владелец может быть и своим продавцом.
 * Ошибки показывает общий перехватчик (`lib/client.ts`) по коду бэкенда, поэтому здесь их нет.
 */
export function useInvalidateSeller() {
  const queryClient = useQueryClient();
  return (id: string) => {
    invalidateEntityCache(queryClient, 'sellers', id);
    void queryClient.invalidateQueries({ queryKey: queryKeys.sub('sellers', 'earnings', id) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.sub('sellers', 'balance', id) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.sub('sellers', 'credits', id) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.profileAll() });
    // Отключённый продавец пропадает из/появляется в списке пользователей.
    invalidateEntityCache(queryClient, 'users', id);
  };
}

/** Отключить / включить продавца. Деньги и история не трогаются — меняется только доступ. */
export function useSellerAccess(onDone?: () => void) {
  const { t } = useTranslation('sellers');
  const invalidate = useInvalidateSeller();

  const deactivate = useMutation({
    networkMode: 'always',
    mutationFn: (id: string) => sellersApi.deactivate(id),
    onSuccess: (_r, id) => {
      invalidate(id);
      toast.success(t('access.deactivated'));
      onDone?.();
    },
  });

  const activate = useMutation({
    networkMode: 'always',
    mutationFn: (id: string) => sellersApi.activate(id),
    onSuccess: (_r, id) => {
      invalidate(id);
      toast.success(t('access.activated'));
      onDone?.();
    },
  });

  return { deactivate, activate };
}
