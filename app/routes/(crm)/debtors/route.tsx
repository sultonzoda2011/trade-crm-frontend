import { Banknote, Plus } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { debtorsApi } from '~/api/debtors';
import { DebtorMobileCard } from '~/components/debtors/DebtorMobileCard';
import { CreatePaymentModal } from '~/components/modals/CreatePaymentModal';
import { ListPageLayout } from '~/components/shared/ListPageLayout';
import { Button } from '~/components/ui/button';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { useDataTable } from '~/hooks/useDataTable';
import { useEntityList } from '~/hooks/useEntityList';
import { useDebtorRows } from '~/hooks/useOfflineOverlay';
import { useOpenPay } from '~/hooks/useOpenPay';
import { buildRowSwipeActions } from '~/lib/swipe-actions';
import { getColumns } from '~/routes/(crm)/debtors/configs/columns';
import { getDebtorFilters } from '~/routes/(crm)/debtors/configs/filters';
import { useDebtorsModals, useDebtorsStore } from '~/routes/(crm)/debtors/store';

export default function DebtorsPage() {
  const { t } = useTranslation(['debtors', 'common']);
  const location = useLocation();
  const navigate = useNavigate();
  const { can } = useCan();
  const deleteModal = useDebtorsModals((s) => s.delete);
  const { mutate: openPay } = useOpenPay(t('actions.payLoadError'));

  const list = useEntityList({ entity: 'debtors', store: useDebtorsStore, api: debtorsApi, t, deleteModal });
  const filterConfig = useMemo(() => getDebtorFilters(t), [t]);
  const columns = useMemo(() => getColumns({ t }), [t]);

  // Должники из очереди (ещё не созданные на сервере) стоят сверху и сразу доступны — см. offline-overlay.ts.
  const debtors = useDebtorRows(list.serverRows, {
    page: list.page,
    search: list.debouncedSearch,
    filters: list.filters,
    dataUpdatedAt: list.dataUpdatedAt,
  });

  const { table } = useDataTable({
    columns,
    data: debtors,
    storageKey: 'debtors-table-columns',
    initialVisibility: { updatedAt: false, '_count.transactions': false, createdAt: false },
  });

  return (
    <ListPageLayout
      title={t('title')}
      searchPlaceholder={t('filters.search')}
      list={list}
      table={table}
      filterConfig={filterConfig}
      showFilterPills
      syncUrl
      // Если в очереди уже что-то есть, показываем это, а не заглушку офлайна.
      isOfflineEmptyOverride={list.isOfflineEmpty && debtors.length === 0}
      getRowLink={(row) =>
        // Страницы у должника из очереди ещё нет — открывать нечего.
        row.original.pending
          ? undefined
          : { to: `/debtors/${row.original.id}`, state: { fromPath: location.pathname, fromName: t('title') } }
      }
      // Должник из очереди ещё не создан на сервере: правка и удаление ему не
      // подходят, у такой строки свои кнопки «повторить / убрать» (см. renderCard).
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
      createAction={
        can(Action.DEBTORS_CREATE) ? (
          <Button
            aria-label={t('create')}
            className="min-w-0 flex-1 gap-1.5 px-4 sm:flex-initial"
            onClick={() => navigate('/debtors/create')}>
            <Plus data-icon="inline-start" />
            <span className="truncate">{t('create')}</span>
          </Button>
        ) : null
      }
      renderCard={(row, actions) => (
        // Только очередь: у обычных строк действия — свайпом.
        <DebtorMobileCard row={row} t={t} actionsCell={row.original.pending ? actions : undefined} />
      )}>
      <CreatePaymentModal />
    </ListPageLayout>
  );
}
