import * as React from 'react';
import type { ReactElement, ReactNode } from 'react';
import { MoreVertical } from 'lucide-react';
import { useIsMobile } from '~/hooks/use-mobile';
import { cn } from '~/lib/utils';
import { Button } from '~/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '~/components/ui/dropdown-menu';
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

/**
 * Десктоп: ряд отдельных icon-кнопок, как раньше.
 * Мобильный, если действий больше одного: схлопываем в один kebab (⋮) —
 * иначе на узкой карточке 2-3 крошечные иконки впритык друг к другу выглядят
 * тесно и промахиваться пальцем легко. Один вариант действия (напр. только
 * "просмотр") в меню сворачивать смысла нет — оставляем как обычную кнопку.
 *
 * Ничего не меняем в местах вызова (7 файлов columns.tsx) — они как передавали
 * <IconActionButton/> детьми, так и передают; решение "меню или ряд" целиком
 * внутри этого компонента.
 */
export function RowActionsCell({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const items = React.Children.toArray(children).filter(
    (child): child is ReactElement<IconActionButtonProps> => React.isValidElement(child)
  );

  if (isMobile && items.length > 1) {
    return (
      <div onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" className="h-8 w-8">
                <MoreVertical className="size-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-44">
            {items.map((item, i) => {
              const { icon, label, onClick, render, danger, disabled } = item.props;
              return (
                <DropdownMenuItem
                  key={i}
                  variant={danger ? 'destructive' : 'default'}
                  disabled={disabled}
                  onClick={onClick}
                  render={render}>
                  {icon}
                  <span className="truncate">{label}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return <div className="flex justify-end gap-1">{children}</div>;
}
