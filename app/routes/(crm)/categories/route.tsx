import { Package, Plus, Tag } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { categoriesApi } from '~/api/categories';
import { EntityMobileCard } from '~/components/shared/EntityMobileCard';
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

  const list = useEntityList({ entity: 'categories', store: useCategoriesStore, api: categoriesApi, t, deleteModal });
  const filterConfig = useMemo(() => getCategoryFilters(t), [t]);
  const columns = useMemo(() => getColumns({ t }), [t]);

  const { table } = useDataTable({
    columns,
    data: list.rows,
    storageKey: 'categories-table-columns',
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
          onDelete: can(Action.CATEGORIES_MANAGE) ? () => deleteModal.open(row.original.id) : undefined,
        })
      }
      createAction={
        can(Action.CATEGORIES_MANAGE) ? (
          <Button
            aria-label={t('create')}
            className="min-w-0 flex-1 gap-1.5 px-4 sm:flex-initial"
            onClick={() => navigate('/categories/create')}>
            <Plus data-icon="inline-start" />
            <span>{t('create')}</span>
          </Button>
        ) : null
      }
      renderCard={(row) => {
        const c = row.original;
        return (
          <EntityMobileCard
            image={c.image}
            fallbackIcon={Tag}
            title={c.name}
            subtitle={c.description}
            stats={[{ icon: Package, label: t('fields.productsCount'), value: c._count.products }]}
          />
        );
      }}
    />
  );
}
