import { AlertCircle, WifiOff } from 'lucide-react';
import { Link } from 'react-router';
import { Skeleton } from '~/components/ui/skeleton';
import { TableCell, TableRow } from '~/components/ui/table';
import { cn } from '~/lib/utils';

const SKELETON_WIDTHS = ['w-3/4', 'w-1/2', 'w-4/5', 'w-2/3', 'w-3/5', 'w-2/5'];

export function DataTableMobileSkeleton({ limit }: { limit: number }) {
  return (
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
  );
}

export function DataTableDesktopSkeletonRows({
  limit,
  columnCount,
  pinLastColumn,
}: {
  limit: number;
  columnCount: number;
  pinLastColumn?: boolean;
}) {
  return (
    <>
      {Array.from({ length: limit }).map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({ length: columnCount }).map((_, colIndex) => {
            const isLast = colIndex === columnCount - 1;
            const isLastPinned = isLast && pinLastColumn;
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
                  <Skeleton className={cn('h-4', SKELETON_WIDTHS[(rowIndex * 3 + colIndex) % SKELETON_WIDTHS.length])} />
                )}
              </TableCell>
            );
          })}
        </TableRow>
      ))}
    </>
  );
}

export function DataTableErrorBlock({ message }: { message: string }) {
  return (
    <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-12">
      <AlertCircle className="text-destructive size-8" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function DataTableOfflineBlock({
  message,
  actionLabel,
  compact,
}: {
  message: string;
  actionLabel: string;
  compact?: boolean;
}) {
  return (
    <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-12 text-center">
      <WifiOff className="text-muted-foreground/40 size-8" />
      <p className={cn('text-sm', compact ? 'max-w-56' : 'max-w-64')}>{message}</p>
      <Link to="/sync" className="text-primary flex min-h-11 items-center text-sm font-medium">
        {actionLabel}
      </Link>
    </div>
  );
}
