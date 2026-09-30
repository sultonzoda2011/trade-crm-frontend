import { ChevronRight, MoreHorizontal, Plus, type LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, useLocation } from 'react-router';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '~/components/ui/sheet';
import { Action } from '~/config/actions';
import { type NavItem, type NavKey, getSidebarConfig, getVisibleNavigation } from '~/config/navigation';
import { useCan } from '~/hooks/useCan';
import { cn } from '~/lib/utils';

/**
 * Порядок приоритета для основных вкладок. Пункты, которых нет у текущей роли
 * (например Dashboard у Seller), пропускаются — следующий по приоритету
 * занимает место. Вместе с «Ещё» и центральной «+» получается ровно 5 слотов,
 * как в классическом iOS tab bar: 2 вкладки | + | вкладка + «Ещё».
 */
const PRIMARY_ORDER: NavKey[] = [
  'dashboard',
  'transactions',
  'debtors',
  'products',
  'myMarket',
  'sellers',
  'categories',
];
const PRIMARY_SLOTS = 3;

/** Страницы-формы имеют свою sticky-панель действий — таб-бар под ней не нужен. */
const FORM_ROUTE = /\/(create|edit)$/;

/** Как в iOS: высота контента таб-бара 49pt, под ним home-indicator (safe-area). */
const TAB_BAR_HEIGHT = 49;

type Slot = { kind: 'link'; item: NavItem } | { kind: 'more' };

/**
 * iOS прячет таб-бар, когда открыта клавиатура. Capacitor `Keyboard.resize: 'body'`
 * иначе поднимает бар над клавиатурой и съедает пол-экрана, поэтому следим за
 * фокусом на текстовых полях.
 */
function useKeyboardOpen() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const NON_TEXT = new Set(['checkbox', 'radio', 'button', 'submit', 'reset', 'file', 'range', 'color']);
    const isTextField = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return false;
      if (el instanceof HTMLInputElement) return !NON_TEXT.has(el.type);
      return el instanceof HTMLTextAreaElement || el.isContentEditable;
    };
    const onIn = (e: FocusEvent) => setOpen(isTextField(e.target));
    const onOut = () => setOpen(false);
    document.addEventListener('focusin', onIn);
    document.addEventListener('focusout', onOut);
    return () => {
      document.removeEventListener('focusin', onIn);
      document.removeEventListener('focusout', onOut);
    };
  }, []);

  return open;
}

/** Лёгкая вибро-отдача на «+» (Android WebView; в iOS вызов просто игнорируется). */
function haptic() {
  try {
    navigator.vibrate?.(10);
  } catch {
    /* не поддерживается — не страшно */
  }
}

const TAB_CLASS =
  'flex h-full min-w-0 flex-1 touch-manipulation flex-col items-center justify-center gap-0.5 pt-0.5 transition-opacity select-none active:opacity-50 [-webkit-tap-highlight-color:transparent]';

function TabFace({ Icon, label, active }: { Icon: LucideIcon; label: string; active: boolean }) {
  const tone = active ? 'text-foreground' : 'text-muted-foreground';
  return (
    <>
      <Icon aria-hidden className={cn('size-6.5 transition-colors', tone)} strokeWidth={active ? 2.25 : 1.75} />
      <span className={cn('text-2xs max-w-full truncate px-0.5 leading-3 font-medium transition-colors', tone)}>
        {label}
      </span>
    </>
  );
}

/**
 * Нижняя навигация в стиле iOS tab bar: полупрозрачный blur-фон, тонкая линия
 * сверху, 5 равных слотов, по центру — крупная круглая «+» (новая транзакция).
 * Список вкладок и «Ещё» берутся из того же getSidebarConfig/getVisibleNavigation,
 * что и десктопный сайдбар — один источник правды на роль пользователя.
 */
