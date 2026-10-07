import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';

interface PanelViewAllProps {
  to: string;
  label: string;
  count: number;
  state?: unknown;
}

/** «Все (12) ›» — ссылка в заголовке секции на полный список. */
export function PanelViewAll({ to, state, label, count }: PanelViewAllProps) {
  return (
    <Link
      to={to}
      state={state}
      className="text-primary inline-flex items-center text-sm font-medium transition-opacity active:opacity-60">
      {label} ({count})
      <ChevronRight className="-mr-1 size-4" />
    </Link>
  );
}
