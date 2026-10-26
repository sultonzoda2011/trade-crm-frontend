import { type ColumnDef, createColumnHelper } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { EntityActionsCell } from '~/components/shared/EntityActionsCell';
import { UserAvatar } from '~/components/shared/UserAvatar';
import { Action } from '~/config/actions';
import { getClientUser } from '~/lib/auth-utils';
import { useSellersModals } from '~/routes/(crm)/sellers/store';
import type { Seller } from '~/types/sellers';

function SellerActionsCell({ row, t }: { row: Seller; t: TFunction }) {
  const deleteModal = useSellersModals((s) => s.delete);
  // Owner-продавец может встретить самого себя в списке продавцов (бэкенд
  // включает владельца в выдачу). Открывать чужую страницу /sellers/:id для
  // самого себя не нужно — ведём на собственный /profile.
  const isSelf = getClientUser()?.id === row.id;

  return (
    <EntityActionsCell
      id={row.id}
      basePath="/sellers"
      t={t}
      viewTo={isSelf ? '/profile' : undefined}
      omitViewState={isSelf}
      editAction={Action.SELLERS_EDIT}
      deleteAction={Action.SELLERS_DELETE}
      onDelete={deleteModal.open}
    />
  );
}

const columnHelper = createColumnHelper<Seller>();

export const getColumns = ({ t }: { t: TFunction }): ColumnDef<Seller, any>[] => {
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
      header: t('fields.market'),
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

    columnHelper.display({
      id: 'actions',
      enableHiding: false,
      header: () => <div className="text-center">{t('fields.actions')}</div>,
      cell: (info) => <SellerActionsCell row={info.row.original} t={t} />,
    }),
  ] as ColumnDef<Seller, any>[];
};
