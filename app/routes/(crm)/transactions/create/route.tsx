import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { AlertTriangle, Banknote, Loader2, Package, Plus, ShoppingCart, Tag, Trash2, Wallet } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useFieldArray } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { debtorsApi } from '~/api/debtors';
import { productsApi } from '~/api/products';
import { transactionsApi } from '~/api/transactions';
import { Panel } from '~/components/layout/Panel';
import { CustomInput } from '~/components/shared/CustomInput';
import { Badge } from '~/components/ui/badge';
import BreadCrumbs from '~/components/ui/bread-crumb';
import { Button } from '~/components/ui/button';
import { FormCustomSelect } from '~/components/ui/form/FormCustomSelect';
import { FormDateInput } from '~/components/ui/form/FormDateInput';
import { FormInput } from '~/components/ui/form/FormInput';
import { Action } from '~/config/actions';
import { getPaymentTypeOptions, getTransactionTypeOptions } from '~/config/enumOptions';
import { useAsyncSelectOptions } from '~/hooks/useAsyncSelectOptions';
import { useCan } from '~/hooks/useCan';
import { useForm } from '~/hooks/useForm';
import { fmtTJS } from '~/lib/format';
import type { CreateTransactionRequest } from '~/types/transactions';
import {
  createTransactionSchema,
  isOverStock,
  type CreateTransactionInput,
  type CreateTransactionItemInput,
} from '~/validations/transactions';

