import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import { canAccess } from '~/config/permissions';
import { getClientUser } from '~/lib/auth-utils';
import { Role } from '~/types/common';

/** Пункт хлебной крошки. `fromHistory` — ссылка ведёт на страницу, с которой сюда пришли по ссылке: «назад» может идти по истории. */
export interface Crumb {
  label: string;
  link?: string;
  fromHistory?: boolean;
}

/** Разделы с карточкой и списком. */
export type CrumbSection = 'users' | 'markets' | 'sellers' | 'products' | 'categories' | 'debtors' | 'transactions';

/**
 * «След» страницы: что она показывает, а не как собирается цепочка.
 * Цепочку, ссылки и доступность собирает `useTrail` — страницы не пишут её руками.
 */
export type Trail =
  | { kind: 'view'; section: CrumbSection; name: string }
  | { kind: 'edit'; section: CrumbSection; id?: string; name: string }
  | { kind: 'create'; section: CrumbSection; title: string; from?: Crumb }
  | { kind: 'profile' }
  | { kind: 'profile-sub'; title: string };

const LIST_PATH: Record<CrumbSection, string> = {
  users: '/users',
  markets: '/markets',
  sellers: '/sellers',
  products: '/products',
  categories: '/categories',
  debtors: '/debtors',
  transactions: '/transactions',
};

/**
 * Страницы, на которые можно вернуться по `fromPath`. Подпись берётся из перевода
 * в момент показа, а не из state — иначе после смены языка осталась бы старая.
 */
const TITLE_BY_PATH: Record<string, { ns: string; key: string }> = {
  '/dashboard': { ns: 'common', key: 'navigation.dashboard' },
  '/dashboard/inventory': { ns: 'common', key: 'navigation.dashboard' },
  '/dashboard/products': { ns: 'common', key: 'navigation.dashboard' },
  '/dashboard/sellers': { ns: 'common', key: 'navigation.dashboard' },
  '/profile': { ns: 'profile', key: 'title' },
  '/users': { ns: 'users', key: 'title' },
  '/markets': { ns: 'markets', key: 'title' },
  '/sellers': { ns: 'sellers', key: 'title' },
  '/products': { ns: 'products', key: 'title' },
  '/categories': { ns: 'categories', key: 'title' },
  '/debtors': { ns: 'debtors', key: 'title' },
  '/transactions': { ns: 'transactions', key: 'title' },
};

const pathOf = (link: string) => link.split('?')[0];

function useCrumbContext() {
  const { t } = useTranslation();
  const { state } = useLocation();
  const role = getClientUser()?.role;
  // Ссылку показываем только туда, куда роль может зайти.
  const allowed = (path: string) => role !== undefined && canAccess(role, path);
  const fromPath = (state as { fromPath?: unknown } | null)?.fromPath;

  // Корень — то, с чего роль начинает работу: у продавца нет дашборда.
  const root: Crumb =
    role === Role.Seller
      ? { label: t('navigation.transactions', { ns: 'common' }), link: '/transactions' }
      : { label: t('navigation.dashboard', { ns: 'common' }), link: '/dashboard' };

  // Список: если пришли со страницы-списка, ведём туда же (с её фильтрами), иначе — на список раздела.
  const listCrumb = (section: CrumbSection): Crumb => {
    if (typeof fromPath === 'string') {
      const { pathname } = new URL(fromPath, 'http://local');
      const title = TITLE_BY_PATH[pathname];
      if (title && allowed(pathname)) {
        return { label: t(title.key, { ns: title.ns }), link: fromPath, fromHistory: true };
      }
    }
    return { label: t('title', { ns: section }), link: LIST_PATH[section] };
  };

  // Убираем пункты, куда роль не может зайти, и дубли одного пути (например, корень и список продавца): остаётся более точный.
  const compose = (chain: Crumb[]): Crumb[] => {
    const shown = chain.filter((c, i) => {
      const path = c.link && pathOf(c.link);
      return i === chain.length - 1 || !path || allowed(path);
    });
    return shown.filter((c, i) => {
      const path = c.link && pathOf(c.link);
      return !path || !shown.slice(i + 1).some((o) => o.link && pathOf(o.link) === path);
    });
  };

  return { t, root, listCrumb, compose };
}

/** Цепочка хлебных крошек для страницы по её «следу». */
export function useTrail(trail: Trail): Crumb[] {
  const { t, root, listCrumb, compose } = useCrumbContext();

  switch (trail.kind) {
    case 'view':
      return compose([root, listCrumb(trail.section), { label: trail.name }]);
    case 'edit':
      return compose([
        root,
        listCrumb(trail.section),
        { label: trail.name, link: trail.id ? `${LIST_PATH[trail.section]}/${trail.id}` : undefined },
        { label: t('actions.edit', { ns: 'common' }) },
      ]);
    case 'create':
      return compose([root, trail.from ?? listCrumb(trail.section), { label: trail.title }]);
    case 'profile':
      return compose([root, { label: t('title', { ns: 'profile' }) }]);
    case 'profile-sub':
      return compose([root, { label: t('title', { ns: 'profile' }), link: '/profile' }, { label: trail.title }]);
  }
}
