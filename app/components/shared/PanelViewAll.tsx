import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router';

interface PanelViewAllProps {
  to: string;
  label: string;
  count: number;
  state?: unknown;
}

export function PanelViewAll({ to, state, label, count }: PanelViewAllProps) {
  return (
    <Link
      to={to}
      state={state}
      className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium transition-colors">
      {label} ({count})
      <ArrowUpRight className="size-3" />
    </Link>
  );
}