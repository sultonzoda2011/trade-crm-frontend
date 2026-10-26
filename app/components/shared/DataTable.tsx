import { type Row, type Table, flexRender } from '@tanstack/react-table';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { DataTablePagination } from '~/components/shared/DataTablePagination';
import {
  DataTableDesktopSkeletonRows,
  DataTableErrorBlock,
  DataTableMobileSkeleton,
  DataTableOfflineBlock,
} from '~/components/shared/DataTableStates';
import { EmptyState } from '~/components/shared/EmptyState';
import { SwipeableRow, type SwipeAction } from '~/components/shared/SwipeableRow';
import { ScrollArea } from '~/components/ui/scroll-area';
import { TableBody, TableCell, TableHead, TableHeader, TableRow, Table as UITable } from '~/components/ui/table';
import { useIsMobile } from '~/hooks/use-mobile';
import { cn } from '~/lib/utils';
import { DEFAULT_PAGE_LIMIT } from '~/store/useTableStore';

/** Блок мобильного списка: необязательный заголовок и строки, которые лежат на одной карточке. */
export interface MobileRowGroup<TData> {
  key: string;
  header?: ReactNode;
  rows: Row<TData>[];
}

interface DataTableProps<TData> {
  table: Table<TData>;
  pinLastColumn?: boolean;
  isLoading?: boolean;
  /** Dims current rows while the next page/filter result is in flight (keepPreviousData) */
  isFetching?: boolean;
  isError?: boolean;
  /**
   * Устройство офлайн и список ни разу не грузился (fetchStatus === 'paused'
   * на первом запросе) — рисуем "нет интернета" вместо обычного EmptyState,
   * чтобы это не читалось как "записей нет".
   */
  isOfflineEmpty?: boolean;
  page?: number;
  limit?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (size: number) => void;
  /**
   * Полностью кастомная мобильная карточка для конкретной таблицы (напр.
   * товары — фото на фон, показатели здоровья остатка). Обязательна: каждая
   * таблица в приложении рисует свою карточку, а generic-раскладка, которая
   * раньше использовалась как запасной вариант, была недостижимым кодом.
   */
  renderMobileCard: (row: Row<TData>) => ReactNode;
  /**
   * Ссылка на страницу деталей строки. Если задана, вся мобильная карточка
   * становится тапабельной.
   *
   * Почему ссылка, а не `onRowClick`: карточка ведёт на конкретный URL, и
   * настоящий `<a>` даёт то, чего обработчик клика не даёт — долгое нажатие с
   * системным меню, открытие в новом окне, предпросмотр URL, попадание в
   * навигацию скринридера. `state` нужен странице деталей для хлебной крошки
   * «назад» (`fromPath`/`fromName`) — тот же объект, что и у ссылки «Просмотр»
   * в колонке действий.
   *
   * Реализовано оверлеем (`absolute inset-0`), а не обёрткой карточки в
   * `<Link>`: внутри карточки живут кнопки и dropdown действий, а
   * интерактивные элементы внутри `<a>` — невалидная вложенность, которая
   * ломает и клавиатуру, и скринридеры.
   */
  getRowLink?: (row: Row<TData>) => { to: string; state?: unknown } | undefined;
  /**
   * iOS-свайп влево по мобильной строке. Пустой массив/undefined — строка без
   * жеста. Кнопки обязаны быть уже отфильтрованы по правам (`useCan`).
   */
  getSwipeActions?: (row: Row<TData>) => SwipeAction[] | undefined;
  /**
   * Разбивает мобильный список на блоки (например, по дням): у каждого свой
   * заголовок и своя карточка. Без пропса весь список — одна карточка, как раньше.
   */
  getMobileGroups?: (rows: Row<TData>[]) => MobileRowGroup<TData>[];
}

