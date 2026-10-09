import { useMemo } from 'react';
import { useLocation } from 'react-router';
import { getSidebarConfig, getVisibleNavigation, type NavItem, PRIMARY_ORDER, PRIMARY_SLOTS } from '~/config/navigation';
import { useCan } from '~/hooks/useCan';
import { useTranslation } from 'react-i18next';

/**
 * Вычисляет предыдущий и следующий URL среди видимых вкладок нижней навигации,
 * исходя из текущего pathname. Используется для свайп-перехода между вкладками.
 *
 * Возвращает null, если текущая страница не является корневым роутом таба
 * (например, /transactions/123 или /transactions/create).
 */
export function useTabNeighbors() {
  const { t } = useTranslation();
  const { can, user } = useCan();
  const { pathname } = useLocation();

  return useMemo(() => {
    const navConfig = getSidebarConfig(t, user?.marketId);
    const visibleItems = getVisibleNavigation(navConfig, can);

    // Берём только PRIMARY_SLOTS вкладок — те, что показаны в BottomNav
    const byKey = new Map(visibleItems.map((item) => [item.key, item]));
    const primaryItems: NavItem[] = [];
    for (const key of PRIMARY_ORDER) {
      const item = byKey.get(key);
      if (item) primaryItems.push(item);
      if (primaryItems.length === PRIMARY_SLOTS) break;
    }

    // Находим индекс текущей вкладки — только если pathname точно совпадает
    // с корнем таба (не /transactions/123, не /dashboard/inventory)
    const currentIndex = primaryItems.findIndex((item) => {
      if (!item.url) return false;
      // Dashboard — особый случай: все /dashboard/* относятся к одной вкладке
      if (item.key === 'dashboard') return pathname.startsWith('/dashboard');
      // Для остальных — строгое совпадение с корнем
      return pathname === item.url;
    });

    if (currentIndex === -1) return { prevUrl: null, nextUrl: null };

    const prevUrl = currentIndex > 0 ? (primaryItems[currentIndex - 1].url ?? null) : null;
    const nextUrl = currentIndex < primaryItems.length - 1 ? (primaryItems[currentIndex + 1].url ?? null) : null;

    return { prevUrl, nextUrl };
  }, [t, can, user?.marketId, pathname]);
}
