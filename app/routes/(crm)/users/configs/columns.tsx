import { type ColumnDef, createColumnHelper } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { UserAvatar } from '~/components/shared/UserAvatar';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { Action } from '~/config/actions';
import { ROLE_CONFIG } from '~/config/enumOptions';
import { useCan } from '~/hooks/useCan';
import type { User } from '~/types/users';
import { useUsersModals } from '../store';

function UserActionsCell({ row, t }: { row: User; t: TFunction }) {
  const deleteModal = useUsersModals((s) => s.delete);
  const editModal = useUsersModals((s) => s.edit);
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
              render={<Link to={`/users/${row.id}`} state={{ fromPath: location.pathname, fromName: t('title') }} />}>
              <Eye className="h-4 w-4" />
            </Button>
          }
        />
        <TooltipContent side="bottom">{t('actions.view')}</TooltipContent>
      </Tooltip>
      {can(Action.USERS_EDIT) && (
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
      {can(Action.USERS_DELETE) && (
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

const columnHelper = createColumnHelper<User>();

export const getColumns = ({ t }: { t: TFunction }): ColumnDef<User, any>[] => {
  return [
    columnHelper.accessor('name', {
      header: t('fields.name'),
      enableHiding: false,
      cell: (info) => <UserAvatar fullName={info.row.original.name} imagePath={info.row.original.image ?? undefined} />,
    }),
    columnHelper.accessor('email', {
      header: t('fields.email'),
      cell: (info) => <span className="text-sm">{info.getValue()}</span>,
    }),
    columnHelper.accessor('market.name', {
      header: () => <span>{t('fields.market')}</span>,
      cell: (info) => {
        const market = info.row.original.market;
        return (
          <UserAvatar
            fullName={market?.name ?? ''}
            subInfo={market?.address ?? ''}
            imagePath={market?.image ?? undefined}
          />
        );
      },
    }),
    columnHelper.accessor('role', {
      header: t('fields.role'),
      cell: (info) => {
        const role = info.getValue();
        const config = ROLE_CONFIG[role];
        return (
          <Badge variant="outline" className={config?.className}>
            {config ? config.label(t) : role}
          </Badge>
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      enableHiding: false,
      header: () => <div className="text-center">{t('fields.actions')}</div>,
      cell: (info) => <UserActionsCell row={info.row.original} t={t} />,
    }),
  ] as ColumnDef<User, any>[];
};
