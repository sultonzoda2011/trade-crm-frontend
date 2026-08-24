import { type Row, type Table, flexRender } from '@tanstack/react-table';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CustomSelect } from '~/components/shared/CustomSelect';
import { EmptyState } from '~/components/shared/EmptyState';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '~/components/ui/pagination';
import { ScrollArea } from '~/components/ui/scroll-area';
import { Skeleton } from '~/components/ui/skeleton';
import { TableBody, TableCell, TableHead, TableHeader, TableRow, Table as UITable } from '~/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { useIsMobile } from '~/hooks/use-mobile';
import { cn } from '~/lib/utils';

interface DataTableProps<TData> {
  table: Table<TData>;
  pinFirstColumn?: boolean;
  pinLastColumn?: boolean;
  isLoading?: boolean;
  /** Dims current rows while the next page/filter result is in flight (keepPreviousData) */
  isFetching?: boolean;
  isError?: boolean;
  page?: number;
  limit?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (size: number) => void;
  getRowClassName?: (row: Row<TData>) => string;
  onRowClick?: (row: Row<TData>) => void;
  /**
   * Приоритет полей в мобильной карточке (id колонки → уровень).
   * Первая колонка (обычно имя/аватар) — уже всегда шапка карточки, сюда её
   * добавлять не нужно. Всё, что не перечислено, на карточке не показывается
   * (доступно на странице деталей записи). Не передан вовсе — старое
   * поведение (показать все колонки компактным списком), чтобы не ломать
   * таблицы, для которых приоритет ещё не расписан.
   */
  mobileFields?: Record<string, 'primary' | 'secondary'>;
}

function getpages(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | 'ellipsis')[] = [1];
  if (current > 3) pages.push('ellipsis');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
  if (current < total - 2) pages.push('ellipsis');
  pages.push(total);
  return pages;
}

