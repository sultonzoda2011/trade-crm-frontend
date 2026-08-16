import type { ComponentProps, ReactNode } from 'react';
import { cn } from '~/lib/utils';

interface PanelProps extends ComponentProps<'div'> {
  children: ReactNode;
  className?: string;
  title?: string;
  actions?: ReactNode;
}

export function Panel({ children, className, title, actions, ...rest }: PanelProps) {
  return (
    <div className={cn('bg-sidebar text-card-foreground rounded-xl')} {...rest}>
      {(title || actions) && (
        <div className="border-border flex flex-wrap items-center justify-between gap-2 border-b px-4 py-4 sm:px-6">
          {title && <h3 className="min-w-0 truncate leading-none font-semibold tracking-tight">{title}</h3>}
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn('p-4', className)}>{children}</div>
    </div>
  );
}
