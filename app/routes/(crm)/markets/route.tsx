import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { flexRender } from '@tanstack/react-table';
import { Package, Plus, Receipt, Store, Users } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import { toast } from 'sonner';
import { marketsApi } from '~/api/markets';
import { CreateMarketModal } from '~/components/modals/CreateMarketModal';
import { EditMarketModal } from '~/components/modals/EditMarketModal';
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
import { getColumns } from '~/routes/(crm)/markets/configs/columns';
import { getMarketFilters } from '~/routes/(crm)/markets/configs/filters';
import { useMarketsModals, useMarketsStore } from '~/routes/(crm)/markets/store';

export default function MarketsPage() {
  const { t } = useTranslation(['markets', 'common']);
  const queryClient = useQueryClient();
  const location = useLocation();
  const { can } = useCan();
  const deleteModal = useMarketsModals((s) => s.delete);
  const createModal = useMarketsModals((s) => s.create);

  const { page, limit, search, filters, setPage, setLimit, setSearch, setFilters, resetFilters } = useMarketsStore();

  const debouncedSearch = useDebounce(search);

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
  } = useQuery({
    queryKey: ['markets', page, limit, debouncedSearch, filters],
    queryFn: () => {
      const dateFrom = filters.find((f) => f.key === 'dateFrom')?.value as string | undefined;
      const dateTo = filters.find((f) => f.key === 'dateTo')?.value as string | undefined;
      const sortBy = (filters.find((f) => f.key === 'sortBy')?.value as string) || 'createdAt';
      const sortOrder = (filters.find((f) => f.key === 'sortOrder')?.value as 'asc' | 'desc') || 'desc';
      const mf = filters.filter((f) => !['dateFrom', 'dateTo', 'sortBy', 'sortOrder'].includes(f.key));
      return marketsApi.getAll(
        page,
        limit,
        { search: debouncedSearch || undefined, dateFrom, dateTo, sortBy, sortOrder },
        mf
      );
    },
    staleTime: 30_000,
  });

  const { mutate: deleteMarket, isPending: isDeletePending } = useMutation({
    mutationFn: (id: string) => marketsApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['markets'] });
      toast.success(t('actions.deleteSuccess'));
      deleteModal.close();
    },
    onError: () => {
      toast.error(t('actions.deleteError'));
    },
  });

  const columns = useMemo(() => getColumns({ t }), [t]);

  const filterConfig = useMemo(() => getMarketFilters(t), [t]);
  const markets = useMemo(() => response?.data?.data ?? [], [response]);
  const totalPages = response?.data?.meta?.totalPages || 1;

  const { table } = useDataTable({
    columns,
    data: markets,
    storageKey: 'markets-table-columns',
    initialVisibility: { 'count.transactions': false, createdAt: false },
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
        {can(Action.MARKETS_CREATE) && (
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
        // Тот же выбор адреса, что и у кнопки «Просмотр» в колонке действий:
        // свой рынок открываем через /my-market (свои права и виджеты), чужой —
        // через /markets/:id. Расходиться этим двум путям нельзя, иначе тап по
        // карточке и тап по ⋮ → «Просмотр» ведут в разные места.
        getRowLink={(row) =>
          getClientUser()?.marketId === row.original.id
            ? { to: '/my-market' }
            : {
                to: `/markets/${row.original.id}`,
                state: { fromPath: location.pathname, fromName: t('title') },
              }
        }
        mobileFields={{
          'count.products': 'primary',
          'count.debtors': 'primary',
          'count.transactions': 'primary',
          'owner.name': 'secondary',
        }}
        renderMobileCard={(row) => {
          const actionsCell = row.getVisibleCells().find((cell) => cell.column.id === 'actions');
          const m = row.original;
          return (
            <EntityMobileCard
              image={m.image}
              fallbackIcon={Store}
              title={m.name}
              subtitle={m.address}
              actionsCell={actionsCell && flexRender(actionsCell.column.columnDef.cell, actionsCell.getContext())}
              stats={[
                { icon: Package, label: t('fields.products', 'Товары'), value: m.count.products },
                { icon: Users, label: t('fields.debtors', 'Должники'), value: m.count.debtors },
                { icon: Receipt, label: t('fields.transactions', 'Транзакции'), value: m.count.transactions },
              ]}
              badges={m.owner?.name ? [{ label: m.owner.name }] : []}
            />
          );
        }}
      />
      <CreateMarketModal />
      <EditMarketModal />
      <ConfirmDialog
        open={deleteModal.isOpen}
        onOpenChange={(open) => !open && deleteModal.close()}
        onConfirm={() => deleteModal.data != null && deleteMarket(deleteModal.data)}
        isLoading={isDeletePending}
        title={t('actions.confirm')}
        description={t('actions.areYouSure')}
      />
    </div>
  );
}
