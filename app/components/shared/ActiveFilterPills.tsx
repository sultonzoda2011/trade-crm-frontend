import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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

    /*
     * У `select` значение — всегда код (id или энум), человекочитаемая подпись
     * живёт в `options`. Совпадения может не быть: опции ещё грузятся, либо id
     * пришёл ссылкой с дашборда / через `state` и не попал на первую страницу
     * опций. Раньше в этом случае срабатывал общий `slice(0, 8)` в конце функции
     * и пользователь видел огрызок UUID. Показываем только имя фильтра.
     */
    return cfg.label;
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

  // Длинные текстовые значения обрезаем стилями (`max-w-* truncate`), а не
  // `slice` по строке — обрезка в разметке не врёт про содержимое.
  return `${'label' in cfg ? cfg.label : filter.key}: ${String(filter.value)}`;
}

export function ActiveFilterPills({ filters, config, onRemove }: ActiveFilterPillsProps) {
  const { t } = useTranslation('common');

  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {filters.map((filter) => (
        <Badge
          key={filter.key}
          variant="secondary"
          className="flex min-w-0 items-center gap-1 pr-0.5 text-xs font-normal">
          <span className="max-w-[12rem] truncate">{getFilterLabel(filter, config)}</span>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={t('filters.remove')}
            className="hover:bg-muted -my-0.5 shrink-0"
            onClick={() => onRemove(filter.key)}>
            <X className="size-3" />
          </Button>
        </Badge>
      ))}
    </div>
  );
}
