import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { flexRender } from '@tanstack/react-table';
import { Package, Plus, Tag } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { categoriesApi } from '~/api/categories';
import { ColumnToggle } from '~/components/shared/ColumnToggle';
import { ConfirmDialog } from '~/components/shared/ConfirmDialog';
import { DataTable } from '~/components/shared/DataTable';
import { EntityMobileCard } from '~/components/shared/EntityMobileCard';
import { FilterSheet } from '~/components/shared/FilterSheet';
import { ActiveFilterPills } from '~/components/shared/ActiveFilterPills';
import { ListPageToolbar } from '~/components/shared/ListPageToolbar';
import { Button } from '~/components/ui/button';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { useDataTable } from '~/hooks/useDataTable';
import { useDebounce } from '~/hooks/useDebounce';
import { useFilterParams } from '~/hooks/useFilterParams';
import { queryKeys } from '~/lib/query-keys';
import { getColumns } from '~/routes/(crm)/categories/configs/columns';
import { getCategoryFilters } from '~/routes/(crm)/categories/configs/filters';
import { useCategoriesModals, useCategoriesStore } from '~/routes/(crm)/categories/store';

export default function CategoriesPage() {
  const { t } = useTranslation(['categories', 'common']);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { can } = useCan();
  const deleteModal = useCategoriesModals((s) => s.delete);

  const { page, limit, search, filters, setPage, setLimit, setSearch, setFilters, resetFilters, removeFilter } =
    useCategoriesStore();

  const debouncedSearch = useDebounce(search);

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    fetchStatus,
  } = useQuery({
    queryKey: queryKeys.list('categories', { page, limit, search: debouncedSearch, filters }),
    queryFn: () => {
      const dateFrom = filters.find((f) => f.key === 'dateFrom')?.value as string | undefined;
      const dateTo = filters.find((f) => f.key === 'dateTo')?.value as string | undefined;
      const sortBy = (filters.find((f) => f.key === 'sortBy')?.value as string) || 'createdAt';
      const sortOrder = (filters.find((f) => f.key === 'sortOrder')?.value as 'asc' | 'desc') || 'desc';
      const mf = filters.filter((f) => !['dateFrom', 'dateTo', 'sortBy', 'sortOrder'].includes(f.key));
      return categoriesApi.getAll(
        page,
        limit,
        { search: debouncedSearch || undefined, dateFrom, dateTo, sortBy, sortOrder },
        mf
      );
    },
    staleTime: 30_000,
  });

  // Запрос ни разу не загрузился и сейчас на паузе из-за офлайна — отличаем
  // от "список реально пуст" (см. app/lib/network-status.ts).
  const isOfflineEmpty = fetchStatus === 'paused' && !response;

  const { mutate: deleteCategory, isPending: isDeletePending } = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.entity('categories') });
      toast.success(t('actions.deleteSuccess'));
      deleteModal.close();
    },
    onError: () => {
      toast.error(t('actions.deleteError'));
    },
  });

  const columns = useMemo(() => getColumns({ t }), [t]);

  const filterConfig = useMemo(() => getCategoryFilters(t), [t]);

  // Фильтры из ссылки (с дашборда, из карточек) и из адресной строки при перезагрузке.
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
  const categories = useMemo(() => response?.data?.data ?? [], [response]);
  const totalPages = response?.data?.meta?.totalPages || 1;

  const { table } = useDataTable({
    columns,
    data: categories,
    storageKey: 'categories-table-columns',
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
        {can(Action.CATEGORIES_MANAGE) && (
          <Button
            aria-label={t('create')}
            className="min-w-0 flex-1 gap-1.5 px-4 sm:flex-initial"
            onClick={() => navigate('/categories/create')}>
            <Plus data-icon="inline-start" />
            <span>{t('create')}</span>
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
        isOfflineEmpty={isOfflineEmpty}
        page={page}
        limit={limit}
        totalPages={totalPages}
        onPageChange={setPage}
        onLimitChange={setLimit}
        renderMobileCard={(row) => {
          const actionsCell = row.getVisibleCells().find((cell) => cell.column.id === 'actions');
          const c = row.original;
          return (
            <EntityMobileCard
              image={c.image}
              fallbackIcon={Tag}
              title={c.name}
              subtitle={c.description}
              actionsCell={actionsCell && flexRender(actionsCell.column.columnDef.cell, actionsCell.getContext())}
              stats={[{ icon: Package, label: t('fields.productsCount'), value: c._count.products }]}
            />
          );
        }}
      />
      <ConfirmDialog
        open={deleteModal.isOpen}
        onOpenChange={(open) => !open && deleteModal.close()}
        onConfirm={() => deleteModal.data != null && deleteCategory(deleteModal.data)}
        isLoading={isDeletePending}
        title={t('actions.confirm')}
        description={t('actions.areYouSure')}
      />
    </div>
  );
}
