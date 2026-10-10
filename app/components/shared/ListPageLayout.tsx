import { type Row, type Table, flexRender } from '@tanstack/react-table';
import type { ReactNode } from 'react';
import { ActiveFilterPills } from '~/components/shared/ActiveFilterPills';
import { ColumnToggle } from '~/components/shared/ColumnToggle';
import { ConfirmDialog } from '~/components/shared/ConfirmDialog';
import { DataTable } from '~/components/shared/DataTable';
import { FilterSheet } from '~/components/shared/FilterSheet';
import { ListPageToolbar } from '~/components/shared/ListPageToolbar';
import { useFilterParams } from '~/hooks/useFilterParams';
import type { EntityListResult } from '~/hooks/useEntityList';
import type { FilterConfig } from '~/types/filters';

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

interface ListPageLayoutProps<TData> {
  title: string;
  searchPlaceholder: string;
  list: EntityListResult<TData>;
  table: Table<TData>;
  filterConfig: FilterConfig[];
  /** Row → mobile card. `actions` is already the rendered actions cell. */
  renderCard: (row: Row<TData>, actions: ReactNode) => ReactNode;
  getRowLink?: (row: Row<TData>) => { to: string; state?: unknown } | undefined;
  /**
   * The create control stays with the page: RBAC gating is decided per route and
   * the whole permission layer is still unsettled (see the A8 impact report).
   */
  createAction?: ReactNode;
  showFilterPills?: boolean;
  syncUrl?: boolean;
}

/**
 * The frame every list page draws around its table — toolbar with search, filter
 * sheet, column toggle and create action, the filter pills, the table itself with
 * its pagination and mobile cards, and the delete confirmation.
 *
 * Seven pages repeated this same ~45-line scaffold; what genuinely varies per page
 * (columns, filter config, the mobile card body, the row link) stays as props.
 */
export function ListPageLayout<TData>({
  title,
  searchPlaceholder,
  list,
  table,
  filterConfig,
  renderCard,
  getRowLink,
  createAction,
  showFilterPills = false,
  syncUrl = false,
}: ListPageLayoutProps<TData>) {
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
        />
        <ColumnToggle table={table} />
        {createAction}
      </ListPageToolbar>

      {showFilterPills ? (
        <ActiveFilterPills filters={list.filters} config={filterConfig} onRemove={list.removeFilter} />
      ) : null}

      <DataTable
        table={table}
        pinLastColumn
        isLoading={list.isLoading}
        isFetching={list.isFetching}
        isError={list.isError}
        isOfflineEmpty={list.isOfflineEmpty}
        page={list.page}
        limit={list.limit}
        totalPages={list.totalPages}
        onPageChange={list.setPage}
        onLimitChange={list.setLimit}
        getRowLink={getRowLink}
        renderMobileCard={(row) => renderCard(row, renderActionsCell(row))}
      />

      <ConfirmDialog {...list.deleteDialog} />

      {syncUrl ? <UrlQuerySync list={list} filterConfig={filterConfig} /> : null}
    </div>
  );
}
