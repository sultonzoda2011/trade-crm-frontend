import { MoreHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, useLocation } from 'react-router';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '~/components/ui/sheet';
import { type NavItem, type NavKey, getSidebarConfig, getVisibleNavigation } from '~/config/navigation';
import { useCan } from '~/hooks/useCan';
import { cn } from '~/lib/utils';

/**
 * Порядок приоритета для 4 основных вкладок нижней навигации. Чем раньше в
 * списке — тем выше шанс попасть в панель. Пункты, которых нет у текущей роли
 * (например Dashboard у Seller), просто пропускаются — следующий по приоритету
 * занимает освободившееся место, специального кейса на роль не нужно.
 */
const PRIMARY_ORDER: NavKey[] = ['dashboard', 'transactions', 'debtors', 'products', 'myMarket', 'sellers', 'categories'];
const PRIMARY_SLOTS = 4;

/**
 * Bottom Navigation для Capacitor-приложения на телефоне. Полноценный Sidebar
 * на мобилке остаётся off-canvas (Sheet) и не используется параллельно —
 * см. Header.tsx, где SidebarTrigger скрыт на mobile. Список вкладок и
 * содержимое "Ещё" берутся из того же getSidebarConfig/getVisibleNavigation,
 * что и десктопный сайдбар — один источник правды на роль пользователя.
 */
export function BottomNav() {
  const { t } = useTranslation();
  const { can, user } = useCan();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const navConfig = useMemo(() => getSidebarConfig(t, user?.marketId), [t, user?.marketId]);
  const visibleItems = useMemo(() => getVisibleNavigation(navConfig, can), [navConfig, can]);

  const { primary, rest } = useMemo(() => {
    const byKey = new Map(visibleItems.map((item) => [item.key, item]));
    const primaryItems: NavItem[] = [];
    for (const key of PRIMARY_ORDER) {
      const item = byKey.get(key);
      if (item) primaryItems.push(item);
      if (primaryItems.length === PRIMARY_SLOTS) break;
    }
    const primaryKeys = new Set(primaryItems.map((item) => item.key));
    const restItems = visibleItems.filter((item) => !primaryKeys.has(item.key));
    return { primary: primaryItems, rest: restItems };
  }, [visibleItems]);

  const isMoreActive = rest.some((item) => item.url && location.pathname.startsWith(item.url));

  return (
    <>
      <nav
        className="bg-card/95 border-border/80 fixed inset-x-3 bottom-3 z-30 flex rounded-2xl border pb-[env(safe-area-inset-bottom)] shadow-[0_12px_35px_-18px_rgba(16,33,61,0.55)] backdrop-blur md:hidden"
        aria-label={t('navigation.bottomNav', { defaultValue: 'Навигация' })}>
        {primary.map((item) => (
          <NavLink
            key={item.key}
            to={item.url || '#'}
            end={item.url === '/dashboard'}
            className="flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2">
            {({ isActive }) => (
              <>
                {item.icon && (
                  <item.icon className={cn('size-5', isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/60')} />
                )}
                <span
                  className={cn(
                    'max-w-full truncate px-1 text-2xs',
                    isActive ? 'text-sidebar-primary font-medium' : 'text-sidebar-foreground/60'
                  )}>
                  {item.title}
                </span>
              </>
            )}
          </NavLink>
        ))}
        {rest.length > 0 && (
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2">
            <MoreHorizontal className={cn('size-5', isMoreActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/60')} />
            <span
              className={cn(
                'truncate px-1 text-2xs',
                isMoreActive ? 'text-sidebar-primary font-medium' : 'text-sidebar-foreground/60'
              )}>
              {t('navigation.more', { defaultValue: 'Ещё' })}
            </span>
          </button>
        )}
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="max-h-[75vh]">
          <SheetHeader>
            <SheetTitle>{t('navigation.more', { defaultValue: 'Ещё' })}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 overflow-y-auto px-4 pb-4">
            {rest.map((item) => (
              <Link
                key={item.key}
                to={item.url || '#'}
                onClick={() => setMoreOpen(false)}
                className="hover:bg-sidebar-accent flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm">
                {item.icon && <item.icon className="text-muted-foreground size-4.5" />}
                <span>{item.title}</span>
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
