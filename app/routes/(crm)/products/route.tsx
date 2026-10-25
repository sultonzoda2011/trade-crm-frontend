import { useQuery } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router';
import { categoriesApi } from '~/api/categories';
import { productsApi } from '~/api/products';
import { ListPageLayout } from '~/components/shared/ListPageLayout';
import { ProductQuickFilters, filtersNotShownByProductChips } from '~/components/products/ProductQuickFilters';
import { ProductRow } from '~/components/products/ProductRow';
import type { SwipeAction } from '~/components/shared/SwipeableRow';
import { Button } from '~/components/ui/button';
import { Action } from '~/config/actions';
import { PRODUCT_FILTER_RULES } from '~/config/filterRules';
import { useCan } from '~/hooks/useCan';
import { useDataTable } from '~/hooks/useDataTable';
import { useEntityList } from '~/hooks/useEntityList';
import { mapToOptions } from '~/lib/mapToOptions';
import { queryKeys } from '~/lib/query-keys';
import { getColumns } from '~/routes/(crm)/products/configs/columns';
import { getProductFilters } from '~/routes/(crm)/products/configs/filters';
import { useProductsModals, useProductsStore } from '~/routes/(crm)/products/store';

export default function ProductsPage() {
  const { t } = useTranslation(['products', 'common']);
  const location = useLocation();
  const navigate = useNavigate();
  const { can } = useCan();
  const deleteModal = useProductsModals((s) => s.delete);

  const list = useEntityList({ entity: 'products', store: useProductsStore, api: productsApi, t, deleteModal });

  // A detail page deep-links here pre-filtered through router state; consume it once.
  const hasProcessedState = useRef(false);
  useEffect(() => {
    if (hasProcessedState.current) return;
    const state = location.state as Record<string, unknown> | null;
    if (state?.fromCategoryId) list.setFilter('categoryId', state.fromCategoryId);
    hasProcessedState.current = true;
    window.history.replaceState({}, document.title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: categoriesResponse } = useQuery({
    queryKey: queryKeys.options('categories', { scope: 'filters', limit: 100 }),
    queryFn: () => categoriesApi.getAll(1, 100, {}, []),
  });

  const categoryOptions = useMemo(
    () => mapToOptions(categoriesResponse?.data?.data ?? [], 'id', 'name'),
    [categoriesResponse]
  );
  const filterConfig = useMemo(() => getProductFilters(t, categoryOptions), [t, categoryOptions]);

  const columns = useMemo(() => getColumns({ t }), [t]);

  const { table } = useDataTable({
    columns,
    data: list.rows,
    storageKey: 'products-table-columns',
    // Аналитика показывает состояние и запас в днях; сырые продажи за период
    // остаются доступны через ColumnToggle, чтобы таблица не разрослась.
    initialVisibility: {
      'category.name': false,
      '_count.transactionItems': false,
      'market.name': false,
      createdAt: false,
      'metrics.netUnitsSold': false,
      'metrics.revenue': false,
      'metrics.daysOfStockRemaining': false,
    },
  });

  return (
    <ListPageLayout
      title={t('title')}
      searchPlaceholder={t('filters.search')}
      list={list}
      table={table}
      filterConfig={filterConfig}
      quickFilters={<ProductQuickFilters filters={list.filters} onChange={list.setFilters} />}
      filterRules={PRODUCT_FILTER_RULES}
      showFilterPills
      pillFilters={filtersNotShownByProductChips(list.filters)}
      syncUrl
      getRowLink={(row) => ({
        to: `/products/${row.original.id}`,
        state: { fromPath: location.pathname, fromName: t('title') },
      })}
      getSwipeActions={(row): SwipeAction[] => {
        const product = row.original;
        const actions: SwipeAction[] = [];
        if (can(Action.PRODUCTS_EDIT)) {
          actions.push({
            key: 'edit',
            label: t('swipe.edit'),
            icon: Pencil,
            tone: 'primary',
            onSelect: () =>
              navigate(`/products/${product.id}/edit`, {
                state: { fromPath: location.pathname, fromName: t('title') },
              }),
          });
        }
        if (can(Action.PRODUCTS_DELETE)) {
          actions.push({
            key: 'delete',
            label: t('swipe.delete'),
            icon: Trash2,
            tone: 'destructive',
            onSelect: () => deleteModal.open(product.id),
          });
        }
        return actions;
      }}
      createAction={
        can(Action.PRODUCTS_CREATE) ? (
          <Button
            aria-label={t('create')}
            className="min-w-0 flex-1 gap-1.5 px-4 sm:flex-initial"
            render={<Link to="/products/create" />}>
            <Plus data-icon="inline-start" />
            <span>{t('create')}</span>
          </Button>
        ) : null
      }
      renderCard={(row) => <ProductRow row={row} t={t} />}
    />
  );
}
