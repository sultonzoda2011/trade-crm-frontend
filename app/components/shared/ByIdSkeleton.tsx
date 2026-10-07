import { Skeleton } from '~/components/ui/skeleton';

/** Заглушка страницы «по id» повторяет её форму: цепочка, шапка с показателями, две группы строк. */
export function ByIdSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 pb-6">
      <Skeleton className="h-6 w-40 rounded-full" />

      <div className="bg-card rounded-2xl p-4 sm:p-5">
        <div className="flex items-start gap-4">
          <Skeleton className="size-14 rounded-2xl" />
          <div className="flex-1 space-y-2 pt-1">
            <Skeleton className="h-6 w-48 max-w-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="size-9 rounded-full" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 border-t pt-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="space-y-5">
          {[4, 3].map((rows, group) => (
            <div key={group} className="space-y-1.5">
              <Skeleton className="ml-4 h-3 w-24" />
              <div className="bg-card divide-border divide-y overflow-hidden rounded-2xl">
                {Array.from({ length: rows }).map((_, i) => (
                  <div key={i} className="flex min-h-12 items-center justify-between gap-4 px-4">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="hidden space-y-1.5 lg:block">
          <Skeleton className="ml-4 h-3 w-20" />
          <div className="bg-card overflow-hidden rounded-2xl">
            <div className="flex min-h-14 items-center gap-3 px-4">
              <Skeleton className="size-8 rounded-lg" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
