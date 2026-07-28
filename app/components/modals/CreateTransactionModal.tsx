import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { useFieldArray } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { debtorsApi } from '~/api/debtors';
import { productsApi } from '~/api/products';
import { transactionsApi } from '~/api/transactions';
import { Modal } from '~/components/shared/Modal';
import { Button } from '~/components/ui/button';
import { FormCustomSelect } from '~/components/ui/form/FormCustomSelect';
import { FormInput } from '~/components/ui/form/FormInput';
import { Action } from '~/config/actions';
import { getPaymentTypeOptions, getTransactionTypeOptions } from '~/config/enumOptions';
import { useCan } from '~/hooks/useCan';
import { useForm } from '~/hooks/useForm';
import { fmtTJS } from '~/lib/format';
import { mapToOptions } from '~/lib/mapToOptions';
import { useTransactionsModals } from '~/routes/(crm)/transactions/store';
import type { CreateTransactionRequest } from '~/types/transactions';
import {
  createTransactionSchema,
  type CreateTransactionItemSchema,
  type CreateTransactionSchema,
} from '~/validations/transactions';

export function CreateTransactionModal() {
  const { t } = useTranslation(['transactions', 'common', 'validation']);
  const queryClient = useQueryClient();
  const createModal = useTransactionsModals((s) => s.create);
  const { can } = useCan();

  const { data: debtorsRes } = useQuery({
    queryKey: ['debtors', 'select'],
    queryFn: () => debtorsApi.getAll(1, 100),
    enabled: createModal.isOpen,
  });

  const { data: productsRes } = useQuery({
    queryKey: ['products', 'select'],
    queryFn: () => productsApi.getAll(1, 100),
    enabled: createModal.isOpen,
  });

  const debtorOptions = useMemo(() => mapToOptions(debtorsRes?.data?.data ?? [], 'id', 'name'), [debtorsRes]);

  const productsList = useMemo(() => productsRes?.data?.data ?? [], [productsRes]);

  const productOptions = useMemo(
    () =>
      productsList.map((p) => ({
        value: p.id,
        label: `${p.name} (${fmtTJS(p.price)})`,
      })),
    [productsList]
  );

  const canCreateSale = can(Action.TRANSACTIONS_CREATE_SALE);

  const typeOptions = useMemo(
    () => getTransactionTypeOptions(t).filter((opt) => canCreateSale || opt.value !== 'SALE'),
    [t, canCreateSale]
  );

  const paymentTypeOptions = useMemo(() => getPaymentTypeOptions(t), [t]);

  const { control, handleSubmit, reset, watch, formState } = useForm<CreateTransactionSchema>({
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

  const getItemTotal = useMemo(
    () => (item?: CreateTransactionItemSchema | undefined) => {
      if (!item) return 0;
      const product = productsList.find((p) => p.id === item.productId);
      const q = Number(item.quantity) || 0;
      const p = product?.price ?? 0;
      const d = Number(item.discount) || 0;
      return Math.max(q * p - d, 0);
    },
    [productsList]
  );

  const calculatedTotal = useMemo(() => {
    return (Array.isArray(items) ? items : []).reduce((acc, item) => acc + getItemTotal(item), 0);
  }, [items, getItemTotal]);

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
      toast.success(t('transactions:createSuccess'));
      createModal.close();
      reset();
    },
    onError: () => {
      toast.error(t('transactions:createError'));
    },
  });

  function onSubmit(data: CreateTransactionSchema) {
    mutate(data);
  }

  return (
    <Modal
      open={createModal.isOpen}
      onClose={createModal.close}
      title={t('create')}
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="text-sm font-medium">
            {t('fields.totalAmount')}: <span className="font-mono text-base font-bold">{fmtTJS(calculatedTotal)}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={createModal.close}>
              {t('actions.cancel', { ns: 'common' })}
            </Button>
            <Button type="submit" form="create-transaction-form" disabled={isPending || !formState.isValid}>
              {t('actions.create', { ns: 'common' })}
            </Button>
          </div>
        </div>
      }>
      <form id="create-transaction-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
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
          />
        </div>

        {type === 'DEBT' && (
          <FormInput control={control} name="dueDate" type="date" label={t('fields.dueDate')} required />
        )}

        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">{t('fields.items')}</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => append({ productId: '', quantity: 1, discount: 0 })}>
              <Plus className="h-3.5 w-3.5" />
              {t('fields.addItem')}
            </Button>
          </div>
          <div className="bg-border/60 h-px" />
          <div className="space-y-3">
            {fields.map((field, index) => {
              const item = items[index];
              const itemTotal = getItemTotal(item);

              return (
                <div key={field.id} className="grid gap-3 grid-cols-12 lg:grid-cols-12 lg:items-end">
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
                  <div className="col-span-12 lg:col-span-2">
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
                  <div className="col-span-12 lg:col-span-2">
                    <FormInput
                      control={control}
                      label={t('fields.discount')}
                      name={`items.${index}.discount`}
                      type="number"
                      placeholder={t('fields.discount')}
                      required
                    />
                  </div>
                  <div className="col-span-12 lg:col-span-2">
                    <label className="mb-2 block text-sm font-medium">{t('fields.totalPrice')}</label>
                    <div className="bg-muted/40 flex h-10 items-center justify-end rounded-md border px-3 font-mono text-sm">
                      {fmtTJS(itemTotal)}
                    </div>
                  </div>
                  <div className="col-span-12 lg:col-span-1 lg:col-start-12 flex justify-end">
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
              );
            })}
          </div>
        </div>
      </form>
    </Modal>
  );
}
