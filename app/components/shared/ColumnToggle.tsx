import { type Table } from '@tanstack/react-table';
import { Eye, EyeOff, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { Label } from '~/components/ui/label';
import { ScrollArea } from '~/components/ui/scroll-area';
import { Switch } from '~/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';

interface ColumnToggleProps<TData> {
  table: Table<TData>;
}

export function ColumnToggle<TData>({ table }: ColumnToggleProps<TData>) {
  const { t } = useTranslation('common');

  const toggleableColumns = table.getAllColumns().filter((col) => col.getCanHide());

  if (toggleableColumns.length === 0) return null;

  const hasHiddenColumns = toggleableColumns.some((column) => !column.getIsVisible());
  const hasVisibleColumns = toggleableColumns.some((column) => column.getIsVisible());

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" className="ml-auto gap-2 px-3">
            <SlidersHorizontal className="size-3.5" />
            <span className="hidden sm:inline">{t('table.columns')}</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-64 p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
            {t('table.columnVisibility')}
          </span>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="h-6 w-6 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      table.toggleAllColumnsVisible(true);
                    }}
                    disabled={!hasHiddenColumns}>
                    <Eye className="size-3.5" />
                  </Button>
                }
              />
              <TooltipContent side="top">{t('table.showAll')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-destructive hover:bg-destructive/10 h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      table.toggleAllColumnsVisible(false);
                    }}
                    disabled={!hasVisibleColumns}>
                    <EyeOff className="size-3.5" />
                  </Button>
                }
              />
              <TooltipContent side="top">{t('table.hideAll')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="h-6 w-6 text-blue-600 hover:bg-blue-500/10 dark:text-blue-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      table.resetColumnVisibility();
                    }}>
                    <RotateCcw className="size-3.5" />
                  </Button>
                }
              />
              <TooltipContent side="top">{t('table.resetColumns')}</TooltipContent>
            </Tooltip>
          </div>
        </div>
        <DropdownMenuSeparator className="m-0" />
        <ScrollArea className="flex max-h-75 flex-col">
          <div className="flex flex-col gap-px p-1">
            {toggleableColumns.map((column) => {
              const label = typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id;

              return (
                <DropdownMenuItem
                  key={column.id}
                  closeOnClick={false}
                  className="focus:bg-accent flex items-center justify-between gap-2 px-2 py-1.5"
                  onClick={() => column.toggleVisibility(!column.getIsVisible())}>
                  <Label
                    htmlFor={`col-${column.id}`}
                    className="flex-1 cursor-pointer text-xs font-normal capitalize"
                    onClick={(e) => e.preventDefault()}>
                    {label}
                  </Label>
                  <Switch
                    id={`col-${column.id}`}
                    size="sm"
                    checked={column.getIsVisible()}
                    onCheckedChange={(checked) => column.toggleVisibility(checked)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </DropdownMenuItem>
              );
            })}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
