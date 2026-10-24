import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Banknote, Plus } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { ColumnToggle } from '~/components/shared/ColumnToggle';
import { ConfirmDialog } from '~/components/shared/ConfirmDialog';
import { DataTable } from '~/components/shared/DataTable';
import { renderActionsCell } from '~/components/shared/ListPageLayout';
import { DebtorMobileCard } from '~/components/debtors/DebtorMobileCard';
import { FilterSheet } from '~/components/shared/FilterSheet';
import { ActiveFilterPills } from '~/components/shared/ActiveFilterPills';
import { ListPageToolbar } from '~/components/shared/ListPageToolbar';
import { CreatePaymentModal } from '~/components/modals/CreatePaymentModal';
import { Button } from '~/components/ui/button';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { useDataTable } from '~/hooks/useDataTable';
import { useDebounce } from '~/hooks/useDebounce';
import { useFilterParams } from '~/hooks/useFilterParams';
import { useOpenPay } from '~/hooks/useOpenPay';
import { useDebtorRows } from '~/hooks/useOfflineOverlay';
import { queryKeys } from '~/lib/query-keys';
import { buildRowSwipeActions } from '~/lib/swipe-actions';
import { getColumns } from '~/routes/(crm)/debtors/configs/columns';
import { getDebtorFilters } from '~/routes/(crm)/debtors/configs/filters';
import { useDebtorsModals, useDebtorsStore } from '~/routes/(crm)/debtors/store';
import { debtorsApi } from '~/api/debtors';

export default function DebtorsPage() {
  const { t } = useTranslation(['debtors', 'common']);
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const { can } = useCan();
  const deleteModal = useDebtorsModals((s) => s.delete);
  const { mutate: openPay } = useOpenPay(t('actions.payLoadError'));

  const { page, limit, search, filters, setPage, setLimit, setSearch, setFilters, resetFilters, removeFilter } =
    useDebtorsStore();

  const debouncedSearch = useDebounce(search);

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    fetchStatus,
    dataUpdatedAt,
  } = useQuery({
    queryKey: queryKeys.list('debtors', { page, limit, search: debouncedSearch, filters }),
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

  // Запрос ни разу не загрузился и сейчас на паузе из-за офлайна — отличаем
  // от "список реально пуст" (см. app/lib/network-status.ts).

  const { mutate: deleteDebtor, isPending: isDeletePending } = useMutation({
    mutationFn: (id: string) => debtorsApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.entity('debtors') });
      toast.success(t('actions.deleteSuccess'));
      deleteModal.close();
    },
    onError: () => {
      toast.error(t('actions.deleteError'));
    },
  });

  const columns = useMemo(() => getColumns({ t }), [t]);

  const filterConfig = useMemo(() => getDebtorFilters(t), [t]);

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
  const serverDebtors = useMemo(() => response?.data?.data ?? [], [response]);
  // Должники из очереди (ещё не созданные на сервере) стоят сверху и сразу доступны — см. offline-overlay.ts.
  const debtors = useDebtorRows(serverDebtors, { page, search: debouncedSearch, filters, dataUpdatedAt });
  // Запрос ни разу не загрузился и сейчас на паузе из-за офлайна — отличаем от "список реально пуст"
  // (см. app/lib/network-status.ts). Если в очереди уже что-то есть, показываем это, а не заглушку.
  const isOfflineEmpty = fetchStatus === 'paused' && !response && debtors.length === 0;
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
            aria-label={t('create')}
            className="min-w-0 flex-1 gap-1.5 px-4 sm:flex-initial"
            onClick={() => navigate('/debtors/create')}>
            <Plus data-icon="inline-start" />
            <span className="truncate">{t('create')}</span>
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
        getRowLink={(row) =>
          // Страницы у должника из очереди ещё нет — открывать нечего.
          row.original.pending
            ? undefined
            : { to: `/debtors/${row.original.id}`, state: { fromPath: location.pathname, fromName: t('title') } }
        }
        // Должник из очереди ещё не создан на сервере: правка и удаление ему не
        // подходят, у такой строки свои кнопки «повторить / убрать» (см. renderMobileCard).
        getSwipeActions={(row) => {
          const debtor = row.original;
          if (debtor.pending) return undefined;
          const activeDebtId = debtor.activeDebtTransactionId;
          return buildRowSwipeActions({
            t,
            leading:
              activeDebtId && can(Action.TRANSACTIONS_EDIT)
                ? [
                    {
                      key: 'pay',
                      label: t('actions.pay'),
                      icon: Banknote,
                      tone: 'success',
                      onSelect: () => openPay(activeDebtId),
                    },
                  ]
                : [],
            onEdit: can(Action.DEBTORS_EDIT)
              ? () =>
                  navigate(`/debtors/${debtor.id}/edit`, {
                    state: { fromPath: location.pathname, fromName: t('title') },
                  })
              : undefined,
            onDelete: can(Action.DEBTORS_DELETE) ? () => deleteModal.open(debtor.id) : undefined,
          });
        }}
        renderMobileCard={(row) => (
          // Только очередь: у обычных строк действия — свайпом.
          <DebtorMobileCard row={row} t={t} actionsCell={row.original.pending ? renderActionsCell(row) : undefined} />
        )}
      />
      <CreatePaymentModal />
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
