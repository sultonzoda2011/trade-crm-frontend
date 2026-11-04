import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';

interface PanelViewAllProps {
  to: string;
  label: string;
  count: number;
  state?: unknown;
}

/**
 * «Все (12) ›» — ссылка в заголовке секции на полный список.
 *
 * Сам текст мелкий (по стилю iOS-подписей секций), а палец крупный: зона нажатия
 * расширена невидимым слоем до ~44px по высоте, вёрстка при этом не меняется.
 */
export function PanelViewAll({ to, state, label, count }: PanelViewAllProps) {
  return (
    <Link
      to={to}
      state={state}
      className="text-primary relative inline-flex items-center gap-1 text-sm font-medium transition-opacity before:absolute before:-inset-x-2 before:-inset-y-3 active:opacity-60">
      <span>{label}</span>
      <span className="text-muted-foreground font-mono text-xs tabular-nums">({count})</span>
      <ChevronRight className="-mr-1 size-4" strokeWidth={1.5} />
    </Link>
  );
}
