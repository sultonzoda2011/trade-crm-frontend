import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  AlertTriangle,
  Banknote,
  ChevronRight,
  CreditCard,
  HandCoins,
  Package,
  Plus,
  SlidersHorizontal,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useFieldArray } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { showSuccess } from '~/store/useSuccessStore';
import { debtorsApi } from '~/api/debtors';
import { productsApi } from '~/api/products';
import { transactionsApi } from '~/api/transactions';
import { CreateDebtorModal } from '~/components/modals/CreateDebtorModal';
import { InitialAvatar } from '~/components/shared/InitialAvatar';
import { ListGroup, ListRow } from '~/components/shared/ListGroup';
import { SegmentedControl } from '~/components/shared/SegmentedControl';
import { DebtorPickerSheet } from '~/components/transactions/DebtorPickerSheet';
import { ProductPickerSheet } from '~/components/transactions/ProductPickerSheet';
import { QuantityStepper } from '~/components/transactions/QuantityStepper';
import BreadCrumbs from '~/components/ui/bread-crumb';
import { Button } from '~/components/ui/button';
import { FormDateInput } from '~/components/ui/form/FormDateInput';
import { FormInput } from '~/components/ui/form/FormInput';
import { Action } from '~/config/actions';
import { useAsyncSelectOptions } from '~/hooks/useAsyncSelectOptions';
import { useCan } from '~/hooks/useCan';
import { useForm } from '~/hooks/useForm';
import { cldThumb } from '~/lib/cloudinary';
import { fmtNum, fmtTJS } from '~/lib/format';
import { queryKeys } from '~/lib/query-keys';
import { useDebtorsModals } from '~/routes/(crm)/debtors/store';
import type { Debtor } from '~/types/debtors';
import type { Product } from '~/types/products';
import type { CreateTransactionRequest } from '~/types/transactions';
import {
  createTransactionSchema,
  isOverStock,
  type CreateTransactionInput,
  type CreateTransactionItemInput,
} from '~/validations/transactions';

const LAST_PAYMENT_METHOD_KEY = 'tx:lastPaymentMethod';

// SPA-режим (ssr:false) — localStorage доступен сразу, без проверки на window.
function getLastPaymentMethod(): 'CASH' | 'CARD' | 'DEBT' | null {
  try {
    const v = localStorage.getItem(LAST_PAYMENT_METHOD_KEY);
    return v === 'CASH' || v === 'CARD' || v === 'DEBT' ? v : null;
  } catch {
    return null;
  }
}

