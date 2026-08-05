import { ArrowUpRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '~/lib/utils';

interface InfoLinkProps {
  to: string;
  state?: unknown;
  children: ReactNode;
  className?: string;
}

export function InfoLink({ to, state, children, className }: InfoLinkProps) {
  return (
    <Link
      to={to}
      state={state}
      className={cn(
        'group text-primary inline-flex items-center gap-1 text-sm font-semibold hover:underline',
        className,
      )}>
      {children}
      <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </Link>
  );
}