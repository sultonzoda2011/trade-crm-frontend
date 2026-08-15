import type { ReactNode } from 'react';
import { Badge } from '~/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { cn } from '~/lib/utils';
import { EmptyState } from '~/components/shared/EmptyState';
import { PanelViewAll } from '~/components/shared/PanelViewAll';
import { SkeletonList } from '~/components/shared/SkeletonList';

export interface EntityTab {
  value: string;
  label: string;
  count: number;
  isLoading?: boolean;
  badgeClassName?: string;
  isEmpty: boolean;
  emptyMessage: string;
  rows: ReactNode[];
  viewAll?: {
    to: string;
    count: number;
    label: string;
    state?: unknown;
  };
}

interface MarketEntityTabsProps {
  tabs: EntityTab[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  maxHeightClass?: string;
  emptyClassName?: string;
  contentClassName?: string;
  viewAllClassName?: string;
  skeletonCount?: number;
}

export function MarketEntityTabs({
  tabs,
  defaultValue,
  value,
  onValueChange,
  maxHeightClass = 'max-h-64',
  emptyClassName = 'py-6',
  contentClassName = 'mt-2.5',
  viewAllClassName = 'mt-1.5 flex justify-end border-t pt-1.5',
  skeletonCount = 3,
}: MarketEntityTabsProps) {
  return (
    <Tabs defaultValue={defaultValue} value={value} onValueChange={onValueChange}>
      <TabsList className="w-full">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="min-w-0 flex-1">
            <span className="truncate">{tab.label}</span>
            <Badge variant="secondary" className={cn('shrink-0 text-xs font-normal', tab.badgeClassName)}>
              {tab.count}
            </Badge>
          </TabsTrigger>
        ))}
      </TabsList>

      <div className={cn('', contentClassName)}>
        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {tab.isLoading ? (
              <SkeletonList count={skeletonCount} />
            ) : tab.isEmpty ? (
              <EmptyState className={emptyClassName} message={tab.emptyMessage} />
            ) : (
              <div className={cn('scrollbar-thin divide-border divide-y overflow-x-hidden overflow-y-auto', maxHeightClass)}>
                {tab.rows}
              </div>
            )}
            {!tab.isLoading && !tab.isEmpty && tab.viewAll && (
              <div className={viewAllClassName}>
                <PanelViewAll
                  to={tab.viewAll.to}
                  state={tab.viewAll.state}
                  label={tab.viewAll.label}
                  count={tab.viewAll.count}
                />
              </div>
            )}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}
