import { ArrowUpDown, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { categoriesApi } from '~/api/categories';
import { CategoriesSummary } from '~/components/categories/CategoriesSummary';
import { CategoryReorder } from '~/components/categories/CategoryReorder';
import { CategoryRow } from '~/components/categories/CategoryRow';
import { DeleteCategoryDialog } from '~/components/categories/DeleteCategoryDialog';
import { ListPageLayout } from '~/components/shared/ListPageLayout';
import { Button } from '~/components/ui/button';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { useDataTable } from '~/hooks/useDataTable';
import { useEntityList } from '~/hooks/useEntityList';
import { buildRowSwipeActions } from '~/lib/swipe-actions';
import { getColumns } from '~/routes/(crm)/categories/configs/columns';
import { getCategoryFilters } from '~/routes/(crm)/categories/configs/filters';
import { useCategoriesModals, useCategoriesStore } from '~/routes/(crm)/categories/store';

export default function CategoriesPage() {
  const { t } = useTranslation(['categories', 'common']);
  const location = useLocation();
  const navigate = useNavigate();
  const { can } = useCan();
  const deleteModal = useCategoriesModals((s) => s.delete);
  const removeModal = useCategoriesModals((s) => s.remove);
  const [reordering, setReordering] = useState(false);

  const list = useEntityList({
    entity: 'categories',
    store: useCategoriesStore,
    api: categoriesApi,
    t,
    deleteModal,
    // Без своей сортировки — в порядке, который задал владелец (он же в выборе товара при продаже).
    defaultSort: { sortBy: 'sortOrder', sortOrder: 'asc' },
  });
  const filterConfig = useMemo(() => getCategoryFilters(t), [t]);
  const columns = useMemo(() => getColumns({ t }), [t]);

  const { table } = useDataTable({
    columns,
    data: list.rows,
    storageKey: 'categories-table-columns',
    initialVisibility: { description: false, createdAt: false },
  });

  if (reordering) return <CategoryReorder onDone={() => setReordering(false)} />;

  return (
    <>
      <ListPageLayout
        title={t('title')}
        searchPlaceholder={t('filters.search')}
        list={list}
        table={table}
        filterConfig={filterConfig}
        quickFilters={can(Action.CATEGORIES_MANAGE) ? <CategoriesSummary /> : undefined}
        showFilterPills
        syncUrl
        getRowLink={(row) => ({
          to: `/categories/${row.original.id}`,
          state: { fromPath: location.pathname, fromName: t('title') },
        })}
        getSwipeActions={(row) =>
          buildRowSwipeActions({
            t,
            onEdit: can(Action.CATEGORIES_MANAGE)
              ? () =>
                  navigate(`/categories/${row.original.id}/edit`, {
                    state: { fromPath: location.pathname, fromName: t('title') },
                  })
              : undefined,
            onDelete: can(Action.CATEGORIES_MANAGE)
              ? () =>
                  removeModal.open({
                    id: row.original.id,
                    name: row.original.name,
                    productsCount: row.original._count.products + (row.original.archivedCount ?? 0),
                  })
              : undefined,
          })
        }
        createAction={
          can(Action.CATEGORIES_MANAGE) ? (
            <>
              {/* Только значок: «Создать категорию» длинное, рядом с подписью оно не помещается в 390px. */}
              <Button
                variant="secondary"
                size="icon"
                aria-label={t('reorder.button')}
                title={t('reorder.button')}
                className="shrink-0"
                onClick={() => setReordering(true)}>
                <ArrowUpDown />
              </Button>
              <Button
                aria-label={t('create')}
                className="min-w-0 flex-1 gap-1.5 px-4 sm:flex-initial"
                onClick={() => navigate('/categories/create')}>
                <Plus data-icon="inline-start" />
                <span>{t('create')}</span>
              </Button>
            </>
          ) : null
        }
        renderCard={(row) => <CategoryRow category={row.original} t={t} />}
      />
      <DeleteCategoryDialog />
    </>
  );
}
