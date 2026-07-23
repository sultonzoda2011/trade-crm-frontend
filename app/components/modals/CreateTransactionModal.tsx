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
import { fmtTJS } from '~/lib/format';
import { mapToOptions } from '~/lib/mapToOptions';
import { useTransactionsModals } from '~/routes/(crm)/transactions/store';
import { createTransactionSchema, type CreateTransactionSchema } from '~/validations/transaction';

export function CreateTransactionModal() {
  const { t } = useTranslation(['transactions', 'common', 'validation']);
  const queryClient = useQueryClient();
  const createModal = useTransactionsModals((s) => s.create);

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

  const typeOptions = useMemo(
    () => [
      { value: 'SALE', label: t('type.SALE') },
      { value: 'DEBT', label: t('type.DEBT') },
    ],
    [t],
  );

  const paymentTypeOptions = useMemo(
    () => [
      { value: 'CASH', label: t('paymentType.CASH') },
      { value: 'CARD', label: t('paymentType.CARD') },
      { value: 'CREDIT', label: t('paymentType.CREDIT') },
    ],
    [t],
  );

  const { control, handleSubmit, reset, watch, setValue } = useForm<CreateTransactionSchema>({
    resolver: zodResolver(createTransactionSchema(t)),
    defaultValues: {
      debtorId: '',
      type: 'SALE',
      paymentType: 'CASH',
      items: [{ productId: '', quantity: 1, price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const items = watch('items') || [];
  const calculatedTotal = useMemo(() => {
    return items.reduce((acc, item) => {
      const q = Number(item.quantity) || 0;
      const p = Number(item.price) || 0;
      return acc + q * p;
    }, 0);
  }, [items]);

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CreateTransactionSchema) => transactionsApi.create(data),
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

  function handleProductChange(index: number, productId: string) {
    setValue(`items.${index}.productId`, productId);
    const selectedProd = productsList.find((p) => p.id === productId);
    if (selectedProd) {
      setValue(`items.${index}.price`, selectedProd.price);
    }
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

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">{t('fields.items')}</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => append({ productId: '', quantity: 1, price: 0 })}>
              <Plus className="h-3.5 w-3.5" />
              {t('fields.addItem')}
            </Button>
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-[1fr_100px_120px_36px] gap-2 items-end">
              <div>
                <FormCustomSelect
                  control={control}
                  name={`items.${index}.productId`}
                  placeholder={t('fields.product')}
                  options={productOptions}
                  onChange={(val) => handleProductChange(index, val as string)}
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
              <div>
                <FormInput
                  control={control}
                  name={`items.${index}.price`}
                  type="number"
                  placeholder={t('fields.price')}
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
