import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { categoriesApi } from '~/api/categories';
import { productsApi } from '~/api/products';
import { FilterChip, FilterChipGroup } from '~/components/shared/FilterChips';
import { Modal } from '~/components/shared/Modal';
import { ModalFooterActions } from '~/components/shared/ModalFooterActions';
import { FormCustomSelect } from '~/components/ui/form/FormCustomSelect';
import { FormInput } from '~/components/ui/form/FormInput';
import { useForm } from '~/hooks/useForm';
import { fmtNum } from '~/lib/format';
import { queryKeys } from '~/lib/query-keys';
import { cn } from '~/lib/utils';
import { useProductsModals } from '~/routes/(crm)/products/store';
import type { BulkPriceResult } from '~/types/products';
import { createBulkPriceSchema, type BulkPriceSchema } from '~/validations/product';

const QUICK_PERCENTS = [-10, -5, 5, 10];
/** Шаг округления цены; `undefined` — до копеек. */
const ROUND_STEPS: (number | undefined)[] = [undefined, 0.5, 1, 5];

const fmtPercent = (p: number) => `${p > 0 ? '+' : '−'}${Math.abs(p)}%`;

/**
 * Массовая смена цен («всё дорожает на 5%»). Работает в два шага на одной кнопке:
 * сначала «Проверить» — сервер считает, что изменится, и ничего не пишет (dryRun); пока
 * параметры не менялись, та же кнопка превращается в «Применить». Любая правка поля
 * сбрасывает проверку, поэтому применить можно только то, что человек уже видел.
 */
export function BulkPriceModal() {
  const { t } = useTranslation(['products', 'common', 'validation']);
  const queryClient = useQueryClient();
  const modal = useProductsModals((s) => s.bulkPrice);

  const { control, handleSubmit, reset, watch, setValue } = useForm<BulkPriceSchema>({
    resolver: zodResolver(createBulkPriceSchema(t)),
    defaultValues: {},
  });

  const [preview, setPreview] = useState<{ key: string; result: BulkPriceResult } | null>(null);

  useEffect(() => {
    if (!modal.isOpen) return;
    reset({});
    setPreview(null);
  }, [modal.isOpen, reset]);

  const { data: categoriesResponse } = useQuery({
    queryKey: queryKeys.options('categories', { scope: 'filters', limit: 100 }),
    queryFn: () => categoriesApi.getAll(1, 100, {}, []),
    enabled: modal.isOpen,
  });
  const categoryOptions = useMemo(
    () => (categoriesResponse?.data?.data ?? []).map((c) => ({ value: c.id, label: c.name })),
    [categoriesResponse]
  );

  const percentRaw = watch('percent') as number | '' | undefined;
  const percent = percentRaw === '' || percentRaw == null ? null : Number(percentRaw);
  const categoryId = watch('categoryId');
  const roundTo = watch('roundTo') as number | '' | undefined;
  const step = roundTo === '' || roundTo == null ? undefined : Number(roundTo);

  const key = JSON.stringify([percent, categoryId || null, step ?? null]);
  const fresh = preview?.key === key ? preview.result : null;

  const { mutate, isPending } = useMutation({
    networkMode: 'always',
    // `requestKey` — снимок параметров на момент нажатия: ответ привязывается к нему, а не к тому, что в полях сейчас.
    mutationFn: ({ data, dryRun }: { data: BulkPriceSchema; dryRun: boolean; requestKey: string }) =>
      productsApi.bulkPrice({
        percent: data.percent,
        categoryId: data.categoryId || undefined,
        roundTo: typeof data.roundTo === 'number' ? data.roundTo : undefined,
        dryRun,
      }),
    onSuccess: (response, { dryRun, requestKey }) => {
      const result = response.data;
      if (dryRun) {
        setPreview({ key: requestKey, result });
        return;
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.entity('products') });
      toast.success(t('bulkPrice.success', { count: result.count }));
      modal.close();
    },
  });

  function onSubmit(data: BulkPriceSchema) {
    if (isPending) return;
    // Применяем только то, что уже показали; иначе сначала проверка.
    mutate({ data, dryRun: !(fresh && fresh.count > 0), requestKey: key });
  }

  const submitLabel = fresh
    ? fresh.count > 0
      ? t('bulkPrice.apply', { count: fresh.count })
      : t('bulkPrice.check')
    : t('bulkPrice.check');

  return (
    <Modal
      open={modal.isOpen}
      onClose={modal.close}
      title={t('bulkPrice.title')}
      footer={
        <ModalFooterActions
          formId="bulk-price-form"
          onCancel={modal.close}
          submitLabel={submitLabel}
          isLoading={isPending}
          disabled={percent == null || percent === 0}
        />
      }>
      <form id="bulk-price-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <FormInput
            control={control}
            name="percent"
            type="number"
            inputMode="decimal"
            label={t('bulkPrice.percent')}
            placeholder={t('bulkPrice.percentPlaceholder')}
            autoFocus
            required
          />
          <div className="flex flex-wrap gap-2 px-1">
            {QUICK_PERCENTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setValue('percent', p, { shouldValidate: true })}
                className={cn(
                  'h-10 rounded-[10px] px-3.5 text-sm font-semibold transition-opacity active:opacity-60',
                  percent === p ? 'bg-primary text-primary-foreground' : 'bg-primary/12 text-primary'
                )}>
                {fmtPercent(p)}
              </button>
            ))}
          </div>
        </div>

        <FormCustomSelect
          control={control}
          name="categoryId"
          label={t('bulkPrice.category')}
          placeholder={t('bulkPrice.allCategories')}
          options={categoryOptions}
          isClearable
        />

        <FilterChipGroup label={t('bulkPrice.roundTo')}>
          {ROUND_STEPS.map((s) => (
            <FilterChip key={s ?? 'none'} active={step === s} onClick={() => setValue('roundTo', s)}>
              {s == null ? t('bulkPrice.roundNone') : fmtNum(s)}
            </FilterChip>
          ))}
        </FilterChipGroup>

        {fresh && (
          <section aria-live="polite" className="space-y-1.5">
            <p className="px-1 text-sm font-medium">
              {fresh.count > 0 ? t('bulkPrice.previewCount', { count: fresh.count }) : t('bulkPrice.none')}
            </p>
            {fresh.items.length > 0 && (
              <ul className="bg-muted divide-border divide-y overflow-hidden rounded-xl text-sm">
                {fresh.items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="min-w-0 flex-1 truncate">{item.name}</span>
                    <span className="shrink-0 tabular-nums">
                      <span className="text-muted-foreground">{fmtNum(item.oldPrice)}</span>
                      {' → '}
                      <span className="font-semibold">{fmtNum(item.newPrice)}</span>
                    </span>
                  </li>
                ))}
                {fresh.count > fresh.items.length && (
                  <li className="text-muted-foreground px-3 py-2">
                    {t('bulkPrice.previewMore', { count: fresh.count - fresh.items.length })}
                  </li>
                )}
              </ul>
            )}
          </section>
        )}

        <p className="text-muted-foreground px-1 text-sm">{t('bulkPrice.hint')}</p>
      </form>
    </Modal>
  );
}
