import { ChevronRight, MoreHorizontal, Plus, type LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '~/components/ui/sheet';
import { Action } from '~/config/actions';
import { PRIMARY_ORDER, PRIMARY_SLOTS, type NavItem, getSidebarConfig, getVisibleNavigation } from '~/config/navigation';
import { useCan } from '~/hooks/useCan';
import { haptic } from '~/lib/haptics';
import { cn } from '~/lib/utils';

/** Страницы-формы имеют свою sticky-панель действий — плавающая навигация там не нужна. */
const FORM_ROUTE = /\/(create|edit)$/;

/** Высота стеклянной капсулы (px). Под неё рассчитан отступ в (crm)/layout.tsx. */
const CAPSULE_HEIGHT = 64;

type Slot = { kind: 'link'; item: NavItem; active: boolean } | { kind: 'more'; active: boolean } | { kind: 'create' };

/**
 * Прячем панель, пока открыта клавиатура: Capacitor `Keyboard.resize: 'body'`
 * иначе поднимает её над клавиатурой и съедает пол-экрана.
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

const TAB_CLASS =
  'relative z-10 flex h-full min-w-0 flex-1 basis-0 touch-manipulation flex-col items-center justify-center gap-[3px] overflow-hidden rounded-full px-0.5 transition-[transform,filter] duration-200 ease-out select-none active:scale-[0.88] active:brightness-90 [-webkit-tap-highlight-color:transparent]';

function TabFace({ Icon, label, active }: { Icon: LucideIcon; label: string; active: boolean }) {
  const tone = active ? 'text-primary' : 'text-muted-foreground';
  return (
    <>
      {/* Стеклянная «таблетка» переезжает между вкладками пружиной (общий layoutId). */}
      {active && (
        <motion.span
          aria-hidden
          layoutId="bottom-nav-pill"
          transition={{ type: 'spring', stiffness: 460, damping: 34 }}
          className="bg-primary/15 dark:bg-primary/25 absolute inset-0.5 -z-10 rounded-full shadow-[inset_0_1px_1px_rgb(255_255_255/0.75),inset_0_0_0_1px_rgb(255_255_255/0.3),0_1px_3px_rgb(0_0_0/0.06)] dark:shadow-[inset_0_1px_1px_rgb(255_255_255/0.25),inset_0_0_0_1px_rgb(255_255_255/0.08)]"
        />
      )}
      <Icon
        aria-hidden
        className={cn('size-6 shrink-0 transition-colors duration-200', tone)}
        strokeWidth={active ? 2.25 : 1.75}
      />

      <span
        className={cn(
          'block w-full min-w-0 max-w-full truncate text-center text-[10px] leading-[12px] font-medium tracking-tight transition-[color,opacity,transform] duration-300',
          tone,
          active ? 'translate-y-0 opacity-100' : 'opacity-80'
        )}>
        {label}
      </span>
    </>
  );
}

/**
 * Плавающая навигация в стиле iOS 27 «Liquid Glass»: стеклянная капсула с
 * отступами от краёв экрана, активная вкладка подсвечена единой нейтральной
 * «таблеткой», по центру — крупная кнопка «+» (новая транзакция).
 * Список вкладок и «Ещё» берутся из того же getSidebarConfig/getVisibleNavigation,
 * что и десктопный сайдбар — один источник правды на роль пользователя.
 */
