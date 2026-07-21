import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeftRight,
  BookMarked,
  GraduationCap,
  Loader2,
  Package,
  UserRoundPlus,
  Users,
  Users2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { marketsApi } from '~/api/markets';
import { productsApi } from '~/api/products';
import { usersApi } from '~/api/users';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '~/components/ui/command';
import { Action } from '~/config/actions';
import { getSidebarConfig, getVisibleNavigation, type NavItem } from '~/config/navigation';
import { canAccess } from '~/config/permissions';
import { useCan } from '~/hooks/useCan';
import { useDebounce } from '~/hooks/useDebounce';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PageEntry {
  title: string;
  url: string;
  icon?: NavItem['icon'];
}

const MIN_SEARCH_LENGTH = 2;

/**
 * Global Ctrl+K palette. There is no backend search endpoint — pages are
 * filtered client-side from the sidebar config (RBAC via getVisibleNavigation),
 * entities are searched through the existing paginated list endpoints.
 */
export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { can, role } = useCan();

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query);
  const search = debouncedQuery.trim();
  const searchEnabled = open && search.length >= MIN_SEARCH_LENGTH;

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pages = useMemo(() => {
    const flat: PageEntry[] = [];
    const walk = (items: NavItem[]) => {
      for (const item of items) {
        if (item.url && !item.comingSoon) flat.push({ title: item.title, url: item.url, icon: item.icon });
        if (item.items) walk(item.items);
      }
    };
    walk(getVisibleNavigation(getSidebarConfig(t), can));
    return flat;
  }, [t, role]);

  const filteredPages = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pages;
    return pages.filter((page) => page.title.toLowerCase().includes(q));
  }, [pages, query]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const quickActions = useMemo(
    () =>
      [
        { label: t('palette.createUser'), url: '/users/create', action: Action.USERS_CREATE, icon: UserRoundPlus },
        { label: t('palette.createMarket'), url: '/markets/create', action: Action.MARKETS_CREATE, icon: BookMarked },
        {
          label: t('palette.createProduct'),
          url: '/products/create',
          action: Action.PRODUCTS_CREATE,
          icon: Package,
        },
        {
          label: t('palette.createTransaction'),
          url: '/transactions/create',
          action: Action.TRANSACTIONS_CREATE,
          icon: ArrowLeftRight,
        },
      ].filter((item) => can(item.action)),
    [t, role]
  );

  const filteredActions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return quickActions;
    return quickActions.filter((item) => item.label.toLowerCase().includes(q));
  }, [quickActions, query]);

  const usersQuery = useQuery({
    queryKey: ['palette-users', search],
    queryFn: () => usersApi.getAll(1, 5, [{ key: 'Name', value: search }]),
    enabled: searchEnabled && !!role && canAccess(role, '/users'),
    staleTime: 30_000,
  });

  const marketQuery = useQuery({
    queryKey: ['palette-market', search],
    queryFn: () => marketsApi.getAll(1, 5, [{ key: 'Name', value: search }]),
    enabled: searchEnabled && !!role && canAccess(role, '/market'),
    staleTime: 30_000,
  });

  const productQuery = useQuery({
    queryKey: ['palette-product', search],
    queryFn: () => productsApi.getAll(1, 5, [{ key: 'Name', value: search }]),
    enabled: searchEnabled && !!role && canAccess(role, '/product'),
    staleTime: 30_000,
  });

  const users = searchEnabled ? (usersQuery.data?.data?.data ?? []) : [];
  const markets = searchEnabled ? (marketQuery.data?.data.data ?? []) : [];
  const products = searchEnabled ? (productQuery.data?.data.data ?? []) : [];
  const isSearching = searchEnabled && (usersQuery.isFetching || marketQuery.isFetching || productQuery.isFetching);
  const hasEntityResults = users.length > 0 || markets.length > 0 || products.length > 0;

  const go = (url: string) => {
    onOpenChange(false);
    navigate(url);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      className="top-[15%] sm:top-1/3 sm:max-w-xl"
      title={t('palette.trigger')}>
      <Command shouldFilter={false}>
        <CommandInput value={query} onValueChange={setQuery} placeholder={t('palette.placeholder')} autoFocus />
        <CommandList>
          {!isSearching && filteredPages.length === 0 && filteredActions.length === 0 && !hasEntityResults && (
            <CommandEmpty>{t('palette.empty')}</CommandEmpty>
          )}

          {filteredActions.length > 0 && (
            <CommandGroup heading={t('palette.actions')}>
              {filteredActions.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem key={`action-${item.url}`} value={`action-${item.url}`} onSelect={() => go(item.url)}>
                    <Icon />
                    <span>{item.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          {filteredActions.length > 0 && filteredPages.length > 0 && <CommandSeparator />}

          {filteredPages.length > 0 && (
            <CommandGroup heading={t('palette.pages')}>
              {filteredPages.map((page) => {
                const Icon = page.icon;
                return (
                  <CommandItem key={`page-${page.url}`} value={`page-${page.url}`} onSelect={() => go(page.url)}>
                    {Icon && <Icon />}
                    <span>{page.title}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          {query.trim().length > 0 && query.trim().length < MIN_SEARCH_LENGTH && (
            <p className="text-muted-foreground text-2xs px-3 py-2">{t('palette.searchHint')}</p>
          )}

          {isSearching && (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-4 text-sm">
              <Loader2 className="size-4 animate-spin" />
            </div>
          )}

          {users.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading={t('palette.users')}>
                {users.map((user) => (
                  <CommandItem
                    key={`users-${user.id}`}
                    value={`users-${user.id}`}
                    onSelect={() => go(`/users/${user.id}`)}>
                    <Users />
                    <span className="truncate">{user.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {markets.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading={t('palette.market')}>
                {markets.map((markets) => (
                  <CommandItem
                    key={`markets-${markets.id}`}
                    value={`markets-${markets.id}`}
                    onSelect={() => go(`/markets/${markets.id}`)}>
                    <Users2 />
                    <span className="truncate">{markets.name}</span>
                    <span className="text-muted-foreground text-2xs ml-auto truncate">{markets.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {products.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading={t('palette.product')}>
                {products.map((products) => (
                  <CommandItem
                    key={`products-${products.id}`}
                    value={`products-${products.id}`}
                    onSelect={() => go(`/product/${products.id}`)}>
                    <GraduationCap />
                    <span className="truncate">{products.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