function PageControls({
  page,
  limit,
  totalPages,
  onPageChange,
  onLimitChange,
  t,
  compact,
}: {
  page: number;
  limit: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLimitChange: (size: number) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
  compact?: boolean;
}) {
  const pages = getpages(page, totalPages || 1);

  return (
    <div className="flex w-full flex-row items-center justify-between gap-2 px-3 py-2">
      <div className="text-muted-foreground flex shrink-0 items-center gap-2 text-sm">
        <span className="hidden sm:inline">{t('table.list')}</span>
        <CustomSelect
          value={limit}
          options={[10, 20, 50].map((size) => ({ value: size, label: size.toString() }))}
          onChange={(v) => onLimitChange(Number(v))}
          className="w-17.5"
          isClearable={false}
        />
      </div>
      <Pagination className="mx-0 w-auto">
        <PaginationContent className="flex-nowrap gap-0.5">
          <PaginationItem>
            <Tooltip>
              <TooltipTrigger
                render={
                  <PaginationPrevious
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                    text=""
                    className={cn('size-8', page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer')}
                  />
                }
              />
              <TooltipContent side="top">{t('table.previousPage')}</TooltipContent>
            </Tooltip>
          </PaginationItem>
          {compact ? (
            <PaginationItem>
              <span className="text-muted-foreground px-1 text-sm whitespace-nowrap tabular-nums">
                {t('table.pageOf', { page, total: totalPages || 1 })}
              </span>
            </PaginationItem>
          ) : (
            pages.map((pageNumber, i) =>
              pageNumber === 'ellipsis' ? (
                <PaginationItem key={`e-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    isActive={pageNumber === page}
                    onClick={() => onPageChange(pageNumber)}
                    className="size-8 cursor-pointer tabular-nums">
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              )
            )
          )}
          <PaginationItem>
            <Tooltip>
              <TooltipTrigger
                render={
                  <PaginationNext
                    onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                    text=""
                    className={cn('size-8', page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer')}
                  />
                }
              />
              <TooltipContent side="top">{t('table.nextPage')}</TooltipContent>
            </Tooltip>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

export function DataTable<TData>({
  table,
  pinFirstColumn,
  pinLastColumn,
  isLoading,
  isFetching,
  isError,
  page = 1,
  limit = 10,
  totalPages = 1,
  onPageChange,
  onLimitChange,
  getRowClassName,
  onRowClick,
  mobileFields,
}: DataTableProps<TData>) {
  const { t } = useTranslation('common');
  const visibleColumns = table.getVisibleLeafColumns();
  const isMobile = useIsMobile();

  // Первая колонка обычно чекбокс/аватар без заголовка, последняя — действия
  // (пиновая, pinLastColumn) — их в карточке не показываем отдельной строкой,
  // они уже есть как заголовок карточки/кнопка действий.
  const cardColumns = visibleColumns.filter((col) => {
    const header = col.columnDef.header;
    return typeof header === 'string' ? header.trim().length > 0 : true;
  });

  if (isMobile) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <div
          className={cn(
            'flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto transition-opacity duration-200',
            isFetching && !isLoading && 'pointer-events-none opacity-60'
          )}>
          {isLoading ? (
            Array.from({ length: Math.min(limit, 6) }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full shrink-0 rounded-xl" />
            ))
          ) : isError ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-12">
              <AlertCircle className="text-destructive h-8 w-8" />
              <p className="text-sm">{t('table.error')}</p>
            </div>
          ) : table.getRowModel().rows.length === 0 ? (
            <EmptyState />
          ) : (
            table.getRowModel().rows.map((row) => {
              const cells = row.getVisibleCells().filter((cell) => cardColumns.includes(cell.column));
              const lastCell = pinLastColumn ? row.getVisibleCells().at(-1) : undefined;
              const bodyCells = cells.filter((cell) => !(lastCell && cell.id === lastCell.id));

              // Пустые значения (напр. "Должник" у сделки без должника) не
              // показываем вовсе — иначе на карточке остаётся лейбл без
              // значения, который выглядит как незаполненные/битые данные.
              const isFilled = (cell: (typeof bodyCells)[number]) => {
                const accessorKey = (cell.column.columnDef as { accessorKey?: string }).accessorKey;
                if (!accessorKey) return true;
                const raw = cell.getValue();
                return !(raw === null || raw === undefined || raw === '');
              };

              // Первая колонка (обычно UserAvatar с именем) — всегда шапка
              // карточки, не строка списка. Остальные раскладываются по
              // приоритету: primary — крупный чип-ряд, secondary — компактная
              // сетка 2 колонки, всё, чего нет в mobileFields — скрыто (доступно
              // на странице деталей). mobileFields не задан вовсе — старое
              // поведение (все колонки одним списком), чтобы не ломать таблицы,
              // для которых приоритет ещё не расписан.
              const [headerCell, ...restCells] = bodyCells;
              const filledRest = restCells.filter(isFilled);
              const primaryCells = mobileFields
                ? filledRest.filter((cell) => mobileFields[cell.column.id] === 'primary')
                : [];
              const secondaryCells = mobileFields
                ? filledRest.filter((cell) => mobileFields[cell.column.id] === 'secondary')
                : filledRest;

              return (
                <div
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'bg-card min-h-11 shrink-0 rounded-xl border p-3 shadow-sm',
                    onRowClick && 'active:bg-muted/50 cursor-pointer',
                    getRowClassName?.(row)
                  )}>
                  <div className="flex items-start justify-between gap-2">
                    {headerCell && (
                      <div className="min-w-0 flex-1">
                        {flexRender(headerCell.column.columnDef.cell, headerCell.getContext())}
                      </div>
                    )}
                    {lastCell && (
                      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                        {flexRender(lastCell.column.columnDef.cell, lastCell.getContext())}
                      </div>
                    )}
                  </div>

                  {primaryCells.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                      {primaryCells.map((cell) => (
                        <span key={cell.id} className="min-w-0 truncate text-sm font-semibold">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </span>
                      ))}
                    </div>
                  )}

                  {secondaryCells.length > 0 && (
                    <div
                      className={cn(
                        'grid grid-cols-2 gap-x-3 gap-y-1',
                        primaryCells.length > 0 ? 'border-border/60 mt-2 border-t pt-2' : 'mt-2'
                      )}>
                      {secondaryCells.map((cell) => {
                        const header = cell.column.columnDef.header;
                        const label = typeof header === 'string' ? header : undefined;
                        return (
                          <div key={cell.id} className="min-w-0">
                            {label && <p className="text-muted-foreground text-2xs truncate">{label}</p>}
                            <p className="truncate text-xs">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        {onPageChange && onLimitChange && (
          <PageControls
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
          'bg-card relative min-h-0 flex-1 overflow-hidden rounded-xl border shadow-sm transition-opacity duration-200',
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
                        index === 0 &&
                          pinFirstColumn &&
                          'bg-card sticky left-0 z-10 shadow-[2px_0_0_0_rgba(0,0,0,0.06)]',
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
                Array.from({ length: limit }).map((_, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {visibleColumns.map((_, colIndex) => {
                      const isFirst = colIndex === 0;
                      const isLast = colIndex === visibleColumns.length - 1;
                      const isLastPinned = isLast && pinLastColumn;
                      const widths = ['w-3/4', 'w-1/2', 'w-4/5', 'w-2/3', 'w-3/5', 'w-2/5'];
                      return (
                        <TableCell
                          key={colIndex}
                          className={cn(
                            isFirst &&
                              pinFirstColumn &&
                              'bg-card sticky left-0 z-10 shadow-[2px_0_0_0_rgba(0,0,0,0.06)]',
                            isLastPinned &&
                              'bg-card sticky right-0 z-10 w-20 min-w-20 border-l shadow-[-4px_0_8px_rgba(0,0,0,0.06)]'
                          )}>
                          {isLastPinned ? (
                            <Skeleton className="mx-auto h-7 w-7 rounded-md" />
                          ) : (
                            <Skeleton className={cn('h-4', widths[(rowIndex * 3 + colIndex) % widths.length])} />
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length}>
                    <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-12">
                      <AlertCircle className="text-destructive h-8 w-8" />
                      <p className="text-sm">{t('table.error')}</p>
                    </div>
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
                  <TableRow
                    key={row.id}
                    className={cn(getRowClassName?.(row), onRowClick && 'cursor-pointer')}
                    onClick={() => onRowClick?.(row)}>
                    {row.getVisibleCells().map((cell, index) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          index === 0 &&
                            pinFirstColumn &&
                            'bg-card sticky left-0 z-10 shadow-[2px_0_0_0_rgba(0,0,0,0.06)]',
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
        <PageControls
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