export function DataTable<TData>({
  table,
  pinLastColumn,
  isLoading,
  isFetching,
  isError,
  isOfflineEmpty,
  page = 1,
  limit = DEFAULT_PAGE_LIMIT,
  totalPages = 1,
  onPageChange,
  onLimitChange,
  renderMobileCard,
  getRowLink,
  getSwipeActions,
  getMobileGroups,
}: DataTableProps<TData>) {
  const { t } = useTranslation('common');
  const { t: tSync } = useTranslation('sync');
  const visibleColumns = table.getVisibleLeafColumns();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <div
          className={cn(
            'flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto transition-opacity duration-200',
            isFetching && !isLoading && 'pointer-events-none opacity-60'
          )}>
          {isLoading ? (
            <DataTableMobileSkeleton limit={limit} />
          ) : isError ? (
            <DataTableErrorBlock message={t('table.error')} />
          ) : isOfflineEmpty ? (
            <DataTableOfflineBlock
              message={t('offline.noCachedData')}
              actionLabel={tSync('offlineHint.action')}
              compact
            />
          ) : table.getRowModel().rows.length === 0 ? (
            <EmptyState />
          ) : (
            // Строки блока — одна сгруппированная карточка с разделителями с отступом
            // слева (как в iOS «Настройках»), а не стопка отдельных карточек.
            // Без `getMobileGroups` весь список — один такой блок.
            <div className="flex shrink-0 flex-col gap-4">
              {(getMobileGroups?.(table.getRowModel().rows) ?? [{ key: 'all', rows: table.getRowModel().rows }]).map(
                (group, groupIndex, groups) => {
                  // Сквозной номер строки на всю страницу — от него зависит задержка появления.
                  const offset = groups.slice(0, groupIndex).reduce((sum, g) => sum + g.rows.length, 0);
                  return (
                    <section key={group.key}>
                      {group.header}
                      <div className="bg-card overflow-hidden rounded-2xl">
                        {group.rows.map((row, rowIndex) => {
                          const index = offset + rowIndex;
                          const link = getRowLink?.(row);
                          const card = renderMobileCard(row);
                          const swipeActions = getSwipeActions?.(row);
                          const content = (
                            <>
                              {link && (
                                <Link
                                  to={link.to}
                                  state={link.state}
                                  aria-label={t('actions.view')}
                                  draggable={false}
                                  // z-1: шапка строки и её кнопка действий позиционированы
                                  // (relative), без слоя оверлей уходил бы под них; кнопки
                                  // действий внутри строки поднимаются выше (z-2), чтобы ⋮
                                  // оставался нажимаемым. active — iOS-подсветка нажатия.
                                  className="focus-visible:ring-ring/50 active:bg-muted/70 absolute inset-0 z-1 transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
                                />
                              )}
                              {card}
                            </>
                          );

                          return (
                            <motion.div
                              key={row.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.28, ease: 'easeOut', delay: Math.min(index, 11) * 0.04 }}
                              className="not-last:after:bg-border relative not-last:after:absolute not-last:after:right-0 not-last:after:bottom-0 not-last:after:left-[72px] not-last:after:h-px not-last:after:content-['']">
                              {swipeActions && swipeActions.length > 0 ? (
                                <SwipeableRow actions={swipeActions}>{content}</SwipeableRow>
                              ) : (
                                content
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </section>
                  );
                }
              )}
            </div>
          )}
        </div>
        {onPageChange && onLimitChange && (
          <DataTablePagination
            page={page}
            limit={limit}
            totalPages={totalPages}
            onPageChange={onPageChange}
            onLimitChange={onLimitChange}
            t={t}
            compact
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div
        className={cn(
          'bg-card relative min-h-0 flex-1 overflow-hidden rounded-2xl shadow-sm transition-opacity duration-200',
          isFetching && !isLoading && 'pointer-events-none opacity-60'
        )}>
        <ScrollArea className="absolute inset-0">
          <UITable>
            <TableHeader className="bg-card sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header, index) => (
                    <TableHead
                      key={header.id}
                      className={cn(
                        index === headerGroup.headers.length - 1 &&
                          pinLastColumn &&
                          'bg-card sticky right-0 z-10 w-20 min-w-20 border-l shadow-[-4px_0_8px_rgba(0,0,0,0.06)]'
                      )}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <DataTableDesktopSkeletonRows
                  limit={limit}
                  columnCount={visibleColumns.length}
                  pinLastColumn={pinLastColumn}
                />
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length}>
                    <DataTableErrorBlock message={t('table.error')} />
                  </TableCell>
                </TableRow>
              ) : isOfflineEmpty ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length}>
                    <DataTableOfflineBlock
                      message={t('offline.noCachedData')}
                      actionLabel={tSync('offlineHint.action')}
                    />
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length}>
                    <EmptyState />
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell, index) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          index === row.getVisibleCells().length - 1 &&
                            pinLastColumn &&
                            'bg-card sticky right-0 z-10 w-20 min-w-20 border-l shadow-[-4px_0_8px_rgba(0,0,0,0.06)]'
                        )}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </UITable>
        </ScrollArea>
      </div>
      {onPageChange && onLimitChange && (
        <DataTablePagination
          page={page}
          limit={limit}
          totalPages={totalPages}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
          t={t}
        />
      )}
    </div>
  );
}
