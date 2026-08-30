import { Panel } from '~/components/layout/Panel';
import { Skeleton } from '~/components/ui/skeleton';

export function ByIdSkeleton() {
  return (
    <div className="flex flex-1 flex-col space-y-6 pb-8">
      <Skeleton className="h-4 w-48" />
      <Panel bodyClassName="p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </Panel>
      <Panel bodyClassName="p-6">
        <div className="mb-8 flex justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-40" />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
