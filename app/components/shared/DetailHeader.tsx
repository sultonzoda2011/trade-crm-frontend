import type { ReactNode } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { cn } from '~/lib/utils';

interface DetailHeaderProps {
  name: string;
  subtitle?: string;
  image?: string | null;
  badges?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function DetailHeader({ name, subtitle, image, badges, actions, className }: DetailHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5', className)}>
      <div className="flex min-w-0 items-center gap-4 sm:gap-5">
        <Avatar size="lg">
          {image ? <AvatarImage src={image} alt={name} className="object-cover" /> : null}
          <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">{name}</h1>
            {badges}
          </div>
          {subtitle && <p className="text-muted-foreground truncate text-sm">{subtitle}</p>}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-3 sm:shrink-0 sm:flex-nowrap sm:gap-4">{actions}</div>
      )}
    </div>
  );
}
