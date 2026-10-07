import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
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
  /**
   * `panel` — вкладки и строки внутри одной карточки (профиль).
   * `grouped` — вкладки отдельно, строки в карточке списка iOS с ссылкой
   * «Все (n)» последней строкой (страницы «по id»).
   */
  variant?: 'panel' | 'grouped';
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
  variant = 'panel',
}: MarketEntityTabsProps) {
  const grouped = variant === 'grouped';

  return (
    <Tabs defaultValue={defaultValue} value={value} onValueChange={onValueChange}>
      <TabsList className="w-full">
        {tabs.map((tab) => (
          // На узких экранах вкладки должны прокручиваться горизонтально с
          // шириной по контенту — иначе 4 вкладки в ряд сжимаются до "C... 3".
          // На sm+ хватает места, чтобы растянуть их равномерно.
          <TabsTrigger key={tab.value} value={tab.value} className="sm:min-w-0 sm:flex-1">
            <span>{tab.label}</span>
            <Badge variant="secondary" className={cn('shrink-0 text-xs font-normal', tab.badgeClassName)}>
              {tab.count}
            </Badge>
          </TabsTrigger>
        ))}
      </TabsList>

      <div className={cn(grouped ? 'mt-3' : '', !grouped && contentClassName)}>
        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {grouped ? (
              <div className="bg-card divide-border divide-y overflow-hidden rounded-2xl">
                {tab.isLoading ? (
                  <div className="p-4">
                    <SkeletonList count={skeletonCount} />
                  </div>
                ) : tab.isEmpty ? (
                  <EmptyState className="py-10" message={tab.emptyMessage} />
                ) : (
                  <>
                    {tab.rows}
                    {tab.viewAll && (
                      <Link
                        to={tab.viewAll.to}
                        state={tab.viewAll.state}
                        className="text-primary active:bg-muted/70 flex min-h-12 items-center justify-between px-4 text-base font-medium transition-colors">
                        {tab.viewAll.label} ({tab.viewAll.count})
                        <ChevronRight className="size-5" />
                      </Link>
                    )}
                  </>
                )}
              </div>
            ) : tab.isLoading ? (
              <SkeletonList count={skeletonCount} />
            ) : tab.isEmpty ? (
              <EmptyState className={emptyClassName} message={tab.emptyMessage} />
            ) : (
              <div className={cn('scrollbar-thin divide-border divide-y overflow-x-hidden overflow-y-auto', maxHeightClass)}>
                {tab.rows}
              </div>
            )}
            {!grouped && !tab.isLoading && !tab.isEmpty && tab.viewAll && (
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
