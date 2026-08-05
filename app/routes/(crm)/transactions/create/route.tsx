import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Banknote, Loader2, Package, Plus, ShoppingCart, Tag, Trash2, Wallet } from 'lucide-react';
import { useMemo } from 'react';
import { useFieldArray } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { debtorsApi } from '~/api/debtors';
import { productsApi } from '~/api/products';
import { transactionsApi } from '~/api/transactions';
import { Panel } from '~/components/layout/Panel';
import { Badge } from '~/components/ui/badge';
import BreadCrumbs from '~/components/ui/bread-crumb';
import { Button } from '~/components/ui/button';
import { FormCustomSelect } from '~/components/ui/form/FormCustomSelect';
import { FormInput } from '~/components/ui/form/FormInput';
import { Action } from '~/config/actions';
import { getPaymentTypeOptions, getTransactionTypeOptions } from '~/config/enumOptions';
import { useCan } from '~/hooks/useCan';
import { useForm } from '~/hooks/useForm';
import { fmtTJS } from '~/lib/format';
import { mapToOptions } from '~/lib/mapToOptions';
import type { CreateTransactionRequest } from '~/types/transactions';
import {
  createTransactionSchema,
  type CreateTransactionItemSchema,
  type CreateTransactionSchema,
} from '~/validations/transactions';

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

  const productOptions = useMemo(
    () =>
      productsList.map((p) => ({
        value: p.id,
        label: `${p.name} — ${fmtTJS(p.price)}`,
      })),
    [productsList]
  );

  const typeOptions = useMemo(
    () => getTransactionTypeOptions(t).filter((opt) => canCreateSale || opt.value !== 'SALE'),
    [t, canCreateSale]
  );

  const paymentTypeOptions = useMemo(() => getPaymentTypeOptions(t), [t]);

  const { control, handleSubmit, watch, formState } = useForm<CreateTransactionSchema>({
    resolver: zodResolver(createTransactionSchema(t)),
    mode: 'onChange',
    shouldUnregister: true,
    defaultValues: {
      debtorId: '',
      type: canCreateSale ? 'SALE' : 'DEBT',
      paymentType: 'CASH',
      dueDate: '',
      items: [{ productId: '', quantity: 1, discount: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const type = watch('type');
  const items = watch('items') || [];

  const getProduct = useMemo(
    () => (productId?: string) => productsList.find((p) => p.id === productId),
    [productsList]
  );

  const getItemTotal = useMemo(
    () => (item?: CreateTransactionItemSchema | undefined) => {
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
    () => (item?: CreateTransactionItemSchema | undefined) => {
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
      (Array.isArray(items) ? items : []).some((item) => {
        const product = getProduct(item?.productId);
        return !!product && Number(item?.quantity) > product.quantity;
      }),
    [items, getProduct]
  );

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CreateTransactionSchema) => {
      const payload: CreateTransactionRequest = {
        debtorId: data.debtorId || undefined,
        type: data.type as CreateTransactionRequest['type'],
        paymentType: data.paymentType,
        dueDate: data.type === 'DEBT' && data.dueDate ? data.dueDate : undefined,
        items: data.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          discount: item.discount || undefined,
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

  function onSubmit(data: CreateTransactionSchema) {
    mutate(data);
  }

  return (
    <div className="flex flex-1 flex-col space-y-6 pb-8">
      <BreadCrumbs
        items={[
          { label: t('navigation.dashboard', { ns: 'common' }), link: '/' },
          { label: t('title'), link: '/transactions' },
          { label: t('create') },
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('create')}</h1>
          <p className="text-muted-foreground text-sm">{t('createSubtitle')}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/transactions')}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button
            type="submit"
            form="create-transaction-page-form"
            disabled={isPending || !formState.isValid || hasStockIssue}>
            {isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
            {t('actions.create', { ns: 'common' })}
          </Button>
        </div>
      </div>

      <form
        id="create-transaction-page-form"
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-6 lg:grid-cols-[7fr_3.2fr] items-start">
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
                const overStock = !!product && Number(item?.quantity) > product.quantity;

                return (
                  <div key={field.id} className="bg-muted/30 rounded-lg border p-3">
                    <div className="grid grid-cols-12 gap-3 lg:items-end">
                      <div className="col-span-12 lg:col-span-5">
                        <FormCustomSelect
                          control={control}
                          label={t('fields.product')}
                          name={`items.${index}.productId`}
                          placeholder={t('fields.product')}
                          options={productOptions}
                          required
                        />
                      </div>
                      <div className="col-span-6 lg:col-span-2">
                        <FormInput
                          control={control}
                          label={t('fields.quantity')}
                          name={`items.${index}.quantity`}
                          type="number"
                          min={1}
                          placeholder={t('fields.quantity')}
                          required
                        />
                      </div>
                      <div className="col-span-6 lg:col-span-2">
                        <FormInput
                          control={control}
                          label={t('fields.discount')}
                          name={`items.${index}.discount`}
                          type="number"
                          min={0}
                          placeholder={t('fields.discount')}
                        />
                      </div>
                      <div className="col-span-9 lg:col-span-2">
                        <label className="mb-2 block text-sm font-medium">{t('fields.totalPrice')}</label>
                        <div className="bg-background flex h-10 items-center justify-end rounded-md border px-3 font-mono text-sm font-semibold">
                          {fmtTJS(itemTotal)}
                        </div>
                      </div>
                      <div className="col-span-3 lg:col-span-1 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10 h-10 w-9"
                          disabled={fields.length === 1}
                          onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {product && (
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t pt-2 text-xs">
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
                          {fmtTJS(product.price)} × {Number(item?.quantity) || 0}
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
              <FormCustomSelect
                control={control}
                name="debtorId"
                label={t('fields.debtor')}
                placeholder={t('fields.debtor')}
                options={debtorOptions}
                isClearable
                required={type === 'DEBT'}
              />
              {type === 'DEBT' && (
                <FormInput control={control} name="dueDate" type="date" label={t('fields.dueDate')} required />
              )}
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
              {totalDiscount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5" />
                    {t('fields.discount')}
                  </span>
                  <span className="font-mono font-semibold">− {fmtTJS(totalDiscount)}</span>
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
                <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-destructive w-full justify-center gap-1.5 py-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {t('stockError')}
                </Badge>
              )}
            </div>
          </Panel>
        </div>
      </form>
    </div>
  );
}
