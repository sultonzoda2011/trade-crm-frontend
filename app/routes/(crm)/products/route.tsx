import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';
import { toast } from 'sonner';
import { categoriesApi } from '~/api/categories';
import { productsApi } from '~/api/products';
import { ActiveFilterPills } from '~/components/shared/ActiveFilterPills';
import { ColumnToggle } from '~/components/shared/ColumnToggle';
import { ConfirmDialog } from '~/components/shared/ConfirmDialog';
import { DataTable } from '~/components/shared/DataTable';
import { FilterSheet } from '~/components/shared/FilterSheet';
import { ListPageToolbar } from '~/components/shared/ListPageToolbar';
import { Button } from '~/components/ui/button';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { useDataTable } from '~/hooks/useDataTable';
import { useDebounce } from '~/hooks/useDebounce';
import { useFilterParams } from '~/hooks/useFilterParams';
import { mapToOptions } from '~/lib/mapToOptions';
import { getColumns } from '~/routes/(crm)/products/configs/columns';
import { getProductFilters } from '~/routes/(crm)/products/configs/filters';
import { useProductsModals, useProductsStore } from '~/routes/(crm)/products/store';

export default function ProductsPage() {
  const { t } = useTranslation(['products', 'common']);
  const queryClient = useQueryClient();
  const { can } = useCan();
  const deleteModal = useProductsModals((s) => s.delete);

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
  } = useProductsStore();

  const location = useLocation();
  const debouncedSearch = useDebounce(search);

  const hasProcessedState = useRef(false);

  useEffect(() => {
    if (hasProcessedState.current) return;
    const state = location.state as Record<string, unknown> | null;
    if (state?.fromCategoryId) {
      setFilter('categoryId', state.fromCategoryId);
    }
    hasProcessedState.current = true;
    window.history.replaceState({}, document.title);
  }, []);

  const { data: categoriesResponse } = useQuery({
    queryKey: ['categories', 'list'],
    queryFn: () => categoriesApi.getAll(1, 100, {}, []),
    staleTime: 60_000,
  });

  const categoryOptions = useMemo(
    () => mapToOptions(categoriesResponse?.data?.data ?? [], 'id', 'name'),
    [categoriesResponse]
  );

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
  } = useQuery({
    queryKey: ['products', page, limit, debouncedSearch, filters],
    queryFn: () => {
      const dateFrom = filters.find((f) => f.key === 'dateFrom')?.value as string | undefined;
      const dateTo = filters.find((f) => f.key === 'dateTo')?.value as string | undefined;
      const sortBy = (filters.find((f) => f.key === 'sortBy')?.value as string) || 'createdAt';
      const sortOrder = (filters.find((f) => f.key === 'sortOrder')?.value as 'asc' | 'desc') || 'desc';
      const mf = filters.filter((f) => !['dateFrom', 'dateTo', 'sortBy', 'sortOrder'].includes(f.key));
      return productsApi.getAll(
        page,
        limit,
        { search: debouncedSearch || undefined, dateFrom, dateTo, sortBy, sortOrder },
        mf
      );
    },
    staleTime: 30_000,
  });

  const { mutate: deleteProduct, isPending: isDeletePending } = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(t('actions.deleteSuccess'));
      deleteModal.close();
    },
    onError: () => {
      toast.error(t('actions.deleteError'));
    },
  });

  const columns = useMemo(() => getColumns({ t }), [t]);

  const filterConfig = useMemo(() => getProductFilters(t, categoryOptions), [t, categoryOptions]);

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

  const products = useMemo(() => response?.data?.data ?? [], [response]);
  const totalPages = response?.data?.meta?.totalPages || 1;

  const { table } = useDataTable({
    columns,
    data: products,
    storageKey: 'products-table-columns',
    // Аналитика показывает состояние и запас в днях; сырые продажи за период
    // остаются доступны через ColumnToggle, чтобы таблица не разрослась.
    initialVisibility: {
      'category.name': false,
      '_count.transactionItems': false,
      'market.name': false,
      createdAt: false,
      'metrics.netUnitsSold': false,
      'metrics.revenue': false,
      'metrics.daysOfStockRemaining': false,
    },
  });

  return (
    <div className="flex-1 space-y-4">
      <ListPageToolbar
        title={t('title')}
        searchPlaceholder={t('filters.search')}
        searchValue={search}
        onSearchChange={setSearch}>
        <FilterSheet config={filterConfig} filters={filters} onApply={setFilters} onReset={resetFilters} />
        <ColumnToggle table={table} />
        {can(Action.PRODUCTS_CREATE) && (
          <Button className="shrink-0 gap-2" render={<Link to="/products/create" />}>
            <Plus className="h-4 w-4" data-icon="inline-start" />
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
      />
      <ConfirmDialog
        open={deleteModal.isOpen}
        onOpenChange={(open) => !open && deleteModal.close()}
        onConfirm={() => deleteModal.data != null && deleteProduct(deleteModal.data)}
        isLoading={isDeletePending}
        title={t('actions.confirm')}
        description={t('actions.areYouSure')}
      />
    </div>
  );
}
