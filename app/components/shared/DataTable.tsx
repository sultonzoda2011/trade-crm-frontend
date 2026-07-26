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
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { TableBody, TableCell, TableHead, TableHeader, TableRow, Table as UITable } from '~/components/ui/table';
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
  onlimitChange?: (size: number) => void;
  getRowClassName?: (row: Row<TData>) => string;
  onRowClick?: (row: Row<TData>) => void;
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
  onlimitChange,
  t,
}: {
  page: number;
  limit: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onlimitChange: (size: number) => void;
  t: (key: string) => string;
}) {
  const pages = getpages(page, totalPages || 1);

  return (
    <div className="flex w-full flex-row items-center justify-between gap-2 overflow-x-auto px-3 py-2">
      <div className="text-muted-foreground flex shrink-0 items-center gap-2 text-sm">
        <span className="hidden sm:inline">{t('table.list')}</span>
        <CustomSelect
          value={limit}
          options={[10, 20, 50].map((size) => ({ value: size, label: size.toString() }))}
          onChange={(v) => onlimitChange(Number(v))}
          className="w-[70px]"
          isClearable={false}
        />
      </div>
      <Pagination className="mx-0 w-auto">
        <PaginationContent className="flex-nowrap gap-0.5">
          <PaginationItem>
            <Tooltip>
              <TooltipTrigger render={
                <PaginationPrevious
                  onClick={() => onPageChange(Math.max(1, page - 1))}
                  text=""
                  className={cn('size-8', page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer')}
                />
              } />
              <TooltipContent side="top">{t('table.previousPage')}</TooltipContent>
            </Tooltip>
          </PaginationItem>
          {pages.map((page, i) =>
            page === 'ellipsis' ? (
              <PaginationItem key={`e-${i}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={page}>
                <PaginationLink
                  isActive={page === page}
                  onClick={() => onPageChange(page)}
                  className="size-8 cursor-pointer tabular-nums">
                  {page}
                </PaginationLink>
              </PaginationItem>
            )
          )}
          <PaginationItem>
            <Tooltip>
              <TooltipTrigger render={
                <PaginationNext
                  onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                  text=""
                  className={cn('size-8', page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer')}
                />
              } />
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
  onlimitChange,
  getRowClassName,
  onRowClick,
}: DataTableProps<TData>) {
  const { t } = useTranslation('common');
  const visibleColumns = table.getVisibleLeafColumns();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div
        className={cn(
          'bg-card relative min-h-0 flex-1 overflow-hidden rounded-xl border transition-opacity duration-200',
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
                        index === 0 && pinFirstColumn && 'bg-card sticky left-0 z-10 shadow-[2px_0_0_0_rgba(0,0,0,0.06)]',
                        index === headerGroup.headers.length - 1 &&
                          pinLastColumn &&
                          'bg-card sticky right-0 z-10 w-[80px] min-w-[80px] border-l shadow-[-4px_0_8px_rgba(0,0,0,0.06)]'
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
                            isFirst && pinFirstColumn && 'bg-card sticky left-0 z-10 shadow-[2px_0_0_0_rgba(0,0,0,0.06)]',
                            isLastPinned &&
                              'bg-card sticky right-0 z-10 w-[80px] min-w-[80px] border-l shadow-[-4px_0_8px_rgba(0,0,0,0.06)]'
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
                      <p className="text-sm">{t('table.error', { defaultValue: 'Ошибка загрузки данных' })}</p>
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
                            'bg-card sticky right-0 z-10 w-[80px] min-w-[80px] border-l shadow-[-4px_0_8px_rgba(0,0,0,0.06)]'
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
      {onPageChange && onlimitChange && (
        <PageControls
          page={page}
          limit={limit}
          totalPages={totalPages}
          onPageChange={onPageChange}
          onlimitChange={onlimitChange}
          t={t}
        />
      )}
    </div>
  );
}
