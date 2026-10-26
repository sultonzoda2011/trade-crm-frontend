import { CustomSelect } from '~/components/shared/CustomSelect';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '~/components/ui/pagination';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { cn } from '~/lib/utils';

function getPages(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | 'ellipsis')[] = [1];
  if (current > 3) pages.push('ellipsis');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
  if (current < total - 2) pages.push('ellipsis');
  pages.push(total);
  return pages;
}

export interface DataTablePaginationProps {
  page: number;
  limit: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLimitChange: (size: number) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
  compact?: boolean;
}

export function DataTablePagination({
  page,
  limit,
  totalPages,
  onPageChange,
  onLimitChange,
  t,
  compact,
}: DataTablePaginationProps) {
  const pages = getPages(page, totalPages || 1);
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
