import { type Row, type Table, flexRender } from '@tanstack/react-table';
import type { ReactNode } from 'react';
import { ActiveFilterPills } from '~/components/shared/ActiveFilterPills';
import { ColumnToggle } from '~/components/shared/ColumnToggle';
import { ConfirmDialog } from '~/components/shared/ConfirmDialog';
import { DataTable, type MobileRowGroup } from '~/components/shared/DataTable';
import { FilterSheet } from '~/components/shared/FilterSheet';
import { ListPageToolbar } from '~/components/shared/ListPageToolbar';
import type { SwipeAction } from '~/components/shared/SwipeableRow';
import type { EntityListResult } from '~/hooks/useEntityList';
import { useFilterParams } from '~/hooks/useFilterParams';
import type { FilterConflict } from '~/lib/filter-rules';
import type { ActiveFilter, FilterConfig } from '~/types/filters';

/**
 * Render a row's `actions` cell. Every mobile card needs it and every page used
 * to hand-roll the same two lines of `getVisibleCells().find(...)` + `flexRender`.
 */
export function renderActionsCell<TData>(row: Row<TData>): ReactNode {
  const cell = row.getVisibleCells().find((c) => c.column.id === 'actions');
  return cell ? flexRender(cell.column.columnDef.cell, cell.getContext()) : null;
}

/**
 * Mounted only by pages that opted into URL sync; keeping it a component is what
 * lets the hook stay unconditional inside it.
 */
function UrlQuerySync<TData>({ list, filterConfig }: { list: EntityListResult<TData>; filterConfig: FilterConfig[] }) {
  useFilterParams({
    page: list.page,
    limit: list.limit,
    search: list.search,
    filters: list.filters,
    setPage: list.setPage,
    setLimit: list.setLimit,
    setSearch: list.setSearch,
    setFilters: list.setFilters,
    filterConfigs: filterConfig,
  });
  return null;
}

interface ListPageLayoutProps<TData, TServerData = TData> {
  title: string;
  searchPlaceholder: string;
  list: EntityListResult<TServerData>;
  table: Table<TData>;
  filterConfig: FilterConfig[];
  /** Row → mobile card. `actions` is already the rendered actions cell. */
  renderCard: (row: Row<TData>, actions: ReactNode) => ReactNode;
  getRowLink?: (row: Row<TData>) => { to: string; state?: unknown } | undefined;
  /** Свайп-действия мобильной строки (уже отфильтрованные по правам). */
  getSwipeActions?: (row: Row<TData>) => SwipeAction[] | undefined;
  /** Разбивает мобильный список на блоки (например, по дням). */
  getMobileGroups?: (rows: Row<TData>[]) => MobileRowGroup<TData>[];
  /**
   * The create control stays with the page: RBAC gating is decided per route and
   * the whole permission layer is still unsettled (see the A8 impact report).
   */
  createAction?: ReactNode;
  /** Ряд быстрых чипсов под поиском (см. DebtorQuickFilters, ProductQuickFilters). */
  quickFilters?: ReactNode;
  /** Несовместимые пары фильтров страницы (см. `~/lib/filter-rules`). */
  filterRules?: readonly FilterConflict[];
  /** Какие активные фильтры показать плашками; по умолчанию все. Нужно, когда часть уже видна в чипсах. */
  pillFilters?: ActiveFilter[];
  showFilterPills?: boolean;
  syncUrl?: boolean;
  /** Override `list.isOfflineEmpty` when an offline overlay adds queued local rows. */
  isOfflineEmptyOverride?: boolean;
  /** Extra modals or overlays rendered alongside the table (e.g. `<CreatePaymentModal />`). */
  children?: ReactNode;
}

/**
 * The frame every list page draws around its table — toolbar with search, filter
 * sheet, column toggle and create action, the filter pills, the table itself with
 * its pagination and mobile cards, and the delete confirmation.
 *
 * Seven pages repeated this same ~45-line scaffold; what genuinely varies per page
 * (columns, filter config, the mobile card body, the row link) stays as props.
 */
export function ListPageLayout<TData, TServerData = TData>({
  title,
  searchPlaceholder,
  list,
  table,
  filterConfig,
  renderCard,
  getRowLink,
  getSwipeActions,
  getMobileGroups,
  createAction,
  quickFilters,
  filterRules,
  pillFilters,
  showFilterPills = false,
  syncUrl = false,
  isOfflineEmptyOverride,
  children,
}: ListPageLayoutProps<TData, TServerData>) {
  return (
    <div className="flex-1 space-y-4">
      <ListPageToolbar
        title={title}
        searchPlaceholder={searchPlaceholder}
        searchValue={list.search}
        onSearchChange={list.setSearch}>
        <FilterSheet
          config={filterConfig}
          filters={list.filters}
          onApply={list.setFilters}
          onReset={list.resetFilters}
          rules={filterRules}
        />
        <ColumnToggle table={table} />
        {createAction}
      </ListPageToolbar>

      {quickFilters}

      {showFilterPills ? (
        <ActiveFilterPills filters={pillFilters ?? list.filters} config={filterConfig} onRemove={list.removeFilter} />
      ) : null}

      <DataTable
        table={table}
        pinLastColumn
        isLoading={list.isLoading}
        isFetching={list.isFetching}
        isError={list.isError}
        isOfflineEmpty={isOfflineEmptyOverride ?? list.isOfflineEmpty}
        page={list.page}
        limit={list.limit}
        totalPages={list.totalPages}
        onPageChange={list.setPage}
        onLimitChange={list.setLimit}
        getRowLink={getRowLink}
        getSwipeActions={getSwipeActions}
        getMobileGroups={getMobileGroups}
        renderMobileCard={(row) => renderCard(row, renderActionsCell(row))}
      />

      {children}

      <ConfirmDialog {...list.deleteDialog} />

      {syncUrl ? <UrlQuerySync list={list} filterConfig={filterConfig} /> : null}
    </div>
  );
}
