import { type ColumnDef, createColumnHelper } from '@tanstack/react-table'
import type { TFunction } from 'i18next'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { UserAvatar } from '~/components/shared/UserAvatar'
import { Button } from '~/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { Action } from '~/config/actions'
import { useCan } from '~/hooks/useCan'
import { fmtTJS, formatDate } from '~/lib/format'
import type { Debtor } from '~/types/debtors'
import { useDebtorsModals } from '../store'

function DebtorActionsCell({ row, t }: { row: Debtor; t: TFunction }) {
  const deleteModal = useDebtorsModals((s) => s.delete);
  const editModal = useDebtorsModals((s) => s.edit);
  const location = useLocation();
  const { can } = useCan();

  return (
    <div className="flex justify-end gap-1">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              render={<Link to={`/debtors/${row.id}`} state={{ fromPath: location.pathname, fromName: t('title') }} />}>
              <Eye className="h-4 w-4" />
            </Button>
          }
        />
        <TooltipContent side="bottom">{t('actions.view')}</TooltipContent>
      </Tooltip>
      {can(Action.DEBTORS_EDIT) && (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editModal.open(row)}>
                <Pencil className="h-4 w-4" />
              </Button>
            }
          />
          <TooltipContent side="bottom">{t('actions.edit')}</TooltipContent>
        </Tooltip>
      )}
      {can(Action.DEBTORS_DELETE) && (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8"
                onClick={() => deleteModal.open(row.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            }
          />
          <TooltipContent side="bottom">{t('actions.delete')}</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

const columnHelper = createColumnHelper<Debtor>();

export const getColumns = ({ t }: { t: TFunction }): ColumnDef<Debtor, any>[] => {
  return [
    columnHelper.accessor('name', {
      header: t('fields.name'),
      enableHiding: false,
      cell: (info) => <UserAvatar fullName={info.row.original.name} subInfo={info.row.original.phone} />,
    }),
    columnHelper.accessor('market.name', {
      header: t('fields.market'),
      cell: (info) => <span className="text-sm">{info.getValue()}</span>,
    }),
    columnHelper.accessor('market.address', {
      header: t('fields.marketAddress'),
      cell: (info) => <span className="text-sm">{info.getValue()}</span>,
    }),
    columnHelper.accessor('createdAt', {
      header: t('fields.createdAt'),
      cell: (info) => <span className="text-sm">{formatDate(info.getValue())}</span>,
    }),
    columnHelper.accessor('updatedAt', {
      header: t('fields.updatedAt'),
      cell: (info) => <span className="text-sm">{formatDate(info.getValue())}</span>,
    }),
    columnHelper.accessor('_count.transactions', {
      header: t('fields.transactions'),
      cell: (info) => <span className="text-sm">{info.getValue().toLocaleString()}</span>,
    }),
    columnHelper.accessor((row: any) => row.totalDebtAmount ?? 0, {
      id: 'totalDebtAmount',
      header: t('totalDebtAmount'),
      cell: (info) => <span className="font-mono text-sm">{fmtTJS(info.getValue())}</span>,
    }),

    columnHelper.display({
      id: 'actions',
      enableHiding: false,
      header: () => <div className="text-center">{t('fields.actions')}</div>,
      cell: (info) => <DebtorActionsCell row={info.row.original} t={t} />,
    }),
  ] as ColumnDef<Debtor, any>[];
};
