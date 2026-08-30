import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { flexRender } from '@tanstack/react-table';
import { Plus, Store, UserRound } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import { toast } from 'sonner';
import { sellersApi } from '~/api/sellers';
import { CreateSellerModal } from '~/components/modals/CreateSellerModal';
import { EditSellerModal } from '~/components/modals/EditSellerModal';
import { ColumnToggle } from '~/components/shared/ColumnToggle';
import { ConfirmDialog } from '~/components/shared/ConfirmDialog';
import { DataTable } from '~/components/shared/DataTable';
import { EntityMobileCard } from '~/components/shared/EntityMobileCard';
import { FilterSheet } from '~/components/shared/FilterSheet';
import { ListPageToolbar } from '~/components/shared/ListPageToolbar';
import { Button } from '~/components/ui/button';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { useDataTable } from '~/hooks/useDataTable';
import { useDebounce } from '~/hooks/useDebounce';
import { getClientUser } from '~/lib/auth-utils';
import { getColumns } from '~/routes/(crm)/sellers/configs/columns';
import { getSellerFilters } from '~/routes/(crm)/sellers/configs/filters';
import { useSellersModals, useSellersStore } from '~/routes/(crm)/sellers/store';

export default function SellersPage() {
  const { t } = useTranslation(['sellers', 'common']);
  const queryClient = useQueryClient();
  const location = useLocation();
  const { can } = useCan();
  const deleteModal = useSellersModals((s) => s.delete);
  const createModal = useSellersModals((s) => s.create);

  const { page, limit, search, filters, setPage, setLimit, setSearch, setFilters, resetFilters } = useSellersStore();

  const debouncedSearch = useDebounce(search);

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
  } = useQuery({
    queryKey: ['sellers', page, limit, debouncedSearch, filters],
    queryFn: () => {
      const dateFrom = filters.find((f) => f.key === 'dateFrom')?.value as string | undefined;
      const dateTo = filters.find((f) => f.key === 'dateTo')?.value as string | undefined;
      const sortBy = (filters.find((f) => f.key === 'sortBy')?.value as string) || 'createdAt';
      const sortOrder = (filters.find((f) => f.key === 'sortOrder')?.value as 'asc' | 'desc') || 'desc';
      const mf = filters.filter((f) => !['dateFrom', 'dateTo', 'sortBy', 'sortOrder'].includes(f.key));
      return sellersApi.getAll(
        page,
        limit,
        { search: debouncedSearch || undefined, dateFrom, dateTo, sortBy, sortOrder },
        mf
      );
    },
    staleTime: 30_000,
  });

  const { mutate: deleteSeller, isPending: isDeletePending } = useMutation({
    mutationFn: (id: string) => sellersApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sellers'] });
      toast.success(t('actions.deleteSuccess'));
      deleteModal.close();
    },
    onError: () => {
      toast.error(t('actions.deleteError'));
    },
  });

  const columns = useMemo(() => getColumns({ t }), [t]);

  const filterConfig = useMemo(() => getSellerFilters(t), [t]);
  const sellers = useMemo(() => response?.data?.data ?? [], [response]);
  const totalPages = response?.data?.meta?.totalPages || 1;

  const { table } = useDataTable({
    columns,
    data: sellers,
    storageKey: 'sellers-table-columns',
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
        {can(Action.SELLERS_CREATE) && (
          <Button
            size="icon"
            aria-label={t('create')}
            className="shrink-0 sm:w-auto sm:gap-1.5 sm:px-3"
            onClick={() => createModal.open()}>
            <Plus data-icon="inline-start" />
            <span className="hidden sm:inline">{t('create')}</span>
          </Button>
        )}
      </ListPageToolbar>
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
        // Как и в колонке действий: свою карточку открываем как /profile —
        // отдельной страницы «продавец сам о себе» нет.
        getRowLink={(row) =>
          getClientUser()?.id === row.original.id
            ? { to: '/profile' }
            : {
                to: `/sellers/${row.original.id}`,
                state: { fromPath: location.pathname, fromName: t('title') },
              }
        }
        mobileFields={{
          'market.name': 'secondary',
        }}
        renderMobileCard={(row) => {
          const actionsCell = row.getVisibleCells().find((cell) => cell.column.id === 'actions');
          const s = row.original;
          return (
            <EntityMobileCard
              image={s.image}
              fallbackIcon={UserRound}
              title={s.name}
              subtitle={s.email}
              actionsCell={actionsCell && flexRender(actionsCell.column.columnDef.cell, actionsCell.getContext())}
              stats={[{ icon: Store, label: t('fields.market'), value: s.market?.name ?? '—' }]}
            />
          );
        }}
      />
      <CreateSellerModal />
      <EditSellerModal />
      <ConfirmDialog
        open={deleteModal.isOpen}
        onOpenChange={(open) => !open && deleteModal.close()}
        onConfirm={() => deleteModal.data != null && deleteSeller(deleteModal.data)}
        isLoading={isDeletePending}
        title={t('actions.confirm')}
        description={t('actions.areYouSure')}
      />
    </div>
  );
}
