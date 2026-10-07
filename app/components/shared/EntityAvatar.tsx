import { Avatar as AvatarPrimitive } from '@base-ui/react/avatar';
import type { LucideIcon } from 'lucide-react';
import { cldThumb } from '~/lib/cloudinary';
import { cn } from '~/lib/utils';

type EntityAvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface EntityAvatarProps {
  name: string;
  image?: string | null;
  size?: EntityAvatarSize;
  /**
   * `circle` — люди (пользователь, продавец, должник).
   * `square` — вещи и места (товар, магазин, категория): скруглённый квадрат,
   * как значок приложения. Аватар человека и логотип магазина не должны
   * выглядеть одинаково — по форме сразу понятно, что открыто.
   */
  shape?: 'circle' | 'square';
  /** Значок вместо первой буквы, если фото нет (категория — тег, магазин — витрина). */
  icon?: LucideIcon;
  className?: string;
}

const SIZE: Record<EntityAvatarSize, { box: string; text: string; icon: string; radius: string; thumb: number }> = {
  sm: { box: 'size-8', text: 'text-xs', icon: 'size-4', radius: 'rounded-lg', thumb: 96 },
  md: { box: 'size-11', text: 'text-base', icon: 'size-5', radius: 'rounded-xl', thumb: 128 },
  lg: { box: 'size-14', text: 'text-xl', icon: 'size-6', radius: 'rounded-2xl', thumb: 192 },
  xl: { box: 'size-20', text: 'text-3xl', icon: 'size-9', radius: 'rounded-[1.4rem]', thumb: 256 },
};

/**
 * Единый аватар для всех сущностей на страницах «по id» и в связанных строках.
 * Размер задаёт и качество превью: крупный герой не должен тянуть 96px-картинку.
 */
export function EntityAvatar({ name, image, size = 'md', shape = 'circle', icon: Icon, className }: EntityAvatarProps) {
  const s = SIZE[size];
  const radius = shape === 'circle' ? 'rounded-full' : s.radius;

  return (
    <AvatarPrimitive.Root
      className={cn('relative flex shrink-0 overflow-hidden select-none', s.box, radius, className)}>
      {image ? (
        <AvatarPrimitive.Image
          src={cldThumb(image, { w: s.thumb })}
          alt={name}
          className="size-full object-cover"
        />
      ) : null}
      <AvatarPrimitive.Fallback
        className={cn(
          'bg-primary/12 text-primary flex size-full items-center justify-center font-semibold',
          s.text
        )}>
        {Icon ? <Icon className={s.icon} strokeWidth={1.75} /> : name.trim().charAt(0).toUpperCase() || '?'}
      </AvatarPrimitive.Fallback>
      {/* Тонкая внутренняя кромка — фото не «сливается» с карточкой того же цвета. */}
      <span aria-hidden className={cn('ring-border/60 pointer-events-none absolute inset-0 ring-1 ring-inset', radius)} />
    </AvatarPrimitive.Root>
  );
}
