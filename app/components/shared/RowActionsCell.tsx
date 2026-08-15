import type { ReactElement, ReactNode } from 'react';
import { cn } from '~/lib/utils';
import { Button } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';

interface IconActionButtonProps {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  render?: ReactElement;
  danger?: boolean;
  outline?: boolean;
  disabled?: boolean;
}

export function IconActionButton({ icon, label, onClick, render, danger, outline, disabled }: IconActionButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant={outline ? 'outline' : 'ghost'}
            size="icon"
            className={cn('h-8 w-8', danger && 'text-destructive hover:bg-destructive/10 hover:text-destructive')}
            onClick={onClick}
            disabled={disabled}
            render={render}>
            {icon}
          </Button>
        }
      />
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

export function RowActionsCell({ children }: { children: ReactNode }) {
  return <div className="flex justify-end gap-1">{children}</div>;
}