export default function CreateTransactionPage() {
  const { t } = useTranslation(['transactions', 'common', 'validation']);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can } = useCan();

  const canCreateSale = can(Action.TRANSACTIONS_CREATE_SALE);

  // Server-side search: the debtor/product lists can exceed any fixed page, so instead of
  // loading a capped first page and filtering locally we query the API as the user types.
  const debtors = useAsyncSelectOptions({
    queryKey: ['debtors', 'select'],
    fetcher: async (search) => (await debtorsApi.getAll(1, 20, { search: search || undefined }))?.data?.data ?? [],
    getValue: (d) => d.id,
    getLabel: (d) => d.name,
  });

  const products = useAsyncSelectOptions({
    queryKey: ['products', 'select'],
    fetcher: async (search) => (await productsApi.getAll(1, 20, { search: search || undefined }))?.data?.data ?? [],
    getValue: (p) => p.id,
    getLabel: (p) => p.name,
  });

  const debtorOptions = debtors.options;
  const productOptions = products.options;

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

  const typeOptions = useMemo(
    () => getTransactionTypeOptions(t).filter((opt) => canCreateSale || opt.value !== 'SALE'),
    [t, canCreateSale]
  );

  const transactionSchema = useMemo(() => createTransactionSchema(t, stockMap, priceMap), [t, stockMap, priceMap]);

  const { control, handleSubmit, watch, setValue, formState } = useForm<CreateTransactionInput>({
    resolver: zodResolver(transactionSchema),
    mode: 'onChange',
    // shouldUnregister: true конфликтует с useFieldArray (задокументированная
    // проблема RHF) — при добавлении/удалении строки товара значения массива
    // items могли кратковременно рассинхронизироваться, из-за чего сводка
    // платежа не подхватывала первую позицию сразу. dueDate (единственное
    // поле, что рендерится условно) и без unregister корректно отсекается в
    // mutationFn ниже, поэтому реальной необходимости в этой опции не было.
    defaultValues: {
      debtorId: '',
      customerName: '',
      type: canCreateSale ? 'SALE' : 'DEBT',
      paymentType: canCreateSale ? 'CASH' : 'CREDIT',
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

  const paymentTypeOptions = useMemo(() => {
    const base = getPaymentTypeOptions(t);
    return type === 'DEBT' ? base.filter((o) => o.value === 'CREDIT') : base.filter((o) => o.value !== 'CREDIT');
  }, [t, type]);

  useEffect(() => {
    if (type === 'DEBT') {
      if (paymentType !== 'CREDIT') setValue('paymentType', 'CREDIT', { shouldValidate: true });
    } else if (paymentType === 'CREDIT') {
      setValue('paymentType', 'CASH', { shouldValidate: true });
    }
  }, [type, paymentType, setValue]);

  const productMap = products.byId;

  // ВАЖНО: раньше это была цепочка useMemo-мемоизированных функций
  // (getProduct → getItemTotal → calculatedTotal), каждая со своим списком
  // зависимостей. Когда items и productMap менялись в одном и том же рендере
  // (типичный случай: только что выбрали товар — сразу пришли и новый
  // productId, и подрос byId), memo-кэш каждого уровня инвалидировался
  // независимо, и итоговая сумма могла на один рендер отстать от реальных
  // items/productMap — с одной позицией это отставание никогда не
  // "догонялось" (следующего триггера для пересчёта не было), и итог
  // застревал на 0. Считаем всё напрямую в один проход, без промежуточных
  // мемоизированных функций-замыканий.
  const getProduct = (productId?: string | null) => (productId ? productMap.get(productId) : undefined);

  const itemsList = Array.isArray(items) ? items : [];

  // ВАЖНО: раньше это было завёрнуто в useMemo([itemsList, productMap]).
  // Реальная причина бага — не в этой мемоизации самой по себе, а в том,
  // что react-hook-form's watch('items') не гарантирует новую ссылку на
  // массив при изменении вложенного поля через Controller (известная
  // особенность RHF: массив может мутироваться "на месте"). Из-за этого
  // useMemo решал, что зависимости не изменились, и отдавал закэшированный
  // (устаревший) итог — а строка "Итого" в самой карточке товара (обычная
  // функция, без memo) всегда пересчитывалась верно, отсюда расхождение:
  // в карточке видно 15 000, а в сводке платежа — 0. Расчёт тут дешёвый
  // (цикл по нескольким позициям), поэтому просто считаем каждый рендер,
  // без useMemo — синхронность важнее микрооптимизации.
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

  // Тот же риск устаревания ссылки на itemsList, что и у calculatedTotal
  // выше — считаем напрямую, без useMemo.
  const hasStockIssue = itemsList.some((item) =>
    isOverStock(item?.quantity, item?.productId ? stockMap[item.productId] : undefined)
  );

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
      void queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success(t('createSuccess'));
      navigate('/transactions');
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

  return (
    <div className="flex flex-1 flex-col space-y-6 pb-24 md:pb-8">
      <BreadCrumbs
        items={[
          { label: t('navigation.dashboard', { ns: 'common' }), link: '/dashboard' },
          { label: t('title'), link: '/transactions' },
          { label: t('create') },
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('create')}</h1>
          <p className="text-muted-foreground text-sm">{t('createSubtitle')}</p>
        </div>
        {/*
         * На телефоне это же действие продублировано в sticky-панели снизу
         * (форма длинная, скроллить наверх к кнопке после заполнения — плохой UX).
         * Здесь оставляем только для md+, где форма умещается в 2 колонки и
         * кнопка сверху всегда в поле зрения.
         */}
        <div className="hidden gap-3 md:flex">
          <Button variant="outline" onClick={() => navigate('/transactions')}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button type="submit" form="create-transaction-page-form" disabled={isPending || !formState.isValid}>
            {isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
            {t('actions.create', { ns: 'common' })}
          </Button>
        </div>
      </div>

      <form
        id="create-transaction-page-form"
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[5fr_3fr]">
        <div className="space-y-6">
          <Panel
            title={t('fields.items')}
            actions={
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1 text-xs"
                onClick={() => append({ productId: '', quantity: 1, discount: 0, markup: 0 })}>
                <Plus className="h-3.5 w-3.5" />
                {t('fields.addItem')}
              </Button>
            }
            className="p-4">
            <div className="space-y-3">
              {fields.map((field, index) => {
                const item = items[index];
                const product = getProduct(item?.productId);
                const itemTotal = getItemTotal(item);
                const overStock = isOverStock(item?.quantity, product?.quantity);
                const qty = Number(item?.quantity) || 0;

                return (
                  <div key={field.id} className="bg-card rounded-xl border p-4 shadow-sm">
                    <FormCustomSelect
                      control={control}
                      label={t('fields.product')}
                      name={`items.${index}.productId`}
                      placeholder={t('fields.product')}
                      options={productOptions}
                      onSearch={products.onSearch}
                      loading={products.loading}
                      required
                    />

                    <div className="mt-3 grid grid-cols-2 items-end gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium">{t('fields.price')}</label>
                        <CustomInput readOnly value={product ? fmtTJS(product.price) : ''} placeholder="—" />
                      </div>
                      <FormInput
                        control={control}
                        label={t('fields.quantity')}
                        name={`items.${index}.quantity`}
                        type="number"
                        inputMode="decimal"
                        min={1}
                        placeholder={t('fields.quantity')}
                        required
                      />
                      <FormInput
                        control={control}
                        label={t('fields.discount')}
                        name={`items.${index}.discount`}
                        type="number"
                        inputMode="decimal"
                        min={0}
                        placeholder={t('fields.discount')}
                      />
                      <FormInput
                        control={control}
                        label={t('fields.markup')}
                        name={`items.${index}.markup`}
                        type="number"
                        inputMode="decimal"
                        min={0}
                        placeholder={t('fields.markup')}
                      />
                      <div>
                        <label className="mb-1.5 block text-sm font-medium">{t('fields.totalPrice')}</label>
                        <div className="bg-muted/40 flex h-8 items-center justify-end rounded-lg border px-2.5 font-mono text-sm font-semibold">
                          {fmtTJS(itemTotal)}
                        </div>
                      </div>
                      <div className="flex items-end justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10 h-8 w-8"
                          disabled={fields.length === 1}
                          onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {product && (
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs">
                        <div className="flex items-center gap-2">
                          <Package className="text-muted-foreground h-3.5 w-3.5" />
                          <span className={overStock ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                            {t('inStock')}: {product.quantity}
                          </span>
                          {overStock && (
                            <span className="text-destructive flex items-center gap-1 font-medium">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              {t('stockError')}
                            </span>
                          )}
                        </div>
                        <div className="text-muted-foreground font-mono">
                          {fmtTJS(product.price)} × {qty}
                          {Number(item?.discount) > 0 && <> − {fmtTJS(Number(item?.discount) || 0)}</>}
                          {Number(item?.markup) > 0 && <> + {fmtTJS(Number(item?.markup) || 0)}</>}
                          {' = '}
                          <span className="text-foreground font-semibold">{fmtTJS(itemTotal)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title={t('paymentSummary')}>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <ShoppingCart className="h-3.5 w-3.5" />
                  {t('fields.totalAmount')}
                </span>
                <span className="font-mono font-semibold">{fmtTJS(calculatedTotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" />
                  {t('fields.discount')}
                </span>
                {totalDiscount > 0 && <span className="font-mono font-semibold">− {fmtTJS(totalDiscount)}</span>}
              </div>
              {totalMarkup > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5" />
                    {t('fields.markup')}
                  </span>
                  <span className="font-mono font-semibold">+ {fmtTJS(totalMarkup)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5" />
                  {t('fields.credited')}
                </span>
                <span className="text-success font-mono font-semibold">
                  {fmtTJS(type === 'DEBT' ? 0 : calculatedTotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Banknote className="h-3.5 w-3.5" />
                  {t('fields.remainingAmount')}
                </span>
                <span className="text-warning font-mono font-semibold">
                  {fmtTJS(type === 'DEBT' ? calculatedTotal : 0)}
                </span>
              </div>
              <div className="bg-border h-px" />
              <p className="text-muted-foreground text-xs leading-relaxed">
                {type === 'DEBT' ? t('debtHint') : t('creditedHint')}
              </p>
              {hasStockIssue && (
                <Badge
                  variant="outline"
                  className="border-destructive/40 bg-destructive/10 text-destructive w-full justify-center gap-1.5 py-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {t('stockError')}
                </Badge>
              )}
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title={t('details')}>
            <div className="space-y-4">
              <FormCustomSelect control={control} name="type" label={t('fields.type')} options={typeOptions} required />
              <FormCustomSelect
                control={control}
                name="paymentType"
                label={t('fields.paymentType')}
                options={paymentTypeOptions}
                required
              />
              <FormInput
                control={control}
                name="customerName"
                label={t('fields.customer')}
                placeholder={t('fields.customer')}
              />
              {type === 'DEBT' && (
                <div>
                  <FormCustomSelect
                    control={control}
                    name="debtorId"
                    label={t('fields.debtor')}
                    placeholder={t('fields.debtor')}
                    options={debtorOptions}
                    onSearch={debtors.onSearch}
                    loading={debtors.loading}
                    isClearable
                    required
                  />
                  <FormDateInput
                    control={control}
                    name="dueDate"
                    placeholder={t('fields.dueDate')}
                    minDate={new Date()}
                    label={t('fields.dueDate')}
                    required
                  />
                </div>
              )}
            </div>
          </Panel>
        </div>
      </form>

      {/*
       * Мобильная sticky-панель: итог + Cancel/Create всегда доступны, форма
       * может быть длинной (несколько позиций товара), скроллить к кнопке
       * наверх — плохой UX. pb учитывает safe-area (жестовая навигация Android).
       */}
      <div
        className="bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t px-4 pt-3 backdrop-blur md:hidden"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('fields.totalAmount')}</span>
          <span className="font-mono text-base font-semibold">{fmtTJS(calculatedTotal)}</span>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => navigate('/transactions')}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button
            type="submit"
            form="create-transaction-page-form"
            className="flex-1"
            disabled={isPending || !formState.isValid}>
            {isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
            {t('actions.create', { ns: 'common' })}
          </Button>
        </div>
      </div>
    </div>
  );
}
