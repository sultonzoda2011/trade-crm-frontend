import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useFieldArray } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { debtorsApi } from '~/api/debtors';
import { productsApi } from '~/api/products';
import { CreateDebtorModal } from '~/components/modals/CreateDebtorModal';
import { ListGroup, ListRow } from '~/components/shared/ListGroup';
import { DebtorPickerSheet } from '~/components/transactions/DebtorPickerSheet';
import { ProductPickerSheet } from '~/components/transactions/ProductPickerSheet';
import { TransactionItemCard } from '~/components/transactions/TransactionItemCard';
import { TransactionPaymentSection } from '~/components/transactions/TransactionPaymentSection';
import BreadCrumbs from '~/components/ui/bread-crumb';
import { Button } from '~/components/ui/button';
import { Action } from '~/config/actions';
import { useAsyncSelectOptions } from '~/hooks/useAsyncSelectOptions';
import { useCan } from '~/hooks/useCan';
import type { CreatedDebtor } from '~/hooks/useCreateDebtor';
import { useDetachedMutation } from '~/hooks/useDetachedMutation';
import { useForm } from '~/hooks/useForm';
import { usePendingDebtors, usePendingStock } from '~/hooks/useOfflineOverlay';
import { resolveRealId } from '~/lib/client-ids';
import { fmtTJS } from '~/lib/format';
import {
  createIdempotencyKey,
  OFFLINE_MUTATION_KEYS,
  type QueuedCreateTransactionVars,
  type TransactionPreview,
} from '~/lib/offline-mutations';
import { queryKeys } from '~/lib/query-keys';
import { useDebtorsModals } from '~/routes/(crm)/debtors/store';
import type { Debtor } from '~/types/debtors';
import type { DebtorRow } from '~/types/pending';
import type { Product } from '~/types/products';
import type { CreateTransactionRequest } from '~/types/transactions';
import {
  createTransactionSchema,
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

function getItemTotal(item: CreateTransactionItemInput | undefined, product: Product | undefined): number {
  if (!item) return 0;
  const q = Number(item.quantity) || 0;
  const p = product?.price ?? 0;
  const d = Number(item.discount) || 0;
  const m = Number(item.markup) || 0;
  return Math.max(q * p - d + m, 0);
}

export default function CreateTransactionPage() {
  const { t } = useTranslation(['transactions', 'common', 'validation']);
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = useCan();
  // «Дать долг» со страницы должника приходит с уже выбранным человеком —
  // не заставляем искать его заново.
  const prefill = location.state as {
    debtorId?: string;
    debtorName?: string;
    defaultDueDays?: number;
    fromPath?: string;
  } | null;
  const debtorCreateModal = useDebtorsModals((s) => s.create);
  // Скидка/надбавка нужны редко — по умолчанию скрыты, чтобы карточка товара
  // занимала 2 строки на телефоне вместо 3. Разворачиваем по клику или если
  // в строке уже стоят ненулевые значения (например, при копировании формы).
  const [expandedAdjustments, setExpandedAdjustments] = useState<Record<string, boolean>>({});
  // Индекс строки товара, для которой открыт полноэкранный пикер (null — закрыт).
  // Sheet один на всю форму, а не по одному на строку.
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);
  const [debtorPickerOpen, setDebtorPickerOpen] = useState(false);
  const [debtorSearch, setDebtorSearch] = useState('');
  // Только что заведённый должник: пока сервер его не создал, у него временный id и его нет ни в одном списке сервера.
  const [createdDebtor, setCreatedDebtor] = useState<CreatedDebtor | null>(null);

  const canCreateSale = can(Action.TRANSACTIONS_CREATE_SALE);

  // Server-side search: the debtor/product lists can exceed any fixed page, so instead of
  // loading a capped first page and filtering locally we query the API as the user types.
  const debtors = useAsyncSelectOptions({
    queryKey: queryKeys.options('debtors', { scope: 'form', limit: 100 }),
    fetcher: async (search) => (await debtorsApi.getAll(1, 100, { search: search || undefined }))?.data?.data ?? [],
    getValue: (d) => d.id,
    getLabel: (d) => d.name,
    getSearchText: (d) => `${d.name} ${d.phone ?? ''}`,
    seed: prefill?.debtorId ? [{ id: prefill.debtorId, name: prefill.debtorName ?? '' } as Debtor] : undefined,
  });

  const products = useAsyncSelectOptions({
    queryKey: queryKeys.options('products', { scope: 'form', limit: 100 }),
    fetcher: async (search) => (await productsApi.getAll(1, 100, { search: search || undefined }))?.data?.data ?? [],
    getValue: (p) => p.id,
    getLabel: (p) => p.name,
  });

  // Read stock/price from the accumulated set (products.byId), not just the latest search —
  // a row that already picked a product must keep its data even after the results narrow.
  // Продажи из очереди ещё не списали остатки на сервере — вычитаем их сами, иначе без связи один
  // и тот же товар можно было бы продать дважды, а сервер отклонил бы вторую продажу уже при синхронизации.
  const pendingStock = usePendingStock(products.dataUpdatedAt);
  const stockMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of products.byId.values()) map[p.id] = Math.max(0, p.quantity - (pendingStock[p.id] ?? 0));
    return map;
  }, [products.byId, pendingStock]);

  // Текущая выдача поиска для пикера: options хранит только value/label, а
  // фото/цена/остаток лежат в byId (туда попадает всё, что когда-либо пришло
  // с сервера, включая текущую выдачу) — раскрываем одно через другое, не
  // трогая общий хук useAsyncSelectOptions.
  const pickerItems = useMemo(
    () =>
      products.options
        .map((o) => products.byId.get(String(o.value)))
        .filter((p): p is Product => Boolean(p))
        .map((p) => ({ ...p, quantity: stockMap[p.id] ?? p.quantity })),
    [products.options, products.byId, stockMap]
  );

  const priceMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of products.byId.values()) map[p.id] = p.price;
    return map;
  }, [products.byId]);

  const transactionSchema = useMemo(() => createTransactionSchema(t, stockMap, priceMap), [t, stockMap, priceMap]);

  const initialLastMethod = canCreateSale ? getLastPaymentMethod() : null;
  const initialIsDebt = Boolean(prefill?.debtorId) || !canCreateSale || initialLastMethod === 'DEBT';

  const { control, handleSubmit, watch, setValue, formState } = useForm<CreateTransactionInput>({
    resolver: zodResolver(transactionSchema),
    mode: 'onChange',
    defaultValues: {
      debtorId: prefill?.debtorId ?? '',
      customerName: '',
      note: '',
      paidAmount: '',
      type: initialIsDebt ? 'DEBT' : 'SALE',
      paymentType: initialIsDebt ? 'CREDIT' : initialLastMethod === 'CARD' ? 'CARD' : 'CASH',
      // Срок возврата по умолчанию у должника (если задан) — сразу в форме, а не «сегодня».
      dueDate: dayjs().add(prefill?.defaultDueDays ?? 0, 'day').format('YYYY-MM-DD'),
      items: [{ productId: '', quantity: 1, discount: 0, markup: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

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

  const getProduct = (productId?: string | null): Product | undefined => {
    const product = productId ? products.byId.get(productId) : undefined;
    return product ? { ...product, quantity: stockMap[product.id] ?? product.quantity } : undefined;
  };

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
    totalDiscount += Math.max(gross - (net - m), 0);
    totalMarkup += m;
  }

  // Всё поведение отправки (повторы, инвалидация, тосты) — в setMutationDefaults (offline-mutations.ts):
  // оно срабатывает и когда экрана уже нет (очередь ушла на сервер после перезапуска приложения).
  // Здесь — только то, что относится к этому экрану: когда его можно покинуть.
  const { run, isSubmitting: isPending } = useDetachedMutation<QueuedCreateTransactionVars>(
    OFFLINE_MUTATION_KEYS.createTransaction
  );

  const debtorId = watch('debtorId');
  // Должники из очереди (создание которых ещё не дошло до сервера) тоже можно выбрать.
  const pendingDebtors = usePendingDebtors(debtors.dataUpdatedAt);
  const selectedDebtor: Debtor | undefined = debtorId
    ? (debtors.byId.get(debtorId) ??
      pendingDebtors.find((d) => d.id === debtorId) ??
      (createdDebtor?.id === debtorId ? ({ ...createdDebtor } as Debtor) : undefined))
    : undefined;
  const debtorError = formState.errors.debtorId?.message;

  const pickerDebtors: DebtorRow[] = useMemo(() => {
    const query = debtorSearch.trim().toLowerCase();
    const queued = pendingDebtors.filter(
      (d) => !query || d.name.toLowerCase().includes(query) || d.phone.toLowerCase().includes(query)
    );
    const queuedIds = new Set(queued.map((d) => d.id));
    const fromServer = debtors.options
      .map((o) => debtors.byId.get(String(o.value)))
      .filter((d): d is Debtor => Boolean(d) && !queuedIds.has(d!.id));
    return [...queued, ...fromServer];
  }, [pendingDebtors, debtors.options, debtors.byId, debtorSearch]);

  function onSubmit(data: CreateTransactionInput) {
    if (data.type === 'SALE' && !canCreateSale) {
      toast.error(t('errors.forbidden', { ns: 'common' }));
      return;
    }

    const payload: CreateTransactionRequest = {
      // Временный id нового должника подменится настоящим, когда его создание дойдёт до сервера.
      debtorId: data.debtorId ? resolveRealId(data.debtorId) : undefined,
      customerName: data.customerName || undefined,
      type: (data.type ?? 'DEBT') as CreateTransactionRequest['type'],
      paymentType: (data.paymentType ?? 'CASH') as CreateTransactionRequest['paymentType'],
      dueDate: data.type === 'DEBT' && data.dueDate ? data.dueDate : undefined,
      note: data.note?.trim() || undefined,
      paidAmount: data.type === 'DEBT' && Number(data.paidAmount) > 0 ? Number(data.paidAmount) : undefined,
      items: data.items.map((item) => ({
        productId: item.productId ?? '',
        quantity: Number(item.quantity),
        discount: item.discount ? Number(item.discount) : undefined,
        markup: item.markup ? Number(item.markup) : undefined,
      })),
    };

    // Снимок для списка: пока продажи нет на сервере, название/цену/фото берём отсюда.
    const preview: TransactionPreview = {
      total: calculatedTotal,
      debtorName: selectedDebtor?.name,
      debtorPhone: selectedDebtor?.phone,
      items: payload.items.map((item) => {
        const product = getProduct(item.productId);
        return {
          productId: item.productId,
          name: product?.name ?? '',
          quantity: item.quantity,
          price: product?.price ?? 0,
          image: product?.image ?? null,
        };
      }),
    };

    run(
      { payload, idempotencyKey: createIdempotencyKey(), preview },
      {
        release: () => navigate(prefill?.fromPath ?? '/transactions'),
        offlineMessage: t('createQueuedOffline'),
        slowMessage: t('createQueuedSlow'),
      }
    );
  }

  const canSubmit = formState.isValid;
  // Сумма прямо в кнопке: продавец видит, сколько принимает, и не листает вверх за итогом.
  const advance = type === 'DEBT' ? Math.max(Number(watch('paidAmount')) || 0, 0) : 0;
  const payNow = type === 'DEBT' ? advance : calculatedTotal;
  const submitLabel =
    calculatedTotal > 0
      ? type === 'DEBT'
        ? t('submitDebtAmount', { amount: fmtTJS(Math.max(calculatedTotal - advance, 0)) })
        : t('submitSaleAmount', { amount: fmtTJS(payNow) })
      : type === 'DEBT'
        ? t('submitDebt')
        : t('submitSale');

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
        <TransactionPaymentSection
          canCreateSale={canCreateSale}
          paymentMethod={paymentMethod}
          type={type}
          selectedDebtor={selectedDebtor}
          debtorError={debtorError}
          control={control}
          t={t}
          onPaymentMethodChange={(next) => {
            try {
              localStorage.setItem(LAST_PAYMENT_METHOD_KEY, next);
            } catch {
              // приватный режим / квота — не критично, просто не запомнится
            }
            if (next !== 'DEBT') setValue('paidAmount', '');
            if (next === 'DEBT') {
              setValue('type', 'DEBT', { shouldValidate: true });
              setValue('paymentType', 'CREDIT', { shouldValidate: true });
            } else {
              setValue('type', 'SALE', { shouldValidate: true });
              setValue('paymentType', next, { shouldValidate: true });
            }
          }}
          onOpenDebtorPicker={() => setDebtorPickerOpen(true)}
          onSetDueDate={(date) => setValue('dueDate', date)}
        />

        <div className="space-y-5 lg:order-first">
          <div className="space-y-3">
            {fields.map((field, index) => {
              const item = items[index];
              const product = getProduct(item?.productId);
              const rowErrors = (
                formState.errors.items as unknown as Array<{ productId?: { message?: string } } | undefined> | undefined
              )?.[index];

              return (
                <TransactionItemCard
                  key={field.id}
                  index={index}
                  canRemove={fields.length > 1}
                  item={item}
                  product={product}
                  itemTotal={getItemTotal(item, product)}
                  productError={rowErrors?.productId?.message}
                  isExpanded={
                    expandedAdjustments[field.id] ?? (Number(item?.discount) > 0 || Number(item?.markup) > 0)
                  }
                  control={control}
                  t={t}
                  onOpenPicker={() => setPickerIndex(index)}
                  onRemove={() => remove(index)}
                  onExpandAdjustments={() => setExpandedAdjustments((s) => ({ ...s, [field.id]: true }))}
                />
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

          {(totalDiscount > 0 || totalMarkup > 0 || advance > 0) && (
            <ListGroup>
              {advance > 0 && <ListRow title={t('fields.advance')} value={fmtTJS(advance)} />}
              {totalDiscount > 0 && <ListRow title={t('fields.discount')} value={`− ${fmtTJS(totalDiscount)}`} />}
              {totalMarkup > 0 && <ListRow title={t('fields.markup')} value={`+ ${fmtTJS(totalMarkup)}`} />}
            </ListGroup>
          )}
        </div>
      </form>

      <CreateDebtorModal
        onCreated={(debtor) => {
          // Сразу выбираем только что заведённого должника — продавец продолжает оформление, а не ищет его заново.
          setCreatedDebtor(debtor);
          setValue('debtorId', debtor.id, { shouldValidate: true, shouldDirty: true });
        }}
      />

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
        onSearch={(query) => {
          setDebtorSearch(query);
          debtors.onSearch(query);
        }}
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
          disabled={!canSubmit}
          loading={isPending}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
