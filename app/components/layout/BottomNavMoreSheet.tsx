import { ChevronRight, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '~/components/ui/sheet';
import type { NavItem } from '~/config/navigation';
import { cn } from '~/lib/utils';

interface BottomNavMoreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  items: NavItem[];
  isPathActive: (url?: string) => boolean;
}

export function BottomNavMoreSheet({
  open,
  onOpenChange,
  title,
  items,
  isPathActive,
}: BottomNavMoreSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="gap-0 bg-transparent shadow-none data-[side=bottom]:inset-x-3 data-[side=bottom]:bottom-[calc(0.75rem+env(safe-area-inset-bottom))] data-[side=bottom]:border-t-0 data-[side=bottom]:pb-0">
        <div className="liquid-glass relative flex max-h-[75dvh] flex-col overflow-hidden rounded-[2rem]">
          {/* Ручка лежит поверх общей зоны захвата шторки (её перекрывает стекло), поэтому сама — зона перетаскивания. */}
          <div data-sheet-drag aria-hidden className="mx-auto flex w-full shrink-0 touch-none justify-center pt-2.5 pb-1">
            <div className="bg-foreground/25 h-1 w-9 rounded-full" />
          </div>
          <SheetHeader className="px-5 pt-2 pb-3">
            <SheetTitle className="text-center text-base font-semibold">{title}</SheetTitle>
          </SheetHeader>
          <div className="relative min-h-0 overflow-y-auto px-3 pb-3">
            <ul className="bg-foreground/[0.05] divide-foreground/10 divide-y overflow-hidden rounded-3xl">
              {items.map((item) => {
                const Icon = item.icon as LucideIcon | undefined;
                const active = isPathActive(item.url);
                return (
                  <li key={item.key}>
                    <Link
                      to={item.url || '#'}
                      onClick={() => onOpenChange(false)}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'active:bg-foreground/10 flex h-14 touch-manipulation items-center gap-3 px-3.5 text-base transition-colors [-webkit-tap-highlight-color:transparent]',
                        active && 'text-primary font-semibold'
                      )}>
                      {Icon && (
                        <span
                          className={cn(
                            'grid size-9 shrink-0 place-items-center',
                            active ? 'text-primary' : 'text-muted-foreground'
                          )}>
                          <Icon aria-hidden className="size-[18px]" />
                        </span>
                      )}
                      <span className="min-w-0 flex-1 break-words">{item.title}</span>
                      <ChevronRight aria-hidden className="text-muted-foreground/70 size-5 shrink-0" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
