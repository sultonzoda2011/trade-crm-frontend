import { ChevronRight, type LucideIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { Panel } from '~/components/layout/Panel';
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

export function QuickActions({ title, actions }: QuickActionsProps) {
  return (
    <Panel title={title}>
      <div className="space-y-2">
        {actions.map(({ key, icon: Icon, label, variant = 'ghost', className, disabled, onClick, render }, i) => (
          <Button
            key={key ?? i}
            variant={variant}
            className={cn('w-full justify-between gap-2', className)}
            size="sm"
            onClick={onClick}
            disabled={disabled}
            render={render}>
            <span className="flex min-w-0 items-center gap-2">
              <Icon className="size-3.5 shrink-0" />
              <span className="truncate">{label}</span>
            </span>
            <ChevronRight className="text-muted-foreground size-3.5 shrink-0" />
          </Button>
        ))}
      </div>
    </Panel>
  );
}
