import type { ComponentProps, ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '~/lib/utils';

export function ListLink({ className, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      className={cn(
        'hover:bg-muted/40 -mx-2 flex items-center justify-between gap-3 rounded-md px-2 transition-colors',
        className,
      )}
    />
  );
}