export default function CreateTransactionPage() {
  const { t } = useTranslation(['transactions', 'common', 'validation']);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { can } = useCan();
  // «Дать долг» со страницы должника приходит с уже выбранным человеком —
  // не заставляем искать его заново.
  const prefill = location.state as { debtorId?: string; debtorName?: string; fromPath?: string } | null;
  const debtorCreateModal = useDebtorsModals((s) => s.create);
  // Скидка/надбавка нужны редко — по умолчанию скрыты, чтобы карточка товара
  // занимала 2 строки на телефоне вместо 3. Разворачиваем по клику или если
  // в строке уже стоят ненулевые значения (например, при копировании формы).
  const [expandedAdjustments, setExpandedAdjustments] = useState<Record<string, boolean>>({});
  // Индекс строки товара, для которой открыт полноэкранный пикер (null — закрыт).
  // Sheet один на всю форму, а не по одному на строку.
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);
  const [debtorPickerOpen, setDebtorPickerOpen] = useState(false);

  const canCreateSale = can(Action.TRANSACTIONS_CREATE_SALE);

  // Server-side search: the debtor/product lists can exceed any fixed page, so instead of
  // loading a capped first page and filtering locally we query the API as the user types.
  const debtors = useAsyncSelectOptions({
    queryKey: queryKeys.options('debtors', { scope: 'form', limit: 100 }),
    fetcher: async (search) => (await debtorsApi.getAll(1, 100, { search: search || undefined }))?.data?.data ?? [],
    getValue: (d) => d.id,
    getLabel: (d) => d.name,
    seed: prefill?.debtorId ? [{ id: prefill.debtorId, name: prefill.debtorName ?? '' } as Debtor] : undefined,
  });

  const products = useAsyncSelectOptions({
    queryKey: queryKeys.options('products', { scope: 'form', limit: 100 }),
    fetcher: async (search) => (await productsApi.getAll(1, 100, { search: search || undefined }))?.data?.data ?? [],
    getValue: (p) => p.id,
    getLabel: (p) => p.name,
  });

  const debtorOptions = debtors.options;
  const productOptions = products.options;

  // Текущая выдача поиска для пикера: options хранит только value/label, а
  // фото/цена/остаток лежат в byId (туда попадает всё, что когда-либо пришло
  // с сервера, включая текущую выдачу) — раскрываем одно через другое, не
  // трогая общий хук useAsyncSelectOptions.
  const pickerItems = useMemo(
    () => productOptions.map((o) => products.byId.get(String(o.value))).filter((p): p is Product => Boolean(p)),
    [productOptions, products.byId]
  );

  // Read stock/price from the accumulated set (products.byId), not just the latest search —
  // a row that already picked a product must keep its data even after the results narrow.
  const stockMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of products.byId.values()) map[p.id] = p.quantity;
    return map;
  }, [products.byId]);

  const priceMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of products.byId.values()) map[p.id] = p.price;
    return map;
  }, [products.byId]);

  const transactionSchema = useMemo(() => createTransactionSchema(t, stockMap, priceMap), [t, stockMap, priceMap]);

  const { control, handleSubmit, watch, setValue, formState } = useForm<CreateTransactionInput>({
    resolver: zodResolver(transactionSchema),
    mode: 'onChange',
    defaultValues: {
      debtorId: prefill?.debtorId ?? '',
      customerName: '',
      // Большинство продавцов день за днём принимают один и тот же способ
      // оплаты — не заставляем каждый раз тапать по нему заново.
      type: (() => {
        if (prefill?.debtorId) return 'DEBT';
        const last = canCreateSale ? getLastPaymentMethod() : null;
        return last === 'DEBT' || !canCreateSale ? 'DEBT' : 'SALE';
      })(),
      paymentType: (() => {
        if (prefill?.debtorId) return 'CREDIT';
        const last = canCreateSale ? getLastPaymentMethod() : null;
        if (!canCreateSale || last === 'DEBT') return 'CREDIT';
        return last === 'CARD' ? 'CARD' : 'CASH';
      })(),
      dueDate: dayjs().format('YYYY-MM-DD'),
      items: [{ productId: '', quantity: 1, discount: 0, markup: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const type = watch('type');
  const paymentType = watch('paymentType');
  const items = (watch('items') ?? []) as CreateTransactionItemInput[];

  // Один сегмент вместо двух связанных селектов: "В долг" сразу выставляет
  // и type=DEBT, и paymentType=CREDIT — их взаимную зависимость раньше
  // приходилось держать в голове (см. useEffect ниже), теперь это один тап.
  const paymentMethod: 'CASH' | 'CARD' | 'DEBT' =
    type === 'DEBT' ? 'DEBT' : ((paymentType as 'CASH' | 'CARD') ?? 'CASH');

  useEffect(() => {
    if (type === 'DEBT') {
      if (paymentType !== 'CREDIT') setValue('paymentType', 'CREDIT', { shouldValidate: true });
    } else if (paymentType === 'CREDIT') {
      setValue('paymentType', 'CASH', { shouldValidate: true });
    }
  }, [type, paymentType, setValue]);

  const productMap = products.byId;

  const getProduct = (productId?: string | null) => (productId ? productMap.get(productId) : undefined);

  const itemsList = Array.isArray(items) ? items : [];

  // Считаем каждый рендер, без useMemo: watch('items') не гарантирует новую ссылку
  // на массив при правке вложенного поля через Controller, поэтому мемоизация
  // отдавала бы устаревший итог.
  let calculatedTotal = 0;
  let totalDiscount = 0;
  let totalMarkup = 0;
  for (const item of itemsList) {
    const product = getProduct(item?.productId);
    const q = Number(item?.quantity) || 0;
    const p = product?.price ?? 0;
    const d = Number(item?.discount) || 0;
    const m = Number(item?.markup) || 0;
    const gross = q * p;
    const net = Math.max(gross - d + m, 0);
    calculatedTotal += net;
    // net уже включает +markup, поэтому чистую скидку считаем без него,
    // иначе надбавка маскировала бы скидку в этой сумме.
    totalDiscount += Math.max(gross - (net - m), 0);
    totalMarkup += m;
  }

  const getItemTotal = (item?: CreateTransactionItemInput | undefined) => {
    if (!item) return 0;
    const product = getProduct(item.productId);
    const q = Number(item.quantity) || 0;
    const p = product?.price ?? 0;
    const d = Number(item.discount) || 0;
    const m = Number(item.markup) || 0;
    return Math.max(q * p - d + m, 0);
  };

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CreateTransactionInput) => {
      const payload: CreateTransactionRequest = {
        debtorId: data.debtorId || undefined,
        customerName: data.customerName || undefined,
        type: (data.type ?? 'DEBT') as CreateTransactionRequest['type'],
        paymentType: (data.paymentType ?? 'CASH') as CreateTransactionRequest['paymentType'],
        dueDate: data.type === 'DEBT' && data.dueDate ? data.dueDate : undefined,
        items: data.items.map((item) => ({
          productId: item.productId ?? '',
          quantity: Number(item.quantity),
          discount: item.discount ? Number(item.discount) : undefined,
          markup: item.markup ? Number(item.markup) : undefined,
        })),
      };
      return transactionsApi.create(payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.entity('transactions') });
      // Продажа списывает остатки, долг меняет сумму у должника — без этого списки
      // до конца staleTime показывали бы старые цифры.
      void queryClient.invalidateQueries({ queryKey: queryKeys.entity('products') });
      void queryClient.invalidateQueries({ queryKey: queryKeys.entity('debtors') });
      showSuccess({ title: t('createSuccess'), amount: calculatedTotal });
      navigate(prefill?.fromPath ?? '/transactions');
    },
    onError: () => {
      toast.error(t('createError'));
    },
  });

  function onSubmit(data: CreateTransactionInput) {
    if (data.type === 'SALE' && !canCreateSale) {
      toast.error(t('errors.forbidden', { ns: 'common' }));
      return;
    }
    mutate(data);
  }

  const debtorId = watch('debtorId');
  const selectedDebtor = debtorId ? debtors.byId.get(debtorId) : undefined;
  const debtorError = formState.errors.debtorId?.message;
  const pickerDebtors = debtorOptions
    .map((o) => debtors.byId.get(String(o.value)))
    .filter((d): d is Debtor => Boolean(d));
  // Pending is handled by `loading` on the button (it swallows clicks and Enter), so it must not also dim it via `disabled`.
  const canSubmit = formState.isValid;
  const submitLabel = type === 'DEBT' ? t('submitDebt') : t('submitSale');

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col space-y-5 pb-44 md:max-w-none md:pb-8">
      <BreadCrumbs
        items={[
          { label: t('navigation.dashboard', { ns: 'common' }), link: '/dashboard' },
          {
            // Пришли со страницы должника — «назад» ведёт к нему, а не в общий список.
            label: prefill?.fromPath && prefill.debtorName ? prefill.debtorName : t('title'),
            link: prefill?.fromPath ?? '/transactions',
          },
          { label: t('create') },
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('create')}</h1>
          <p className="text-muted-foreground mt-1 hidden text-sm sm:block">{t('createSubtitle')}</p>
        </div>
        {/* На телефоне те же действия живут в нижней панели; здесь — только для md+. */}
        <div className="hidden gap-3 md:flex">
          <Button variant="outline" onClick={() => navigate(prefill?.fromPath ?? '/transactions')}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button type="submit" form="create-transaction-page-form" disabled={!canSubmit} loading={isPending}>
            {submitLabel}
          </Button>
        </div>
      </div>

      <form
        id="create-transaction-page-form"
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[5fr_3fr] lg:gap-6">
        {/* На телефоне сначала «как платят / кому», потом товары; на десктопе — слева товары. */}
        <div className="order-first space-y-5 lg:order-last">
          {canCreateSale ? (
            <SegmentedControl
              value={paymentMethod}
              onChange={(next) => {
                try {
                  localStorage.setItem(LAST_PAYMENT_METHOD_KEY, next);
                } catch {
                  // приватный режим / квота — не критично, просто не запомнится
                }
                if (next === 'DEBT') {
                  setValue('type', 'DEBT', { shouldValidate: true });
                  setValue('paymentType', 'CREDIT', { shouldValidate: true });
                } else {
                  setValue('type', 'SALE', { shouldValidate: true });
                  setValue('paymentType', next, { shouldValidate: true });
                }
              }}
              options={[
                { value: 'CASH', label: t('paymentType.CASH'), icon: Banknote },
                { value: 'CARD', label: t('paymentType.CARD'), icon: CreditCard },
                { value: 'DEBT', label: t('type.DEBT'), icon: HandCoins },
              ]}
            />
          ) : (
            <div className="bg-card flex items-center gap-2 rounded-2xl px-4 py-3 text-base font-medium">
              <HandCoins className="text-warning size-5" />
              {t('type.DEBT')}
            </div>
          )}

          {type === 'DEBT' && (
            <>
              <ListGroup
                title={t('fields.debtor')}
                footer={debtorError ? <span className="text-destructive">{debtorError}</span> : undefined}>
                <ListRow
                  leading={
                    selectedDebtor ? (
                      <InitialAvatar name={selectedDebtor.name} className="size-10" />
                    ) : (
                      <span className="bg-primary/12 text-primary flex size-10 items-center justify-center rounded-full">
                        <UserPlus className="size-5" />
                      </span>
                    )
                  }
                  title={
                    selectedDebtor ? (
                      <span className="font-semibold">{selectedDebtor.name}</span>
                    ) : (
                      <span className="text-primary font-medium">{t('fields.pickDebtor')}</span>
                    )
                  }
                  subtitle={selectedDebtor?.phone}
                  chevron
                  onClick={() => setDebtorPickerOpen(true)}
                />
              </ListGroup>

              <div className="bg-card space-y-3 rounded-2xl p-4">
                <FormDateInput
                  control={control}
                  name="dueDate"
                  placeholder={t('fields.dueDate')}
                  minDate={new Date()}
                  label={t('fields.dueDate')}
                  required
                />
                <div className="flex flex-wrap gap-2 px-1">
                  {[7, 14, 30].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setValue('dueDate', dayjs().add(days, 'day').format('YYYY-MM-DD'))}
                      className="bg-primary/12 text-primary h-9 rounded-[10px] px-3.5 text-sm font-semibold active:opacity-60">
                      +{days} {t('daysUnit', { ns: 'common' })}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {type === 'SALE' && (
            <div className="bg-card rounded-2xl p-4">
              <FormInput
                control={control}
                name="customerName"
                label={t('fields.customer')}
                placeholder={t('fields.customer')}
              />
            </div>
          )}
        </div>

        <div className="space-y-5 lg:order-first">
          <div className="space-y-3">
            {fields.map((field, index) => {
              const item = items[index];
              const product = getProduct(item?.productId);
              const itemTotal = getItemTotal(item);
              const overStock = isOverStock(item?.quantity, product?.quantity);
              const rowErrors = (
                formState.errors.items as unknown as Array<{ productId?: { message?: string } } | undefined> | undefined
              )?.[index];
              const productError = rowErrors?.productId?.message;
              const isExpanded =
                expandedAdjustments[field.id] ?? (Number(item?.discount) > 0 || Number(item?.markup) > 0);

              return (
                <div key={field.id} className="bg-card divide-border divide-y overflow-hidden rounded-2xl">
                  <div className="flex items-stretch">
                    <button
                      type="button"
                      onClick={() => setPickerIndex(index)}
                      className="active:bg-muted/70 flex min-h-16 min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left transition-colors">
                      <span className="bg-muted flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[10px]">
                        {product?.image ? (
                          <img
                            src={cldThumb(product.image, { w: 96, h: 96 })}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : (
                          <Package className="text-muted-foreground size-5" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        {product ? (
                          <>
                            <span className="line-clamp-2 block text-base leading-snug font-semibold">
                              {product.name}
                            </span>
                            <span className="text-muted-foreground block text-sm leading-snug">
                              {fmtNum(product.price)} TJS · {t('inStock')} {product.quantity}
                            </span>
                          </>
                        ) : (
                          <span className="text-primary block text-base font-medium">{t('fields.pickProduct')}</span>
                        )}
                      </span>
                      <ChevronRight className="text-muted-foreground/50 size-5 shrink-0" />
                    </button>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        aria-label={t('actions.delete', { ns: 'common' })}
                        onClick={() => remove(index)}
                        className="text-destructive active:bg-destructive/10 flex w-12 shrink-0 items-center justify-center border-l">
                        <Trash2 className="size-5" />
                      </button>
                    )}
                  </div>

                  {productError && <p className="text-destructive px-4 py-2 text-sm">{productError}</p>}

                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <QuantityStepper control={control} name={`items.${index}.quantity`} />
                    <span className="font-mono text-xl font-semibold">{fmtNum(itemTotal)}</span>
                  </div>

                  {overStock && (
                    <p className="text-destructive flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium">
                      <AlertTriangle className="size-4 shrink-0" />
                      {t('stockError')}
                    </p>
                  )}

                  {isExpanded ? (
                    <div className="grid grid-cols-2 gap-3 px-3 py-3">
                      <FormInput
                        control={control}
                        label={t('fields.discount')}
                        name={`items.${index}.discount`}
                        type="number"
                        inputMode="decimal"
                        min={0}
                        placeholder="0"
                      />
                      <FormInput
                        control={control}
                        label={t('fields.markup')}
                        name={`items.${index}.markup`}
                        type="number"
                        inputMode="decimal"
                        min={0}
                        placeholder="0"
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setExpandedAdjustments((s) => ({ ...s, [field.id]: true }))}
                      className="text-primary active:bg-muted/70 flex min-h-11 w-full items-center gap-2 px-4 text-sm font-medium">
                      <SlidersHorizontal className="size-4" />
                      {t('fields.discount')} / {t('fields.markup')}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={() => append({ productId: '', quantity: 1, discount: 0, markup: 0 })}>
            <Plus />
            {t('fields.addItem')}
          </Button>

          {(totalDiscount > 0 || totalMarkup > 0) && (
            <ListGroup>
              {totalDiscount > 0 && <ListRow title={t('fields.discount')} value={`− ${fmtTJS(totalDiscount)}`} />}
              {totalMarkup > 0 && <ListRow title={t('fields.markup')} value={`+ ${fmtTJS(totalMarkup)}`} />}
            </ListGroup>
          )}
        </div>
      </form>

      <CreateDebtorModal />

      <ProductPickerSheet
        open={pickerIndex !== null}
        onOpenChange={(open) => {
          if (!open) setPickerIndex(null);
        }}
        items={pickerItems}
        loading={products.loading}
        onSearch={products.onSearch}
        onSelect={(productId) => {
          if (pickerIndex !== null) {
            setValue(`items.${pickerIndex}.productId`, productId, { shouldValidate: true, shouldDirty: true });
          }
          setPickerIndex(null);
        }}
      />

      <DebtorPickerSheet
        open={debtorPickerOpen}
        onOpenChange={setDebtorPickerOpen}
        items={pickerDebtors}
        loading={debtors.loading}
        onSearch={debtors.onSearch}
        onSelect={(debtor) => {
          setValue('debtorId', debtor.id, { shouldValidate: true, shouldDirty: true });
          setDebtorPickerOpen(false);
        }}
        onCreateNew={() => {
          setDebtorPickerOpen(false);
          debtorCreateModal.open();
        }}
      />

      {/*
       * Нижняя панель на телефоне (вкладки на этом экране скрыты): итог и одна
       * главная кнопка на всю ширину — отмена не нужна, есть «назад» сверху.
       * Отступ снизу учитывает жестовую навигацию (safe-area).
       */}
      <div
        className="bg-card border-border fixed inset-x-0 bottom-0 z-40 border-t px-4 pt-3 md:hidden"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
        <div className="mb-2.5 flex items-baseline justify-between">
          <span className="text-muted-foreground text-base">{t('fields.totalAmount')}</span>
          <span className="font-mono text-2xl font-bold">{fmtTJS(calculatedTotal)}</span>
        </div>
        <Button
          type="submit"
          form="create-transaction-page-form"
          size="lg"
          className="w-full"
          disabled={!canSubmit} loading={isPending}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
