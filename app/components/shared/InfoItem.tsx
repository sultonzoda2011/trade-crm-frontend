import type { ReactNode } from 'react';
import { cn } from '~/lib/utils';

export function InfoItem({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}
