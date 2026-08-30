import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { flexRender } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';
import { toast } from 'sonner';
import { categoriesApi } from '~/api/categories';
import { debtorsApi } from '~/api/debtors';
import { productsApi } from '~/api/products';
import { transactionsApi } from '~/api/transactions';
import { CreatePaymentModal } from '~/components/modals/CreatePaymentModal';
import { ActiveFilterPills } from '~/components/shared/ActiveFilterPills';
import { ColumnToggle } from '~/components/shared/ColumnToggle';
import { ConfirmDialog } from '~/components/shared/ConfirmDialog';
import { DataTable } from '~/components/shared/DataTable';
import { FilterSheet } from '~/components/shared/FilterSheet';
import { ListPageToolbar } from '~/components/shared/ListPageToolbar';
import { TransactionMobileCard } from '~/components/transactions/TransactionMobileCard';
import { Button } from '~/components/ui/button';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { useDataTable } from '~/hooks/useDataTable';
import { useDebounce } from '~/hooks/useDebounce';
import { useFilterParams } from '~/hooks/useFilterParams';
import { mapToOptions } from '~/lib/mapToOptions';
import { getColumns } from '~/routes/(crm)/transactions/configs/columns';
import { getTransactionFilters } from '~/routes/(crm)/transactions/configs/filters';
import { useTransactionsModals, useTransactionsStore } from '~/routes/(crm)/transactions/store';

export default function TransactionsPage() {
  const { t } = useTranslation(['transactions', 'common']);
  const queryClient = useQueryClient();
  const { can } = useCan();
  const deleteModal = useTransactionsModals((s) => s.delete);

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
    queryKey: ['debtors', 'list'],
    queryFn: () => debtorsApi.getAll(1, 100, {}, []),
    staleTime: 60_000,
  });

  const debtorOptions = useMemo(() => mapToOptions(debtorsResponse?.data?.data ?? [], 'id', 'name'), [debtorsResponse]);

  const { data: categoriesResponse } = useQuery({
    queryKey: ['categories', 'list'],
    queryFn: () => categoriesApi.getAll(1, 100, {}, []),
    staleTime: 60_000,
  });

  const { data: productsResponse } = useQuery({
    queryKey: ['products', 'list'],
    queryFn: () => productsApi.getAll(1, 100, {}, []),
    staleTime: 60_000,
  });

  const categoryOptions = useMemo(
    () => mapToOptions(categoriesResponse?.data?.data ?? [], 'id', 'name'),
    [categoriesResponse]
  );

  const productOptions = useMemo(
    () => mapToOptions(productsResponse?.data?.data ?? [], 'id', 'name'),
    [productsResponse]
  );

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
  } = useQuery({
    queryKey: ['transactions', page, limit, debouncedSearch, filters],
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
      void queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success(t('actions.deleteSuccess'));
      deleteModal.close();
    },
    onError: () => {
      toast.error(t('actions.deleteError'));
    },
  });

  const columns = useMemo(() => getColumns({ t }), [t]);

  const transactions = useMemo(() => response?.data?.data ?? [], [response]);
  const totalPages = response?.data?.meta?.totalPages || 1;

  const { table } = useDataTable({
    columns,
    data: transactions,
    storageKey: 'transactions-table-columns',
    initialVisibility: { paymentType: false, remainingAmount: false, createdAt: false },
  });

  const filterConfig = useMemo(
    () => getTransactionFilters(t, debtorOptions, categoryOptions, productOptions),
    [t, debtorOptions, categoryOptions, productOptions]
  );

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
        <FilterSheet config={filterConfig} filters={filters} onApply={setFilters} onReset={resetFilters} />
        <ColumnToggle table={table} />
        {can(Action.TRANSACTIONS_CREATE) && (
          <Button
            size="icon"
            aria-label={t('create')}
            className="shrink-0 sm:w-auto sm:gap-1.5 sm:px-3"
            render={<Link to="/transactions/create" />}>
            <Plus data-icon="inline-start" />
            <span className="hidden sm:inline">{t('create')}</span>
          </Button>
        )}
      </ListPageToolbar>
      <ActiveFilterPills filters={filters} config={filterConfig} onRemove={removeFilter} />
      <DataTable
        table={table}
        pinLastColumn
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        page={page}
        limit={limit}
        totalPages={totalPages}
        onPageChange={setPage}
        onLimitChange={setLimit}
        getRowLink={(row) => ({
          to: `/transactions/${row.original.id}`,
          state: { fromPath: location.pathname, fromName: t('title') },
        })}
        mobileFields={{
          totalAmount: 'primary',
          status: 'primary',
          type: 'secondary',
          paymentType: 'secondary',
          debtor: 'secondary',
          customerName: 'secondary',
        }}
        renderMobileCard={(row) => {
          const actionsCell = row.getVisibleCells().find((cell) => cell.column.id === 'actions');
          return (
            <TransactionMobileCard
              row={row}
              t={t}
              actionsCell={actionsCell && flexRender(actionsCell.column.columnDef.cell, actionsCell.getContext())}
            />
          );
        }}
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
