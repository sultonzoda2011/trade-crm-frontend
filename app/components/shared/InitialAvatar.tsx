import { cn } from '~/lib/utils';

interface InitialAvatarProps {
  name: string;
  className?: string;
}

/** Аватар-инициал как у контактов в iOS: одна спокойная заливка, без «радуги». */
export function InitialAvatar({ name, className }: InitialAvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'bg-primary/12 text-primary flex size-11 shrink-0 items-center justify-center rounded-full text-base font-semibold',
        className
      )}>
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  );
}
