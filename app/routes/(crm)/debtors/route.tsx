import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { flexRender } from '@tanstack/react-table';
import { Plus, UserRound } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import { toast } from 'sonner';
import { ColumnToggle } from '~/components/shared/ColumnToggle';
import { ConfirmDialog } from '~/components/shared/ConfirmDialog';
import { DataTable } from '~/components/shared/DataTable';
import { EntityMobileCard } from '~/components/shared/EntityMobileCard';
import { FilterSheet } from '~/components/shared/FilterSheet';
import { ListPageToolbar } from '~/components/shared/ListPageToolbar';
import { Button } from '~/components/ui/button';
import { Action } from '~/config/actions';
import { DEBTOR_RISK_BADGE } from '~/config/analyticsBadges';
import { useCan } from '~/hooks/useCan';
import { useDataTable } from '~/hooks/useDataTable';
import { useDebounce } from '~/hooks/useDebounce';
import { fmtTJS } from '~/lib/format';
import { getColumns } from '~/routes/(crm)/debtors/configs/columns';
import { getDebtorFilters } from '~/routes/(crm)/debtors/configs/filters';
import { useDebtorsModals, useDebtorsStore } from '~/routes/(crm)/debtors/store';
import { debtorsApi } from '~/api/debtors';
import { CreateDebtorModal } from '~/components/modals/CreateDebtorModal';
import { EditDebtorModal } from '~/components/modals/EditDebtorModal';

export default function DebtorsPage() {
  const { t } = useTranslation(['debtors', 'common']);
  const queryClient = useQueryClient();
  const location = useLocation();
  const { can } = useCan();
  const deleteModal = useDebtorsModals((s) => s.delete);
  const createModal = useDebtorsModals((s) => s.create);

  const { page, limit, search, filters, setPage, setLimit, setSearch, setFilters, resetFilters } = useDebtorsStore();

  const debouncedSearch = useDebounce(search);

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
  } = useQuery({
    queryKey: ['debtors', page, limit, debouncedSearch, filters],
    queryFn: () => {
      const dateFrom = filters.find((f) => f.key === 'dateFrom')?.value as string | undefined;
      const dateTo = filters.find((f) => f.key === 'dateTo')?.value as string | undefined;
      const sortBy = (filters.find((f) => f.key === 'sortBy')?.value as string) || 'createdAt';
      const sortOrder = (filters.find((f) => f.key === 'sortOrder')?.value as 'asc' | 'desc') || 'desc';
      const mf = filters.filter((f) => !['dateFrom', 'dateTo', 'sortBy', 'sortOrder'].includes(f.key));
      return debtorsApi.getAll(
        page,
        limit,
        { search: debouncedSearch || undefined, dateFrom, dateTo, sortBy, sortOrder },
        mf
      );
    },
    staleTime: 30_000,
  });

  const { mutate: deleteDebtor, isPending: isDeletePending } = useMutation({
    mutationFn: (id: string) => debtorsApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['debtors'] });
      toast.success(t('actions.deleteSuccess'));
      deleteModal.close();
    },
    onError: () => {
      toast.error(t('actions.deleteError'));
    },
  });

  const columns = useMemo(() => getColumns({ t }), [t]);

  const filterConfig = useMemo(() => getDebtorFilters(t), [t]);
  const debtors = useMemo(() => response?.data?.data ?? [], [response]);
  const totalPages = response?.data?.meta?.totalPages || 1;

  const { table } = useDataTable({
    columns,
    data: debtors,
    storageKey: 'debtors-table-columns',
    initialVisibility: { updatedAt: false, '_count.transactions': false, createdAt: false },
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
        {can(Action.DEBTORS_CREATE) && (
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
        getRowLink={(row) => ({
          to: `/debtors/${row.original.id}`,
          state: { fromPath: location.pathname, fromName: t('title') },
        })}
        mobileFields={{
          totalDebtAmount: 'primary',
          'market.name': 'secondary',
          '_count.transactions': 'secondary',
        }}
        renderMobileCard={(row) => {
          const actionsCell = row.getVisibleCells().find((cell) => cell.column.id === 'actions');
          const d = row.original;
          return (
            <EntityMobileCard
              image={null}
              fallbackIcon={UserRound}
              title={d.name}
              subtitle={d.phone}
              actionsCell={actionsCell && flexRender(actionsCell.column.columnDef.cell, actionsCell.getContext())}
              badges={[{ label: t(`risk.${d.risk}`), className: DEBTOR_RISK_BADGE[d.risk] }]}
              stats={[{ label: t('totalDebtAmount'), value: fmtTJS(d.totalDebtAmount) }]}
            />
          );
        }}
      />
      <CreateDebtorModal />
      <EditDebtorModal />
      <ConfirmDialog
        open={deleteModal.isOpen}
        onOpenChange={(open) => !open && deleteModal.close()}
        onConfirm={() => deleteModal.data != null && deleteDebtor(deleteModal.data)}
        isLoading={isDeletePending}
        title={t('actions.confirm')}
        description={t('actions.areYouSure')}
      />
    </div>
  );
}
