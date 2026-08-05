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
    <div className={cn('flex items-center justify-between gap-5', className)}>
      <div className="flex min-w-0 items-center gap-5">
        <Avatar className="size-16 shrink-0 rounded-xl">
          {image ? <AvatarImage src={image} alt={name} className="object-cover" /> : null}
          <AvatarFallback className="bg-muted rounded-xl text-2xl font-semibold">
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <h1 className="truncate text-2xl font-bold tracking-tight">{name}</h1>
            {badges}
          </div>
          {subtitle && <p className="text-muted-foreground truncate text-sm">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-4">{actions}</div>}
    </div>
  );
}