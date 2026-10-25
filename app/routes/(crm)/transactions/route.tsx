import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Plus } from 'lucide-react';
import type { Row } from '@tanstack/react-table';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';
import { toast } from 'sonner';
import { categoriesApi } from '~/api/categories';
import { debtorsApi } from '~/api/debtors';
import { productsApi } from '~/api/products';
import { sellersApi } from '~/api/sellers';
import { transactionsApi } from '~/api/transactions';
import { CreatePaymentModal } from '~/components/modals/CreatePaymentModal';
import { ActiveFilterPills } from '~/components/shared/ActiveFilterPills';
import { ColumnToggle } from '~/components/shared/ColumnToggle';
import { ConfirmDialog } from '~/components/shared/ConfirmDialog';
import { DataTable, type MobileRowGroup } from '~/components/shared/DataTable';
import { renderActionsCell } from '~/components/shared/ListPageLayout';
import { FilterSheet } from '~/components/shared/FilterSheet';
import { ListPageToolbar } from '~/components/shared/ListPageToolbar';
import { TransactionDayHeader } from '~/components/transactions/TransactionDayHeader';
import { TransactionMobileCard } from '~/components/transactions/TransactionMobileCard';
import {
  TransactionQuickFilters,
  filtersNotShownByChips,
  getActivePeriod,
} from '~/components/transactions/TransactionQuickFilters';
import { TransactionsSummary } from '~/components/transactions/TransactionsSummary';
import { Button } from '~/components/ui/button';
import { Action } from '~/config/actions';
import { TRANSACTION_FILTER_RULES } from '~/config/filterRules';
import { useCan } from '~/hooks/useCan';
import { useDataTable } from '~/hooks/useDataTable';
import { useDebounce } from '~/hooks/useDebounce';
import { useFilterParams } from '~/hooks/useFilterParams';
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
  const queryClient = useQueryClient();
  const { can } = useCan();
  const deleteModal = useTransactionsModals((s) => s.delete);
  const payModal = useTransactionsModals((s) => s.pay);

  const {
    page,
    limit,
    search,
    filters,
    setPage,
    setLimit,
    setSearch,
    setFilter,
    setFilters,
    resetFilters,
    removeFilter,
  } = useTransactionsStore();

  const location = useLocation();
  const debouncedSearch = useDebounce(search);

  const hasProcessedState = useRef(false);

  useEffect(() => {
    if (hasProcessedState.current) return;
    const state = location.state as Record<string, unknown> | null;
    if (state?.fromDebtorId) {
      setFilter('debtorId', state.fromDebtorId);
    }
    if (state?.fromSellerId) {
      setFilter('createdById', state.fromSellerId);
    }
    hasProcessedState.current = true;
    window.history.replaceState({}, document.title);
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

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    fetchStatus,
    dataUpdatedAt,
  } = useQuery({
    queryKey: queryKeys.list('transactions', { page, limit, search: debouncedSearch, filters }),
    queryFn: () => {
      const dateFrom = filters.find((f) => f.key === 'dateFrom')?.value as string | undefined;
      const dateTo = filters.find((f) => f.key === 'dateTo')?.value as string | undefined;
      const sortBy = (filters.find((f) => f.key === 'sortBy')?.value as string) || 'createdAt';
      const sortOrder = (filters.find((f) => f.key === 'sortOrder')?.value as 'asc' | 'desc') || 'desc';
      const mf = filters.filter((f) => !['dateFrom', 'dateTo', 'sortBy', 'sortOrder'].includes(f.key));
      return transactionsApi.getAll(
        page,
        limit,
        { search: debouncedSearch || undefined, dateFrom, dateTo, sortBy, sortOrder },
        mf
      );
    },
    staleTime: 30_000,
  });

  const { mutate: deleteTransaction, isPending: isDeletePending } = useMutation({
    mutationFn: (id: string) => transactionsApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.entity('transactions') });
      toast.success(t('actions.deleteSuccess'));
      deleteModal.close();
    },
    onError: () => {
      toast.error(t('actions.deleteError'));
    },
  });

  const columns = useMemo(() => getColumns({ t }), [t]);

  const serverTransactions = useMemo(() => response?.data?.data ?? [], [response]);
  // Продажи и долги из очереди стоят сверху сразу, а оплаты/возвраты из очереди уже учтены в остатках —
  // см. offline-overlay.ts.
  const transactions = useTransactionRows(serverTransactions, {
    page,
    search: debouncedSearch,
    filters,
    dataUpdatedAt,
  });
  // Запрос ни разу не загрузился и сейчас на паузе из-за офлайна — отличаем от "список реально пуст"
  // (см. app/lib/network-status.ts). Если в очереди уже что-то есть, показываем это, а не заглушку.
  const isOfflineEmpty = fetchStatus === 'paused' && !response && transactions.length === 0;
  const totalPages = response?.data?.meta?.totalPages || 1;

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
  const groupedByDay = (filters.find((f) => f.key === 'sortBy')?.value ?? 'createdAt') === 'createdAt';

  const getMobileGroups = useCallback(
    (rows: Row<TransactionRow>[]): MobileRowGroup<TransactionRow>[] =>
      groupedByDay
        ? groupRowsByDay(rows, page, totalPages).map((g) => ({
            key: `${g.key}-${g.rows[0]?.id}`,
            header: <TransactionDayHeader dayKey={g.key} net={g.net} />,
            rows: g.rows,
          }))
        : [{ key: 'all', rows }],
    [groupedByDay, page, totalPages]
  );

  // Сводка за период — только когда в списке нет ничего, кроме периода: цифры считает дашборд по
  // всему периоду, а не по фильтру, и рядом с «Продажи · Наличные» они бы не совпадали с рядами.
  const activePeriod = getActivePeriod(filters);
  const hasOtherFilters =
    debouncedSearch.length > 0 || filters.some((f) => !['dateFrom', 'dateTo', 'sortBy', 'sortOrder'].includes(f.key));
  const summaryPeriod =
    activePeriod && activePeriod !== 'all' && !hasOtherFilters && can(Action.DASHBOARDS_VIEW) ? activePeriod : null;

  useFilterParams({
    page,
    limit,
    search,
    filters,
    setPage,
    setLimit,
    setSearch,
    setFilters,
    filterConfigs: filterConfig,
  });

  return (
    <div className="flex-1 space-y-4">
      <ListPageToolbar
        title={t('title')}
        searchPlaceholder={t('filters.search', { ns: 'common' })}
        searchValue={search}
        onSearchChange={setSearch}>
        <ColumnToggle table={table} />
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <FilterSheet
            config={filterConfig}
            filters={filters}
            onApply={setFilters}
            onReset={resetFilters}
            rules={TRANSACTION_FILTER_RULES}
          />
          {can(Action.TRANSACTIONS_CREATE) && (
            <Button
              aria-label={t('create')}
              className="min-w-0 flex-1 gap-1.5 px-4 sm:flex-initial"
              render={<Link to="/transactions/create" />}>
              <Plus data-icon="inline-start" />
              <span className="truncate">{t('create')}</span>
            </Button>
          )}
        </div>
      </ListPageToolbar>
      <TransactionQuickFilters filters={filters} onChange={setFilters} />
      {summaryPeriod && <TransactionsSummary period={summaryPeriod} />}
      <ActiveFilterPills filters={filtersNotShownByChips(filters)} config={filterConfig} onRemove={removeFilter} />
      <DataTable
        table={table}
        pinLastColumn
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        isOfflineEmpty={isOfflineEmpty}
        page={page}
        limit={limit}
        totalPages={totalPages}
        onPageChange={setPage}
        onLimitChange={setLimit}
        getMobileGroups={getMobileGroups}
        getRowLink={(row) =>
          // Страницы у продажи из очереди ещё нет — открывать нечего.
          row.original.pending
            ? undefined
            : { to: `/transactions/${row.original.id}`, state: { fromPath: location.pathname, fromName: t('title') } }
        }
        // Страницы правки у транзакции нет (её не редактируют, только оплачивают
        // и удаляют), поэтому «Изменить» здесь не показываем. Продажа из очереди
        // ещё не создана на сервере — у неё свои кнопки (см. renderMobileCard).
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
        renderMobileCard={(row) => (
          <TransactionMobileCard
            row={row}
            t={t}
            actionsCell={row.original.pending ? renderActionsCell(row) : undefined}
            showDate={!groupedByDay}
          />
        )}
      />
      <CreatePaymentModal />
      <ConfirmDialog
        open={deleteModal.isOpen}
        onOpenChange={(open) => !open && deleteModal.close()}
        onConfirm={() => deleteModal.data != null && deleteTransaction(deleteModal.data)}
        isLoading={isDeletePending}
        title={t('actions.confirm', { ns: 'common' })}
        description={t('actions.areYouSure', { ns: 'common' })}
      />
    </div>
  );
}
