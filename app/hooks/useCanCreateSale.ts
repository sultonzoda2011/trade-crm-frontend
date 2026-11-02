import { useQuery } from '@tanstack/react-query';
import { profileApi } from '~/api/profile';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { queryKeys } from '~/lib/query-keys';
import { Role } from '~/types/common';

/**
 * Можно ли записывать обычную продажу (наличные/карта), а не только долг.
 *
 * Админ и владелец — всегда. Продавец — только если владелец включил на рынке
 * «Продавцы могут продавать» (`Market.allowSellerSales`). Флаг берём из
 * `/profile/full`: этот ответ уже лежит в кеше (его сохраняет офлайн-синхронизация),
 * поэтому без сети экран продажи знает правило, а не гадает.
 *
 * Пока флаг неизвестен (профиль не грузился), продавцу показываем только долг:
 * лучше скрыть лишнее, чем предложить действие, которое сервер отклонит.
 * Сервер всё равно проверяет правило на каждой продаже (`SELLER_SALES_DISABLED`).
 */
export function useCanCreateSale(): boolean {
  const { can, role } = useCan();
  const staff = can(Action.TRANSACTIONS_CREATE_SALE);

  const { data } = useQuery({
    queryKey: queryKeys.profile(),
    queryFn: () => profileApi.getFullProfile(),
    enabled: role === Role.Seller,
    staleTime: 30_000,
  });

  if (staff) return true;
  return role === Role.Seller && data?.data?.market?.allowSellerSales === true;
}
