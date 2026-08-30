import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from '~/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import type { UserInfo } from '~/types/users';

/** Сколько аватарок показываем до счётчика «+N». */
const VISIBLE_LIMIT = 3;

/**
 * Продавцы, продававшие товар: до трёх аватарок + «+N», полный список — в
 * тултипе.
 *
 * Компонент был объявлен дважды — в `markets/id/route.tsx` и в
 * `my-market/route.tsx` — с косметическими различиями (`seller.image &&` против
 * тернарника). Одна копия здесь.
 */
export function SellerAvatars({ sellers }: { sellers: UserInfo[] }) {
  if (sellers.length === 0) {
    return null;
  }

  const visibleSellers = sellers.slice(0, VISIBLE_LIMIT);
  const remainingCount = sellers.length - visibleSellers.length;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <AvatarGroup data-size="sm">
            {visibleSellers.map((seller) => (
              <Avatar key={seller.id} size="sm">
                {seller.image && <AvatarImage src={seller.image} alt={seller.name} />}
                <AvatarFallback>{seller.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            ))}

            {remainingCount > 0 && <AvatarGroupCount>+{remainingCount}</AvatarGroupCount>}
          </AvatarGroup>
        }
      />

      <TooltipContent side="top">{sellers.map((seller) => seller.name).join(', ')}</TooltipContent>
    </Tooltip>
  );
}
