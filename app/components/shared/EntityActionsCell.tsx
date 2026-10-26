import type { TFunction } from 'i18next';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { IconActionButton, RowActionsCell } from '~/components/shared/RowActionsCell';
import type { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';

interface EntityActionsCellProps {
  id: string;
  basePath: string;
  t: TFunction;
  editAction?: Action;
  deleteAction?: Action;
  onDelete: (id: string) => void;
  /** Override view link target (e.g. seller viewing self → `/profile`). */
  viewTo?: string;
  /** Omit location state on view link when true (e.g. `/profile`). */
  omitViewState?: boolean;
  /** Also pass location state to the edit link (used by products). */
  passEditState?: boolean;
  /** Optional leading action buttons (e.g. pay button on debtors/transactions). */
  leadingActions?: ReactNode;
}

/**
 * Стандартная ячейка действий таблицы: Просмотр, Редактирование и Удаление с проверкой прав.
 */
export function EntityActionsCell({
  id,
  basePath,
  t,
  editAction,
  deleteAction,
  onDelete,
  viewTo,
  omitViewState,
  passEditState,
  leadingActions,
}: EntityActionsCellProps) {
  const location = useLocation();
  const { can } = useCan();
  const navState = { fromPath: location.pathname, fromName: t('title') };

  return (
    <RowActionsCell>
      {leadingActions}
      <IconActionButton
        icon={<Eye className="size-4" />}
        label={t('actions.view', { defaultValue: t('actions.view', { ns: 'common' }) })}
        render={
          <Link
            to={viewTo ?? `${basePath}/${id}`}
            state={omitViewState ? undefined : navState}
          />
        }
      />
      {editAction && can(editAction) && (
        <IconActionButton
          icon={<Pencil className="size-4" />}
          label={t('actions.edit', { defaultValue: t('actions.edit', { ns: 'common' }) })}
          render={
            <Link
              to={`${basePath}/${id}/edit`}
              state={passEditState ? navState : undefined}
            />
          }
        />
      )}
      {deleteAction && can(deleteAction) && (
        <IconActionButton
          icon={<Trash2 className="size-4" />}
          label={t('actions.delete', { defaultValue: t('actions.delete', { ns: 'common' }) })}
          danger
          onClick={() => onDelete(id)}
        />
      )}
    </RowActionsCell>
  );
}
