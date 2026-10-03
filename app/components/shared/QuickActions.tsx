import { ChevronRight, type LucideIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { Link } from 'react-router';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';

export interface QuickActionItem {
  key?: string;
  icon: LucideIcon;
  label: string;
  variant?: 'outline' | 'ghost';
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  render?: ComponentProps<typeof Button>['render'];
}

interface QuickActionsProps {
  title: string;
  actions: QuickActionItem[];
}

/**
 * Быстрые действия — сгруппированный список как «Настройки» в iOS: иконка,
 * подпись, шеврон. Строка-ссылка (`render={<Link/>}`) переходит по `to`,
 * остальные вызывают `onClick`.
 */
export function QuickActions({ title, actions }: QuickActionsProps) {
  if (actions.length === 0) return null;

  return (
    <section>
      <h3 className="text-muted-foreground px-4 pb-1.5 text-xs font-medium tracking-wide uppercase">{title}</h3>
      <div className="bg-card divide-border divide-y overflow-hidden rounded-2xl">
        {actions.map(({ key, icon: Icon, label, className, disabled, onClick, render }, i) => {
          const classes = cn(
            'active:bg-muted/70 flex min-h-12 w-full items-center gap-3 px-4 text-left text-base transition-colors disabled:opacity-40',
            className
          );
          const inner = (
            <>
              <Icon className="text-primary size-5 shrink-0" strokeWidth={1.75} />
              <span className="min-w-0 flex-1 truncate">{label}</span>
              <ChevronRight className="text-muted-foreground/50 size-5 shrink-0" />
            </>
          );
          const linkTo = (render as { props?: { to?: string } } | undefined)?.props?.to;
          if (linkTo) {
            return (
              <Link key={key ?? i} to={linkTo} className={classes}>
                {inner}
              </Link>
            );
          }
          return (
            <button key={key ?? i} type="button" onClick={onClick} disabled={disabled} className={classes}>
              {inner}
            </button>
          );
        })}
      </div>
    </section>
  );
}
