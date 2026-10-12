import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Action, ACTION_PERMISSIONS } from '~/config/actions';
import { getClientUser } from '~/lib/auth-utils';
import { canSyncEntity, ENTITY_SPECS, getEntityCoverage, type EntityCoverage } from '~/lib/offline-sync';

/**
 * Что из сущностей реально лежит в кеше прямо сейчас. Обновляется по мере того,
 * как идёт синхронизация (кеш пополняется карточка за карточкой), но не чаще
 * раза в 400 мс — иначе страница перерисовывалась бы на каждый загруженный запрос.
 */
export function useCacheCoverage(): EntityCoverage[] {
  const queryClient = useQueryClient();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = undefined;
        setVersion((v) => v + 1);
      }, 400);
    });
    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, [queryClient]);

  return useMemo(() => {
    const user = getClientUser();
    if (!user) return [];
    const ownMarket = Boolean(user.marketId) && ACTION_PERMISSIONS[Action.MARKETS_VIEW_BY_ID].includes(user.role);
    return ENTITY_SPECS.filter(
      (spec) => canSyncEntity(spec, user.role) || (spec.entity === 'markets' && ownMarket)
    ).map((spec) => getEntityCoverage(queryClient, spec));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient, version]);
}
