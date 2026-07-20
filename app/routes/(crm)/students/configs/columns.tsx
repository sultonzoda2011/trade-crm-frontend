import { type ColumnDef, createColumnHelper } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { UserAvatar } from '~/components/shared/UserAvatar';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Action } from '~/config/actions';
import { activeStatusConfig } from '~/config/enumOptions';
import { useCan } from '~/hooks/useCan';
import { cn } from '~/lib/utils';
import { ActiveStatus, Gender, type Student } from '~/types/student';
import { useStudentsModals } from '../store';

function StudentActionsCell({ row, t }: { row: Student; t: TFunction }) {
  const deleteModal = useStudentsModals((s) => s.delete);
  const location = useLocation();
  const { can } = useCan();

  return (
    <div className="flex justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        render={
          <Link to={`/students/${row.id}`} state={{ fromPath: location.pathname, fromName: t('title') }} />
        }
        title={t('actions.view')}>
        <Eye className="h-4 w-4" />
      </Button>
      {can(Action.STUDENTS_EDIT) && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          render={<Link to={`/students/${row.id}/edit`} state={{ fromPath: location.pathname, fromName: t('title') }} />}
          title={t('actions.edit')}>
          <Pencil className="h-4 w-4" />
        </Button>
      )}
      {can(Action.STUDENTS_DELETE) && (
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8"
          title={t('actions.delete')}
          onClick={() => deleteModal.open(row.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

const columnHelper = createColumnHelper<Student>();

export const getColumns = ({ t }: { t: TFunction }): ColumnDef<Student, any>[] => {
  return [
    columnHelper.accessor('fullName', {
      header: t('fields.fullName'),
      enableHiding: false,
      cell: (info) => (
        <UserAvatar
          fullName={info.row.original.fullName}
          imagePath={info.row.original.imagePath}
          subInfo={info.row.original.email}
        />
      ),
    }),
    columnHelper.accessor('phone', {
      header: t('fields.phone'),
      cell: (info) => <span className="text-sm">{info.getValue()}</span>,
    }),
    columnHelper.accessor('age', {
      header: t('fields.age'),
      cell: (info) => <span className="text-sm">{info.getValue()}</span>,
    }),
    columnHelper.accessor('birthday', {
      header: t('fields.birthday'),
      cell: (info) => {
        const val = info.getValue();
        return <span className="text-sm">{val ? new Date(val).toLocaleDateString() : '—'}</span>;
      },
    }),
    columnHelper.accessor('gender', {
      header: t('fields.gender'),
      cell: (info) => (
        <span className="text-sm">{info.getValue() === Gender.Male ? t('gender.male') : t('gender.female')}</span>
      ),
    }),
    columnHelper.accessor('address', {
      header: t('fields.address'),
      cell: (info) => <span className="text-sm">{info.getValue()}</span>,
    }),
    columnHelper.accessor('activeStatus', {
      header: t('fields.status'),
      cell: (info) => {
        const config = activeStatusConfig[info.getValue() as ActiveStatus];
        return (
          <Badge variant="outline" className={cn('font-medium', config?.className)}>
            {config?.label(t) ?? info.getValue()}
          </Badge>
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      enableHiding: false,
      header: () => <div className="text-center">{t('fields.actions')}</div>,
      cell: (info) => <StudentActionsCell row={info.row.original} t={t} />,
    }),
  ] as ColumnDef<Student, any>[];
};
