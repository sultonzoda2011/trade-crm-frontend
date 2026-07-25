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
import { useForm } from '~/hooks/useForm';
import { useCan } from '~/hooks/useCan';
import { Action } from '~/config/actions';
import { fmtTJS } from '~/lib/format';
import { mapToOptions } from '~/lib/mapToOptions';
import { useTransactionsModals } from '~/routes/(crm)/transactions/store';
import type { CreateTransactionRequest } from '~/types/transactions';
import { createTransactionSchema, type CreateTransactionSchema } from '~/validations/transactions';

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

  const debtorOptions = useMemo(
    () => mapToOptions(debtorsRes?.data?.data ?? [], 'id', 'name'),
    [debtorsRes],
  );

  const productsList = useMemo(() => productsRes?.data?.data ?? [], [productsRes]);

  const productOptions = useMemo(
    () =>
      productsList.map((p) => ({
        value: p.id,
        label: `${p.name} (${fmtTJS(p.price)})`,
      })),
    [productsList],
  );

  // Продавец (SELLER) по бизнес-правилам может оформлять только продажу в долг —
  // тип SALE ему в форме не показываем, даже если сама транзакция технически
  // доступна к созданию (это решает backend через @Roles, но UI не должен
  // предлагать действие, которое всё равно будет отклонено).
  const canCreateSale = can(Action.TRANSACTIONS_CREATE_SALE);

  const typeOptions = useMemo(
    () =>
      [
        canCreateSale ? { value: 'SALE', label: t('type.SALE') } : null,
        { value: 'DEBT', label: t('type.DEBT') },
      ].filter(Boolean) as { value: string; label: string }[],
    [t, canCreateSale],
  );

  const paymentTypeOptions = useMemo(
    () => [
      { value: 'CASH', label: t('paymentType.CASH') },
      { value: 'CARD', label: t('paymentType.CARD') },
      { value: 'CREDIT', label: t('paymentType.CREDIT') },
    ],
    [t],
  );

  const { control, handleSubmit, reset, watch } = useForm<CreateTransactionSchema>({
    resolver: zodResolver(createTransactionSchema(t)),
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
  const calculatedTotal = useMemo(() => {
    return items.reduce((acc, item) => {
      const product = productsList.find((p) => p.id === item.productId);
      const q = Number(item.quantity) || 0;
      const p = product?.price ?? 0;
      const d = Number(item.discount) || 0;
      return acc + Math.max(q * p - d, 0);
    }, 0);
  }, [items, productsList]);

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CreateTransactionSchema) => {
      // Цена не отправляется вообще — сервер сам подставит её из карточки
      // товара; с фронта уходит только id/quantity/discount.
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
      createModal.close();
      reset();
    },
    onError: () => {
      toast.error(t('createError'));
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
      className="max-w-2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-sm font-medium">
            {t('fields.totalAmount')}: <span className="font-mono font-bold text-base">{fmtTJS(calculatedTotal)}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={createModal.close}>
              {t('actions.cancel', { ns: 'common' })}
            </Button>
            <Button type="submit" form="create-transaction-form" disabled={isPending}>
              {t('actions.create', { ns: 'common' })}
            </Button>
          </div>
        </div>
      }>
      <form id="create-transaction-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <FormCustomSelect
            control={control}
            name="type"
            label={t('fields.type')}
            options={typeOptions}
            required
          />
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
          <FormInput control={control} name="dueDate" type="date" label={t('fields.dueDate')} />
        )}

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">{t('fields.items')}</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => append({ productId: '', quantity: 1, price: 0, discount: 0 })}>
              <Plus className="h-3.5 w-3.5" />
              {t('fields.addItem')}
            </Button>
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-[1fr_90px_110px_90px_36px] gap-2 items-end">
              <div>
                <FormCustomSelect
                  control={control}
                  name={`items.${index}.productId`}
                  placeholder={t('fields.product')}
                  options={productOptions}
                />
              </div>
              <div>
                <FormInput
                  control={control}
                  name={`items.${index}.quantity`}
                  type="number"
                  placeholder={t('fields.quantity')}
                />
              </div>
              <div className="flex h-9 items-center justify-end rounded-md border border-input bg-muted/40 px-3 font-mono text-sm text-muted-foreground">
                {/* Цена только для отображения — не редактируется и не отправляется
                    на сервер, реальную цену всегда берёт бэкенд из товара. */}
                {fmtTJS(productsList.find((p) => p.id === items[index]?.productId)?.price ?? 0)}
              </div>
              <div>
                <FormInput
                  control={control}
                  name={`items.${index}.discount`}
                  type="number"
                  placeholder={t('fields.discount')}
                />
              </div>
              <div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10 h-9 w-9"
                  disabled={fields.length === 1}
                  onClick={() => remove(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </form>
    </Modal>
  );
}
