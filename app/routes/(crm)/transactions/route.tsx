import { useQuery } from '@tanstack/react-query';
import type { Row } from '@tanstack/react-table';
import { CreditCard, Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';
import { categoriesApi } from '~/api/categories';
import { debtorsApi } from '~/api/debtors';
import { productsApi } from '~/api/products';
import { sellersApi } from '~/api/sellers';
import { transactionsApi } from '~/api/transactions';
import { CreatePaymentModal } from '~/components/modals/CreatePaymentModal';
import type { MobileRowGroup } from '~/components/shared/DataTable';
import { ListPageLayout } from '~/components/shared/ListPageLayout';
import { TransactionDayHeader } from '~/components/transactions/TransactionDayHeader';
import { TransactionMobileCard } from '~/components/transactions/TransactionMobileCard';
import { TransactionQuickFilters, filtersNotShownByChips } from '~/components/transactions/TransactionQuickFilters';
import { TransactionsSummary } from '~/components/transactions/TransactionsSummary';
import { Button } from '~/components/ui/button';
import { Action } from '~/config/actions';
import { TRANSACTION_FILTER_RULES } from '~/config/filterRules';
import { useCan } from '~/hooks/useCan';
import { useDataTable } from '~/hooks/useDataTable';
import { useEntityList } from '~/hooks/useEntityList';
import { useTransactionRows } from '~/hooks/useOfflineOverlay';
import { mapToOptions } from '~/lib/mapToOptions';
import { queryKeys } from '~/lib/query-keys';
import { buildRowSwipeActions } from '~/lib/swipe-actions';
import { groupRowsByDay } from '~/lib/transaction-view';
import { getColumns } from '~/routes/(crm)/transactions/configs/columns';
import { getTransactionFilters } from '~/routes/(crm)/transactions/configs/filters';
import { useTransactionsModals, useTransactionsStore } from '~/routes/(crm)/transactions/store';
import type { TransactionRow } from '~/types/pending';

export default function TransactionsPage() {
  const { t } = useTranslation(['transactions', 'common']);
  const location = useLocation();
  const { can } = useCan();
  const deleteModal = useTransactionsModals((s) => s.delete);
  const payModal = useTransactionsModals((s) => s.pay);

  const list = useEntityList({
    entity: 'transactions',
    store: useTransactionsStore,
    api: transactionsApi,
    t,
    deleteModal,
  });

  const hasProcessedState = useRef(false);
  useEffect(() => {
    if (hasProcessedState.current) return;
    const state = location.state as Record<string, unknown> | null;
    if (state?.fromDebtorId) {
      list.setFilter('debtorId', state.fromDebtorId);
    }
    if (state?.fromSellerId) {
      list.setFilter('createdById', state.fromSellerId);
    }
    hasProcessedState.current = true;
    window.history.replaceState({}, document.title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: debtorsResponse } = useQuery({
    queryKey: queryKeys.options('debtors', { scope: 'filters', limit: 100 }),
    queryFn: () => debtorsApi.getAll(1, 100, {}, []),
  });

  const debtorOptions = useMemo(() => mapToOptions(debtorsResponse?.data?.data ?? [], 'id', 'name'), [debtorsResponse]);

  const { data: categoriesResponse } = useQuery({
    queryKey: queryKeys.options('categories', { scope: 'filters', limit: 100 }),
    queryFn: () => categoriesApi.getAll(1, 100, {}, []),
  });

  const { data: productsResponse } = useQuery({
    queryKey: queryKeys.options('products', { scope: 'filters', limit: 100 }),
    queryFn: () => productsApi.getAll(1, 100, {}, []),
  });

  const categoryOptions = useMemo(
    () => mapToOptions(categoriesResponse?.data?.data ?? [], 'id', 'name'),
    [categoriesResponse]
  );

  const productOptions = useMemo(
    () => mapToOptions(productsResponse?.data?.data ?? [], 'id', 'name'),
    [productsResponse]
  );

  // `/sellers` разрешён только Admin/Owner (Action.SELLERS_VIEW) — Seller на
  // этой же странице получил бы здесь локальный отказ axios-перехватчика и
  // тост с ошибкой при каждом заходе, поэтому запрос включён только когда
  // роль это позволяет; тогда и фильтр "Создал" в конфиге не появляется вовсе.
  const { data: sellersResponse } = useQuery({
    queryKey: queryKeys.options('sellers', { scope: 'filters', limit: 100 }),
    queryFn: () => sellersApi.getAll(1, 100, {}, []),
    enabled: can(Action.SELLERS_VIEW),
  });

  const sellerOptions = useMemo(() => mapToOptions(sellersResponse?.data?.data ?? [], 'id', 'name'), [sellersResponse]);

  const columns = useMemo(() => getColumns({ t }), [t]);

  // Продажи и долги из очереди стоят сверху сразу, а оплаты/возвраты из очереди уже учтены в остатках —
  // см. offline-overlay.ts.
  const transactions = useTransactionRows(list.serverRows, {
    page: list.page,
    search: list.debouncedSearch,
    filters: list.filters,
    dataUpdatedAt: list.dataUpdatedAt,
  });

  const { table } = useDataTable({
    columns,
    data: transactions,
    storageKey: 'transactions-table-columns',
    initialVisibility: { paymentType: false, remainingAmount: false, createdAt: false },
  });

  const filterConfig = useMemo(
    () => getTransactionFilters(t, debtorOptions, categoryOptions, productOptions, sellerOptions),
    [t, debtorOptions, categoryOptions, productOptions, sellerOptions]
  );

  // Дни имеют смысл, пока список идёт по дате: при сортировке по сумме они перемешаны,
  // и заголовок «Сегодня» пришлось бы повторять десять раз подряд.
  const groupedByDay = (list.filters.find((f) => f.key === 'sortBy')?.value ?? 'createdAt') === 'createdAt';

  const getMobileGroups = useCallback(
    (rows: Row<TransactionRow>[]): MobileRowGroup<TransactionRow>[] =>
      groupedByDay
        ? groupRowsByDay(rows, list.page, list.totalPages).map((g) => ({
            key: `${g.key}-${g.rows[0]?.id}`,
            header: <TransactionDayHeader dayKey={g.key} net={g.net} />,
            rows: g.rows,
          }))
        : [{ key: 'all', rows }],
    [groupedByDay, list.page, list.totalPages]
  );

  return (
    <ListPageLayout
      title={t('title')}
      searchPlaceholder={t('filters.search', { ns: 'common' })}
      list={list}
      table={table}
      filterConfig={filterConfig}
      filterRules={TRANSACTION_FILTER_RULES}
      quickFilters={
        <>
          <TransactionQuickFilters filters={list.filters} onChange={list.setFilters} />
          <TransactionsSummary filters={list.filters} search={list.debouncedSearch} />
        </>
      }
      pillFilters={filtersNotShownByChips(list.filters)}
      showFilterPills
      syncUrl
      // Если в очереди уже что-то есть, показываем это, а не заглушку офлайна.
      isOfflineEmptyOverride={list.isOfflineEmpty && transactions.length === 0}
      getMobileGroups={getMobileGroups}
      getRowLink={(row) =>
        // Страницы у продажи из очереди ещё нет — открывать нечего.
        row.original.pending
          ? undefined
          : { to: `/transactions/${row.original.id}`, state: { fromPath: location.pathname, fromName: t('title') } }
      }
      // Страницы правки у транзакции нет (её не редактируют, только оплачивают
      // и удаляют), поэтому «Изменить» здесь не показываем. Продажа из очереди
      // ещё не создана на сервере — у неё свои кнопки (см. renderCard).
      getSwipeActions={(row) => {
        const tx = row.original;
        if (tx.pending) return undefined;
        return buildRowSwipeActions({
          t,
          leading:
            can(Action.TRANSACTIONS_EDIT) && tx.remainingAmount > 0
              ? [
                  {
                    key: 'pay',
                    label: t('pay'),
                    icon: CreditCard,
                    tone: 'success',
                    onSelect: () => payModal.open(tx),
                  },
                ]
              : [],
          onDelete: can(Action.TRANSACTIONS_DELETE) ? () => deleteModal.open(tx.id) : undefined,
        });
      }}
      createAction={
        can(Action.TRANSACTIONS_CREATE) ? (
          <Button
            aria-label={t('create')}
            className="min-w-0 flex-1 gap-1.5 px-4 sm:flex-initial"
            render={<Link to="/transactions/create" />}>
            <Plus data-icon="inline-start" />
            <span className="truncate">{t('create')}</span>
          </Button>
        ) : null
      }
      renderCard={(row, actions) => (
        <TransactionMobileCard
          row={row}
          t={t}
          actionsCell={row.original.pending ? actions : undefined}
          showDate={!groupedByDay}
        />
      )}>
      <CreatePaymentModal />
    </ListPageLayout>
  );
}
