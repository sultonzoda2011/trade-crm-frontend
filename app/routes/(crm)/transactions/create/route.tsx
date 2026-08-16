import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { AlertTriangle, Banknote, Loader2, Package, Plus, ShoppingCart, Tag, Trash2, Wallet } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useFieldArray } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { debtorsApi } from '~/api/debtors'
import { productsApi } from '~/api/products'
import { transactionsApi } from '~/api/transactions'
import { Panel } from '~/components/layout/Panel'
import { CustomInput } from '~/components/shared/CustomInput'
import { Badge } from '~/components/ui/badge'
import BreadCrumbs from '~/components/ui/bread-crumb'
import { Button } from '~/components/ui/button'
import { FormCustomSelect } from '~/components/ui/form/FormCustomSelect'
import { FormDateInput } from '~/components/ui/form/FormDateInput'
import { FormInput } from '~/components/ui/form/FormInput'
import { Action } from '~/config/actions'
import { getPaymentTypeOptions, getTransactionTypeOptions } from '~/config/enumOptions'
import { useCan } from '~/hooks/useCan'
import { useForm } from '~/hooks/useForm'
import { fmtTJS } from '~/lib/format'
import { mapToOptions } from '~/lib/mapToOptions'
import type { CreateTransactionRequest } from '~/types/transactions'
import {
  createTransactionSchema,
  isOverStock,
  type CreateTransactionInput,
  type CreateTransactionItemInput,
} from '~/validations/transactions'

export default function CreateTransactionPage() {
  const { t } = useTranslation(['transactions', 'common', 'validation']);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can } = useCan();

  const canCreateSale = can(Action.TRANSACTIONS_CREATE_SALE);

  const { data: debtorsRes } = useQuery({
    queryKey: ['debtors', 'select'],
    queryFn: () => debtorsApi.getAll(1, 100),
    staleTime: 30_000,
  });

  const { data: productsRes } = useQuery({
    queryKey: ['products', 'select'],
    queryFn: () => productsApi.getAll(1, 100),
    staleTime: 30_000,
  });

  const debtorOptions = useMemo(() => mapToOptions(debtorsRes?.data?.data ?? [], 'id', 'name'), [debtorsRes]);

  const productsList = useMemo(() => productsRes?.data?.data ?? [], [productsRes]);

  const stockMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of productsList) map[p.id] = p.quantity;
    return map;
  }, [productsList]);

  const productOptions = useMemo(() => mapToOptions(productsList, 'id', 'name'), [productsList]);

  const typeOptions = useMemo(
    () => getTransactionTypeOptions(t).filter((opt) => canCreateSale || opt.value !== 'SALE'),
    [t, canCreateSale]
  );

  const transactionSchema = useMemo(() => createTransactionSchema(t, stockMap), [t, stockMap]);

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
      items: [{ productId: '', quantity: 1, discount: 0 }],
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

  const productMap = useMemo(() => {
    const map = new Map<string, (typeof productsList)[number]>();
    for (const p of productsList) map.set(p.id, p);
    return map;
  }, [productsList]);

  const getProduct = useMemo(
    () => (productId?: string | null) => (productId ? productMap.get(productId) : undefined),
    [productMap]
  );

  const getItemTotal = useMemo(
    () => (item?: CreateTransactionItemInput | undefined) => {
      if (!item) return 0;
      const product = getProduct(item.productId);
      const q = Number(item.quantity) || 0;
      const p = product?.price ?? 0;
      const d = Number(item.discount) || 0;
      return Math.max(q * p - d, 0);
    },
    [getProduct]
  );

  const calculatedTotal = useMemo(() => {
    return (Array.isArray(items) ? items : []).reduce((acc, item) => acc + getItemTotal(item), 0);
  }, [items, getItemTotal]);

  const getItemGross = useMemo(
    () => (item?: CreateTransactionItemInput | undefined) => {
      if (!item) return 0;
      const product = getProduct(item.productId);
      const q = Number(item.quantity) || 0;
      const p = product?.price ?? 0;
      return q * p;
    },
    [getProduct]
  );

  const totalDiscount = useMemo(() => {
    return (Array.isArray(items) ? items : []).reduce((acc, item) => {
      const gross = getItemGross(item);
      const net = getItemTotal(item);
      return acc + Math.max(gross - net, 0);
    }, 0);
  }, [items, getItemGross, getItemTotal]);

  const hasStockIssue = useMemo(
    () =>
      (Array.isArray(items) ? items : []).some((item) =>
        isOverStock(item?.quantity, item?.productId ? stockMap[item.productId] : undefined)
      ),
    [items, stockMap]
  );

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CreateTransactionInput) => {
      const payload: CreateTransactionRequest = {
        debtorId: data.debtorId || undefined,
        customerName:data.customerName || undefined,
        type: (data.type ?? 'DEBT') as CreateTransactionRequest['type'],
        paymentType: (data.paymentType ?? 'CASH') as CreateTransactionRequest['paymentType'],
        dueDate: data.type === 'DEBT' && data.dueDate ? data.dueDate : undefined,
        items: data.items.map((item) => ({
          productId: item.productId ?? '',
          quantity: Number(item.quantity),
          discount: item.discount ? Number(item.discount) : undefined,
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
                onClick={() => append({ productId: '', quantity: 1, discount: 0 })}>
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
                      required
                    />

                    <div className="mt-3 grid grid-cols-2 items-end gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
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

          <Panel title={t('paymentSummary')} className="p-4">
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
          <Panel title={t('details')} className="p-4">
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
