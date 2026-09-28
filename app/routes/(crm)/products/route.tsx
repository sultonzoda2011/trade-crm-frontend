import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';
import { categoriesApi } from '~/api/categories';
import { productsApi } from '~/api/products';
import { ListPageLayout } from '~/components/shared/ListPageLayout';
import { ProductMobileCard } from '~/components/products/ProductMobileCard';
import { Button } from '~/components/ui/button';
import { Action } from '~/config/actions';
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
      showFilterPills
      syncUrl
      getRowLink={(row) => ({
        to: `/products/${row.original.id}`,
        state: { fromPath: location.pathname, fromName: t('title') },
      })}
      createAction={
        can(Action.PRODUCTS_CREATE) ? (
          <Button
            size="icon"
            aria-label={t('create')}
            className="w-auto shrink-0 gap-1.5 px-3"
            render={<Link to="/products/create" />}>
            <Plus data-icon="inline-start" />
            <span>{t('create')}</span>
          </Button>
        ) : null
      }
      renderCard={(row, actions) => <ProductMobileCard row={row} t={t} actionsCell={actions} />}
    />
  );
}
