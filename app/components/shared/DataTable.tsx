import { type Row, type Table, flexRender } from '@tanstack/react-table';
import { AlertCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
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
import { DEFAULT_PAGE_LIMIT } from '~/store/useTableStore';

interface DataTableProps<TData> {
  table: Table<TData>;
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
  // На телефоне при единственной странице панель — просто шум.
  if (compact && (totalPages || 1) <= 1) return null;

  return (
    <div className="flex w-full flex-row items-center justify-between gap-2 px-3 py-2">
      <div className={cn('text-muted-foreground flex shrink-0 items-center gap-2 text-sm', compact && 'hidden')}>
        <span className="sm:inline">{t('table.list')}</span>
        <CustomSelect
          value={limit}
          options={[10, 20, 50].map((size) => ({ value: size, label: size.toString() }))}
          onChange={(v) => onLimitChange(Number(v))}
          className="w-17.5"
          isClearable={false}
        />
      </div>
      <Pagination className={cn('mx-0 w-auto', compact && 'mx-auto')}>
        <PaginationContent className="flex-nowrap gap-0.5">
          <PaginationItem>
            <Tooltip>
              <TooltipTrigger
                render={
                  <PaginationPrevious
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                    text=""
                    className={cn('size-9', page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer')}
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
                    className="size-9 cursor-pointer tabular-nums">
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
                    className={cn('size-9', page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer')}
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
  pinLastColumn,
  isLoading,
  isFetching,
  isError,
  page = 1,
  limit = DEFAULT_PAGE_LIMIT,
  totalPages = 1,
  onPageChange,
  onLimitChange,
  renderMobileCard,
  getRowLink,
}: DataTableProps<TData>) {
  const { t } = useTranslation('common');
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
            <div className="bg-card shrink-0 overflow-hidden rounded-2xl">
              {Array.from({ length: Math.min(limit, 6) }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <Skeleton className="size-11 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-12">
              <AlertCircle className="text-destructive size-8" />
              <p className="text-sm">{t('table.error')}</p>
            </div>
          ) : table.getRowModel().rows.length === 0 ? (
            <EmptyState />
          ) : (
            // Все строки — одна сгруппированная карточка с разделителями с отступом
            // слева (как в iOS «Настройках»), а не стопка отдельных карточек.
            <div className="bg-card shrink-0 overflow-hidden rounded-2xl">
              {table.getRowModel().rows.map((row, index) => {
                const link = getRowLink?.(row);
                const card = renderMobileCard(row);

                return (
                  <div
                    key={row.id}
                    style={{ '--stagger-index': index } as React.CSSProperties}
                    className="animate-card-enter relative not-last:after:absolute not-last:after:right-0 not-last:after:bottom-0 not-last:after:left-[72px] not-last:after:h-px not-last:after:bg-border not-last:after:content-['']">
                    {link && (
                      <Link
                        to={link.to}
                        state={link.state}
                        aria-label={t('actions.view')}
                        // z-1: шапка строки и её кнопка действий позиционированы
                        // (relative), без слоя оверлей уходил бы под них; кнопки
                        // действий внутри строки поднимаются выше (z-2), чтобы ⋮
                        // оставался нажимаемым. active — iOS-подсветка нажатия.
                        className="focus-visible:ring-ring/50 active:bg-muted/70 absolute inset-0 z-1 transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
                      />
                    )}
                    {card}
                  </div>
                );
              })}
            </div>
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
                Array.from({ length: limit }).map((_, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {visibleColumns.map((_, colIndex) => {
                      const isLast = colIndex === visibleColumns.length - 1;
                      const isLastPinned = isLast && pinLastColumn;
                      const widths = ['w-3/4', 'w-1/2', 'w-4/5', 'w-2/3', 'w-3/5', 'w-2/5'];
                      return (
                        <TableCell
                          key={colIndex}
                          className={cn(
                            isLastPinned &&
                              'bg-card sticky right-0 z-10 w-20 min-w-20 border-l shadow-[-4px_0_8px_rgba(0,0,0,0.06)]'
                          )}>
                          {isLastPinned ? (
                            <Skeleton className="mx-auto size-7 rounded-md" />
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
                      <AlertCircle className="text-destructive size-8" />
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
