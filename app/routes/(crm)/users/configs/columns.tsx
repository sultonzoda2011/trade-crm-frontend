import { type ColumnDef, createColumnHelper } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { UserAvatar } from '~/components/shared/UserAvatar';
import { IconActionButton, RowActionsCell } from '~/components/shared/RowActionsCell';
import { Badge } from '~/components/ui/badge';
import { Action } from '~/config/actions';
import { ROLE_CONFIG } from '~/config/enumOptions';
import { useCan } from '~/hooks/useCan';
import type { User } from '~/types/users';
import { useUsersModals } from '~/routes/(crm)/users/store';

function UserActionsCell({ row, t }: { row: User; t: TFunction }) {
  const deleteModal = useUsersModals((s) => s.delete);
  const location = useLocation();
  const { can } = useCan();

  return (
    <RowActionsCell>
      <IconActionButton
        icon={<Eye className="size-4" />}
        label={t('actions.view')}
        render={<Link to={`/users/${row.id}`} state={{ fromPath: location.pathname, fromName: t('title') }} />}
      />
      {can(Action.USERS_EDIT) && (
        <IconActionButton
          icon={<Pencil className="size-4" />}
          label={t('actions.edit')}
          render={<Link to={`/users/${row.id}/edit`} />}
        />
      )}
      {can(Action.USERS_DELETE) && (
        <IconActionButton
          icon={<Trash2 className="size-4" />}
          label={t('actions.delete')}
          danger
          onClick={() => deleteModal.open(row.id)}
        />
      )}
    </RowActionsCell>
  );
}

const columnHelper = createColumnHelper<User>();

export const getColumns = ({ t }: { t: TFunction }): ColumnDef<User, any>[] => {
  return [
    columnHelper.accessor('name', {
      header: t('fields.name'),
      enableHiding: false,
      cell: (info) => (
        <UserAvatar
          fullName={info.row.original.name}
          imagePath={info.row.original.image ?? undefined}
          subInfo={info.row.original.email}
        />
      ),
    }),
    columnHelper.accessor('email', {
      header: t('fields.email'),
      cell: (info) => <span className="text-sm">{info.getValue()}</span>,
    }),
    columnHelper.accessor('market.name', {
      id: 'market.name',
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
