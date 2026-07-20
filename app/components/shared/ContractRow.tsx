import type { ReactNode } from 'react';
import { cn } from '~/lib/utils';

export function fmt(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

export function ContractRow({ label, value, bold }: { label: string; value: ReactNode; bold?: boolean }) {
  return (
    <div className="border-border/40 flex items-center justify-between gap-4 border-b py-3 last:border-0">
      <span className="text-muted-foreground shrink-0 text-sm">{label}:</span>
      <span className={cn('text-right text-sm', bold ? 'font-bold' : 'font-medium')}>{value ?? '—'}</span>
    </div>
  );
}
