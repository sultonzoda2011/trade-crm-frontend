import { useState } from 'react';
import { useNavigationType } from 'react-router';

export type RouteDirection = 'forward' | 'back' | 'none';

/** Глубина экрана: `/products` — 1, `/products/123` — 2, `/products/123/edit` — 3. */
function routeDepth(key: string): number {
  return key.split('/').filter(Boolean).length;
}

/**
 * Куда «двигается» навигация, чтобы переход выглядел как в нативном приложении:
 * - `forward` — вглубь (список → карточка → правка): новый экран приезжает справа;
 * - `back` — назад (кнопка «назад», жест, `history.back()`): экран возвращается слева;
 * - `none` — между равноправными разделами (вкладки): без смещения, просто проявление.
 *
 * Направление считается один раз на смену экрана «во время рендера» — это
 * официальный способ вывести состояние из смены пропса, без эффекта и лишнего кадра.
 */
export function useRouteDirection(routeKey: string): RouteDirection {
  const navigationType = useNavigationType();
  const [state, setState] = useState<{ key: string; direction: RouteDirection }>({
    key: routeKey,
    direction: 'none',
  });

  if (state.key !== routeKey) {
    const from = routeDepth(state.key);
    const to = routeDepth(routeKey);
    const direction: RouteDirection =
      navigationType === 'POP' ? 'back' : to > from ? 'forward' : to < from ? 'back' : 'none';
    setState({ key: routeKey, direction });
  }

  return state.direction;
}
