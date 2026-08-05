import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
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
import { CustomInput } from '~/components/shared/CustomInput';
import { DataTable } from '~/components/shared/DataTable';
import { FilterSheet } from '~/components/shared/FilterSheet';
import { Button } from '~/components/ui/button';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { useDataTable } from '~/hooks/useDataTable';
import { useDebounce } from '~/hooks/useDebounce';
import { useFilterParams } from '~/hooks/useFilterParams';
import { mapToOptions } from '~/lib/mapToOptions';
import { getColumns } from './configs/columns';
import { getTransactionFilters } from './configs/filters';
import { useTransactionsModals, useTransactionsStore } from './store';

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
      toast.success(t('actions.deleteSuccess', { ns: 'common', defaultValue: 'Удалено' }));
      deleteModal.close();
    },
    onError: () => {
      toast.error(t('actions.deleteError', { ns: 'common', defaultValue: 'Ошибка при удалении' }));
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
      </div>
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CustomInput
            placeholder={`${t('filters.search', { ns: 'common' })}...`}
            className="w-full sm:max-w-96"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startIcon={<Search className="text-muted-foreground h-4 w-4" />}
          />
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <FilterSheet config={filterConfig} filters={filters} onApply={setFilters} onReset={resetFilters} />
            <ColumnToggle table={table} />
            {can(Action.TRANSACTIONS_CREATE) && (
              <Button className="shrink-0 gap-2" render={<Link to="/transactions/create" />}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">{t('create')}</span>
              </Button>
            )}
          </div>
        </div>
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
          onlimitChange={setLimit}
        />
      </div>
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
