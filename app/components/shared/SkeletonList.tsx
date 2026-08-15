import { cn } from '~/lib/utils';

interface SkeletonListProps {
  count?: number;
  height?: string;
  className?: string;
}

export function SkeletonList({ count = 3, height = 'h-14', className }: SkeletonListProps) {
  return (
    <div className={cn('space-y-2 py-2', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn('bg-muted/50 animate-pulse rounded-lg', height)} />
      ))}
    </div>
  );
}
