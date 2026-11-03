import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRightLeft, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { categoriesApi } from '~/api/categories';
import { ConfirmDialog } from '~/components/shared/ConfirmDialog';
import { PickerField } from '~/components/shared/PickerField';
import { Button } from '~/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '~/components/ui/sheet';
import { invalidateEntityCache, queryKeys } from '~/lib/query-keys';
import { useCategoriesModals } from '~/routes/(crm)/categories/store';
import type { DeleteCategoryChoice } from '~/types/products';

/**
 * Удаление категории. Пустая — обычное подтверждение. С товарами — шторка с выбором:
 * «Перенести в…» (все товары, архивные тоже, уходят в другую категорию) или «Оставить
 * без категории» (товары остаются, просто без категории). Так владелец не вынужден
 * сначала править каждый товар руками — раньше сервер просто отвечал отказом.
 *
 * Не офлайн-мутация (`networkMode: 'always'`): без сети сразу тост «нет соединения».
 */
export function DeleteCategoryDialog() {
  const { t } = useTranslation(['categories', 'common']);
  const modal = useCategoriesModals((s) => s.remove);
  const target = modal.data;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [moveTo, setMoveTo] = useState<string | null>(null);

  const hasProducts = (target?.productsCount ?? 0) > 0;

  // Целиком, без постраничности: категорий на рынке десятки, а выбирать «куда» нужно из всех.
  // Тот же ключ, что у фильтров и выбора в продаже, — без сети список берётся из сохранённого.
  const { data: all } = useQuery({
    queryKey: queryKeys.options('categories', { scope: 'filters', limit: 100 }),
    queryFn: () => categoriesApi.getAll(1, 100, {}, []),
    enabled: modal.isOpen && hasProducts,
    staleTime: 30_000,
  });

  const options = useMemo(
    () =>
      (all?.data?.data ?? [])
        .filter((c) => c.id !== target?.id)
        .map((c) => ({ value: c.id, label: c.name })),
    [all, target?.id]
  );

  const close = () => {
    setMoveTo(null);
    modal.close();
  };

  const remove = useMutation({
    networkMode: 'always',
    mutationFn: (choice?: DeleteCategoryChoice) => categoriesApi.delete(target!.id, choice),
    onSuccess: (result) => {
      const id = target!.id;
      const redirectTo = target!.redirectTo;
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] === 'categories' && q.queryKey[2] === id });
      invalidateEntityCache(queryClient, 'categories');
      // Товары поменяли категорию — их списки и сводки устарели.
      invalidateEntityCache(queryClient, 'products');
      const moved = result?.data?.movedProducts ?? 0;
      const detached = result?.data?.detachedProducts ?? 0;
      toast.success(
        moved > 0
          ? t('delete.successMoved', { count: moved })
          : detached > 0
            ? t('delete.successDetached', { count: detached })
            : t('actions.deleteSuccess')
      );
      close();
      if (redirectTo) navigate(redirectTo, { replace: true });
    },
    // Текст ошибки (имя занято, нельзя перенести…) показывает общий перехватчик запросов.
  });

  if (!target) return null;

  if (!hasProducts) {
    return (
      <ConfirmDialog
        open={modal.isOpen}
        onOpenChange={(open) => !open && close()}
        onConfirm={() => remove.mutate(undefined)}
        isLoading={remove.isPending}
        title={t('actions.confirm', { ns: 'common' })}
        description={t('actions.areYouSure')}
      />
    );
  }

  return (
    <Sheet open={modal.isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent side="bottom" showCloseButton={false} className="bg-background gap-0 p-0 md:mx-auto md:max-w-lg">
        <SheetHeader className="items-center gap-2 px-5 pt-1 pb-2 text-center">
          <div className="bg-destructive/12 text-destructive flex size-12 items-center justify-center rounded-full">
            <Trash2 className="size-6" />
          </div>
          <SheetTitle className="text-xl leading-tight font-semibold">
            {t('delete.title', { name: target.name })}
          </SheetTitle>
          <SheetDescription className="leading-relaxed">
            {t('delete.hasProducts', { count: target.productsCount })}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-3 px-4 pt-2 pb-4">
          <div className="bg-card space-y-3 rounded-2xl p-3">
            <PickerField
              label={t('delete.moveTo')}
              placeholder={t('delete.pickCategory')}
              title={t('delete.moveTo')}
              options={options}
              value={moveTo}
              onChange={(v) => setMoveTo(v ? String(v) : null)}
              emptyText={t('delete.noOtherCategories')}
            />
            <Button
              type="button"
              size="lg"
              className="w-full"
              disabled={!moveTo}
              loading={remove.isPending && !!moveTo}
              onClick={() => moveTo && remove.mutate({ moveTo })}>
              <ArrowRightLeft data-icon="inline-start" />
              {t('delete.moveAndDelete')}
            </Button>
          </div>

          <Button
            type="button"
            size="lg"
            variant="destructive"
            className="w-full"
            disabled={remove.isPending}
            onClick={() => remove.mutate({ detach: true })}>
            {t('delete.detachAndDelete')}
          </Button>
          <p className="text-muted-foreground px-2 text-center text-xs leading-snug">{t('delete.detachHint')}</p>

          <Button type="button" size="lg" variant="outline" className="w-full" onClick={close} disabled={remove.isPending}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
