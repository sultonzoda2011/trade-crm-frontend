import { X } from 'lucide-react';
import type { ActiveFilter, FilterConfig } from '~/types/filters';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';

interface ActiveFilterPillsProps {
  filters: ActiveFilter[];
  config: FilterConfig[];
  onRemove: (key: string) => void;
}

function getFilterLabel(filter: ActiveFilter, config: FilterConfig[]): string {
  const cfg = config.find((c) => {
    if ('key' in c && c.key === filter.key) return true;
    if ('keyFrom' in c && c.keyFrom === filter.key) return true;
    return false;
  });
  if (!cfg) return String(filter.value);

  if (cfg.type === 'select' && 'options' in cfg) {
    const match = cfg.options.find((o) => String(o.value) === String(filter.value));
    if (match) return match.label;
  }

  if (cfg.type === 'date-range') {
    if (filter.key === cfg.keyFrom || filter.key === cfg.keyTo) {
      return `${cfg.label}: ${String(filter.value)}`;
    }
  }

  if (cfg.type === 'number-range') {
    if (filter.key === cfg.keyFrom || filter.key === cfg.keyTo) {
      return `${cfg.label}: ${String(filter.value)}`;
    }
  }

  if (cfg.type === 'boolean') {
    return `${cfg.label}: ${filter.value === 'true' ? (cfg.trueLabel ?? String(filter.value)) : (cfg.falseLabel ?? String(filter.value))}`;
  }

  return `${'label' in cfg ? cfg.label : filter.key}: ${String(filter.value).slice(0, 8)}`;
}

export function ActiveFilterPills({ filters, config, onRemove }: ActiveFilterPillsProps) {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {filters.map((filter) => (
        <Badge key={filter.key} variant="secondary" className="flex items-center gap-1 pr-1 text-xs font-normal">
          <span>{getFilterLabel(filter, config)}</span>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-muted size-3.5 p-0"
            onClick={() => onRemove(filter.key)}>
            <X className="size-2.5" />
          </Button>
        </Badge>
      ))}
    </div>
  );
}
