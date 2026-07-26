import { type ColumnDef, createColumnHelper } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { Eye } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { UserAvatar } from '~/components/shared/UserAvatar';
import { Button } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { fmtTJS } from '~/lib/format';
import type { SellerReportRow } from '~/types/dashboard';

function SellerNameCell({ row, t }: { row: SellerReportRow; t: TFunction }) {
  const seller = row.seller;
  const location = useLocation();

  if (!seller) return <span className="text-muted-foreground font-medium">—</span>;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        className="h-auto p-0 font-medium hover:underline"
        render={
          <Link to={`/users/${seller.id}`} state={{ fromPath: location.pathname, fromName: t('usersReport') }} />
        }>
        <UserAvatar fullName={seller.name} subInfo={seller.email} />
      </Button>
    </div>
  );
}

function SellerActionsCell({ row, t }: { row: SellerReportRow; t: TFunction }) {
  const location = useLocation();

  if (!row.seller) return null;

  return (
    <div className="flex justify-end gap-1">
      <Tooltip>
        <TooltipTrigger render={
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            render={
              <Link to={`/users/${row.seller.id}`} state={{ fromPath: location.pathname, fromName: t('usersReport') }} />
            }>
            <Eye className="h-4 w-4" />
          </Button>
        } />
        <TooltipContent side="bottom">{t('actions.view', { ns: 'common', defaultValue: 'Открыть' })}</TooltipContent>
      </Tooltip>
    </div>
  );
}

const columnHelper = createColumnHelper<SellerReportRow>();

export const getColumns = ({ t }: { t: TFunction }): ColumnDef<SellerReportRow, any>[] => [
  columnHelper.accessor('seller.name', {
    header: t('table.seller'),
    enableHiding: false,
    cell: (info) => <SellerNameCell row={info.row.original} t={t} />,
  }),
  columnHelper.accessor('salesCount', {
    header: t('table.salesCount'),
    cell: (info) => <span className="font-mono tabular-nums">{info.getValue()}</span>,
  }),
  columnHelper.accessor('salesAmount', {
    header: t('table.salesAmount'),
    cell: (info) => (
      <span className="text-success font-mono font-semibold tabular-nums">{fmtTJS(info.getValue())}</span>
    ),
  }),
  columnHelper.accessor('refundsCount', {
    header: t('table.refundsCount'),
    cell: (info) => <span className="font-mono tabular-nums">{info.getValue()}</span>,
  }),
  columnHelper.accessor('refundsAmount', {
    header: t('table.refundsAmount', { defaultValue: 'Сумма возвратов' }),
    cell: (info) => (
      <span className="text-destructive font-mono font-medium tabular-nums">{fmtTJS(info.getValue())}</span>
    ),
  }),
  columnHelper.accessor('debtsCount', {
    header: t('table.debtsCount', { defaultValue: 'Долгов' }),
    cell: (info) => <span className="font-mono tabular-nums">{info.getValue()}</span>,
  }),
  columnHelper.accessor('debtsAmount', {
    header: t('table.debtsAmount'),
    cell: (info) => <span className="text-warning font-mono font-medium tabular-nums">{fmtTJS(info.getValue())}</span>,
  }),
  columnHelper.display({
    id: 'actions',
    enableHiding: false,
    header: () => <div className="text-center">{t('fields.actions', { ns: 'common', defaultValue: 'Действия' })}</div>,
    cell: (info) => <SellerActionsCell row={info.row.original} t={t} />,
  }),
];
