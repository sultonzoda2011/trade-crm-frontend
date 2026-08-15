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
        <div className="border-border flex items-center justify-between border-b px-6 py-4">
          {title && <h3 className="leading-none font-semibold tracking-tight">{title}</h3>}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn('p-4', className)}>{children}</div>
    </div>
  );
}
