import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ActiveFilter, FilterConfig } from '~/types/filters';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { toDate } from '~/lib/date';
import { formatDate } from '~/lib/format';

interface ActiveFilterPillsProps {
  filters: ActiveFilter[];
  config: FilterConfig[];
  onRemove: (key: string) => void;
}

type RangeConfig = Extract<FilterConfig, { type: 'date-range' | 'number-range' }>;

interface Pill {
  /** Stable React key: the first filter key the pill stands for. */
  id: string;
  label: string;
  /** Every filter key removing this pill clears — two for a range. */
  keys: string[];
}

function isRange(cfg: FilterConfig): cfg is RangeConfig {
  return cfg.type === 'date-range' || cfg.type === 'number-range';
}

function findConfig(filter: ActiveFilter, config: FilterConfig[]): FilterConfig | undefined {
  return config.find((c) => {
    if ('key' in c && c.key === filter.key) return true;
    if (isRange(c) && (c.keyFrom === filter.key || c.keyTo === filter.key)) return true;
    return false;
  });
}

/** `2026-10-04` → the user's display format; anything unparsable is shown as typed. */
function displayValue(cfg: RangeConfig, value: unknown): string {
  if (cfg.type !== 'date-range') return String(value);
  const date = toDate(String(value));
  return date ? formatDate(date) : String(value);
}

/**
 * A range is one idea to the user ("Date: 29.09.2026 – 04.10.2026"), so it is one
 * chip that clears both ends together. Two chips — "Date range: 2026-09-29" and
 * "Date range: 2026-10-04" — read as two separate filters and used the raw
 * ISO string. Open-ended ranges say which side is open.
 */
function rangePill(cfg: RangeConfig, filters: ActiveFilter[]): Pill {
  const from = filters.find((f) => f.key === cfg.keyFrom);
  const to = filters.find((f) => f.key === cfg.keyTo);
  const fromText = from ? displayValue(cfg, from.value) : undefined;
  const toText = to ? displayValue(cfg, to.value) : undefined;

  let text: string;
  if (fromText && toText) text = fromText === toText && cfg.type === 'date-range' ? fromText : `${fromText} – ${toText}`;
  else if (fromText) text = `≥ ${fromText}`;
  else text = `≤ ${toText}`;

  return {
    id: cfg.keyFrom,
    label: `${cfg.label}: ${text}`,
    keys: [from?.key, to?.key].filter((k): k is string => Boolean(k)),
  };
}

function singlePill(filter: ActiveFilter, cfg: FilterConfig | undefined): Pill {
  const pill = (label: string): Pill => ({ id: filter.key, label, keys: [filter.key] });

  if (!cfg) return pill(String(filter.value));

  if (cfg.type === 'select') {
    const match = cfg.options.find((o) => String(o.value) === String(filter.value));
    if (match) return pill(match.label);

    /*
     * У `select` значение — всегда код (id или энум), человекочитаемая подпись
     * живёт в `options`. Совпадения может не быть: опции ещё грузятся, либо id
     * пришёл ссылкой с дашборда / через `state` и не попал на первую страницу
     * опций. Раньше в этом случае срабатывал общий `slice(0, 8)` в конце функции
     * и пользователь видел огрызок UUID. Показываем только имя фильтра.
     */
    return pill(cfg.label);
  }

  if (cfg.type === 'boolean') {
    const on = String(filter.value) === 'true';
    return pill(`${cfg.label}: ${on ? (cfg.trueLabel ?? 'true') : (cfg.falseLabel ?? 'false')}`);
  }

  // Длинные текстовые значения обрезаем стилями (`max-w-* truncate`), а не
  // `slice` по строке — обрезка в разметке не врёт про содержимое.
  return pill(`${'label' in cfg ? cfg.label : filter.key}: ${String(filter.value)}`);
}

function buildPills(filters: ActiveFilter[], config: FilterConfig[]): Pill[] {
  const pills: Pill[] = [];
  const seenRanges = new Set<RangeConfig>();

  for (const filter of filters) {
    const cfg = findConfig(filter, config);

    if (cfg && isRange(cfg)) {
      if (seenRanges.has(cfg)) continue;
      seenRanges.add(cfg);
      pills.push(rangePill(cfg, filters));
    } else {
      pills.push(singlePill(filter, cfg));
    }
  }

  return pills;
}

export function ActiveFilterPills({ filters, config, onRemove }: ActiveFilterPillsProps) {
  const { t } = useTranslation('common');

  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {buildPills(filters, config).map((pill) => (
        <Badge
          key={pill.id}
          variant="secondary"
          className="flex min-w-0 items-center gap-1 pr-0.5 text-xs font-normal">
          <span className="max-w-[16rem] break-words">{pill.label}</span>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={t('filters.remove')}
            className="hover:bg-muted -my-0.5 shrink-0"
            onClick={() => pill.keys.forEach(onRemove)}>
            <X className="size-3" />
          </Button>
        </Badge>
      ))}
    </div>
  );
}