export function BottomNav() {
  const { t } = useTranslation();
  const { can, user } = useCan();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const keyboardOpen = useKeyboardOpen();

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
    return { primary: primaryItems, rest: visibleItems.filter((item) => !primaryKeys.has(item.key)) };
  }, [visibleItems]);

  const canCreate = can(Action.TRANSACTIONS_CREATE);
  const hidden = keyboardOpen || FORM_ROUTE.test(location.pathname);
  const isMoreActive = rest.some((item) => item.url && location.pathname.startsWith(item.url));
  const moreLabel = t('navigation.more', { defaultValue: 'Ещё' });

  // «+» стоит ровно посередине: слоты делим пополам вокруг него.
  const slots: Slot[] = [
    ...primary.map((item): Slot => ({ kind: 'link', item })),
    ...(rest.length > 0 ? [{ kind: 'more' } as Slot] : []),
  ];
  const middle = canCreate ? Math.ceil(slots.length / 2) : slots.length;
  const left = slots.slice(0, middle);
  const right = slots.slice(middle);

  const renderSlot = (slot: Slot) => {
    if (slot.kind === 'more') {
      return (
        <button key="more" type="button" onClick={() => setMoreOpen(true)} aria-haspopup="dialog" className={TAB_CLASS}>
          <TabFace Icon={MoreHorizontal} label={moreLabel} active={isMoreActive || moreOpen} />
        </button>
      );
    }
    const { item } = slot;
    return (
      <NavLink key={item.key} to={item.url || '#'} end={item.url === '/dashboard'} className={TAB_CLASS}>
        {({ isActive }) => <TabFace Icon={item.icon as LucideIcon} label={item.title} active={isActive} />}
      </NavLink>
    );
  };

  return (
    <>
      <nav
        inert={hidden}
        aria-label={t('navigation.bottomNav', { defaultValue: 'Навигация' })}
        className={cn(
          'border-foreground/15 bg-background/95 fixed inset-x-0 bottom-0 z-30 border-t-[0.5px] transition-transform duration-200 ease-out md:hidden',
          'supports-backdrop-filter:bg-background/75 supports-backdrop-filter:backdrop-blur-xl supports-backdrop-filter:backdrop-saturate-150',
          hidden && 'translate-y-full'
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="mx-auto flex max-w-lg items-stretch" style={{ height: TAB_BAR_HEIGHT }}>
          {left.map(renderSlot)}

          {canCreate && (
            <div className="flex min-w-0 flex-1 items-start justify-center">
              <Link
                to="/transactions/create"
                onClick={haptic}
                aria-label={t('navigation.newTransaction', { defaultValue: 'Новая транзакция' })}
                className="bg-primary text-primary-foreground ring-background -mt-4 flex size-14 touch-manipulation items-center justify-center rounded-full shadow-lg ring-4 transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] select-none [-webkit-tap-highlight-color:transparent] active:scale-90">
                <Plus aria-hidden className="size-7" strokeWidth={2.5} />
              </Link>
            </div>
          )}

          {right.map(renderSlot)}
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" showCloseButton={false} className="max-h-[80dvh] gap-0 rounded-t-3xl">
          <div aria-hidden className="bg-foreground/20 mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-full" />
          <SheetHeader className="px-5 pt-3 pb-3">
            <SheetTitle className="text-center text-base font-semibold">{moreLabel}</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 overflow-y-auto px-4 pb-4">
            <ul className="bg-secondary/60 divide-border/70 divide-y overflow-hidden rounded-2xl">
              {rest.map((item) => {
                const Icon = item.icon as LucideIcon | undefined;
                const active = !!item.url && location.pathname.startsWith(item.url);
                return (
                  <li key={item.key}>
                    <Link
                      to={item.url || '#'}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        'active:bg-muted flex h-14 touch-manipulation items-center gap-3 px-3.5 text-base transition-colors [-webkit-tap-highlight-color:transparent]',
                        active && 'font-semibold'
                      )}>
                      {Icon && (
                        <span className="bg-primary text-primary-foreground grid size-8 shrink-0 place-items-center rounded-lg">
                          <Icon aria-hidden className="size-4.5" />
                        </span>
                      )}
                      <span className="min-w-0 flex-1 truncate">{item.title}</span>
                      <ChevronRight aria-hidden className="text-muted-foreground/60 size-5 shrink-0" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}