export function BottomNav() {
  const { t } = useTranslation();
  const { can, user } = useCan();
  const { pathname } = useLocation();
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

  const isPathActive = (url?: string) => !!url && (pathname === url || pathname.startsWith(`${url}/`));

  const canCreate = can(Action.TRANSACTIONS_CREATE);
  const hidden = keyboardOpen || FORM_ROUTE.test(pathname);
  const moreLabel = t('navigation.more', { defaultValue: 'Ещё' });

  // «+» стоит ровно посередине: вкладки делим пополам вокруг него.
  const tabs: Slot[] = [
    ...primary.map((item): Slot => ({ kind: 'link', item, active: isPathActive(item.url) })),
    ...(rest.length > 0
      ? [{ kind: 'more', active: moreOpen || rest.some((item) => isPathActive(item.url)) } as Slot]
      : []),
  ];
  const middle = canCreate ? Math.ceil(tabs.length / 2) : tabs.length;
  const slots: Slot[] = canCreate ? [...tabs.slice(0, middle), { kind: 'create' }, ...tabs.slice(middle)] : tabs;

  // Короткая подпись, чтобы не вылезала из ячейки: «Панель управления» → «Главная».
  const tabLabel = (item: NavItem) =>
    item.key === 'dashboard' ? t('navigation.home', { defaultValue: item.title }) : item.title;

  const renderSlot = (slot: Slot) => {
    if (slot.kind === 'create') {
      return (
        <div key="create" className="flex min-w-0 flex-1 basis-0 items-center justify-center">
          <Link
            to="/transactions/create"
            onClick={() => haptic('light')}
            aria-label={t('navigation.newTransaction', { defaultValue: 'Новая транзакция' })}
            className="bg-primary text-primary-foreground relative z-10 flex size-14 -translate-y-2.5 touch-manipulation items-center justify-center rounded-full bg-[linear-gradient(to_bottom,rgb(255_255_255/0.28),transparent_55%)] shadow-[0_14px_26px_-7px_rgb(0_0_0/0.48),inset_0_1px_1px_rgb(255_255_255/0.5),inset_0_-2px_5px_rgb(0_0_0/0.25)] transition-[transform,filter] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] select-none [-webkit-tap-highlight-color:transparent] hover:brightness-105 active:scale-[0.84] active:brightness-90">
            <Plus aria-hidden className="size-7" strokeWidth={2.5} />
          </Link>
        </div>
      );
    }
    if (slot.kind === 'more') {
      return (
        <button key="more" type="button" onClick={() => { haptic('selection'); setMoreOpen(true); }} aria-haspopup="dialog" className={TAB_CLASS}>
          <TabFace Icon={MoreHorizontal} label={moreLabel} active={slot.active} />
        </button>
      );
    }
    const { item } = slot;
    return (
      <Link
        key={item.key}
        to={item.url || '#'}
        onClick={() => haptic('selection')}
        aria-current={slot.active ? 'page' : undefined}
        className={TAB_CLASS}>
        <TabFace Icon={item.icon as LucideIcon} label={tabLabel(item)} active={slot.active} />
      </Link>
    );
  };

  return (
    <>
      <nav
        inert={hidden}
        aria-label={t('navigation.bottomNav', { defaultValue: 'Навигация' })}
        className={cn(
          'pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 transition-[transform,opacity] duration-300 ease-out md:hidden',
          hidden && 'translate-y-[160%] opacity-0'
        )}
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) * 0.5 + 12px)' }}>
        <div
          className="liquid-glass pointer-events-auto relative mx-auto max-w-md rounded-full p-1.5"
          style={{ height: CAPSULE_HEIGHT }}>
          <div className="relative flex h-full items-stretch">
            {slots.map(renderSlot)}
          </div>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
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
              <SheetTitle className="text-center text-base font-semibold">{moreLabel}</SheetTitle>
            </SheetHeader>
            <div className="relative min-h-0 overflow-y-auto px-3 pb-3">
              <ul className="bg-foreground/[0.05] divide-foreground/10 divide-y overflow-hidden rounded-3xl">
                {rest.map((item) => {
                  const Icon = item.icon as LucideIcon | undefined;
                  const active = isPathActive(item.url);
                  return (
                    <li key={item.key}>
                      <Link
                        to={item.url || '#'}
                        onClick={() => setMoreOpen(false)}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'active:bg-foreground/10 flex h-14 touch-manipulation items-center gap-3 px-3.5 text-base transition-colors [-webkit-tap-highlight-color:transparent]',
                          active && 'text-primary font-semibold'
                        )}>
                        {Icon && (
                          <span className={cn('grid size-9 shrink-0 place-items-center', active ? 'text-primary' : 'text-muted-foreground')}>
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
    </>
  );
}
