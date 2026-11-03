import { Tag } from 'lucide-react';
import { useState } from 'react';
import { categoryColorStyle, isCategoryColor } from '~/config/categoryColors';
import { cldThumb } from '~/lib/cloudinary';
import { cn } from '~/lib/utils';

interface CategoryTileProps {
  image?: string | null;
  color?: string | null;
  size?: 'sm' | 'md';
  className?: string;
}

const SIZE = {
  sm: { box: 'size-8 rounded-lg', icon: 'size-4', thumb: 64 },
  md: { box: 'size-12 rounded-[10px]', icon: 'size-5', thumb: 96 },
} as const;

/**
 * Плитка категории: фото, а без него — значок на цветной заливке. Цвет виден сразу,
 * даже когда у категории нет картинки (так их и находят глазами в длинном списке).
 */
export function CategoryTile({ image, color, size = 'md', className }: CategoryTileProps) {
  const [failed, setFailed] = useState(false);
  const s = SIZE[size];
  const hasColor = isCategoryColor(color);
  const showImage = !!image && !failed;

  return (
    <span
      style={categoryColorStyle(color)}
      className={cn(
        'cat-color relative flex shrink-0 items-center justify-center overflow-hidden',
        s.box,
        hasColor ? 'bg-(--cat)/15' : 'bg-muted',
        className
      )}>
      {showImage ? (
        <img
          src={cldThumb(image, { w: s.thumb, h: s.thumb })}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        <Tag className={cn(s.icon, hasColor ? 'text-(--cat)' : 'text-muted-foreground')} strokeWidth={1.9} />
      )}
      {/* Цветная кромка поверх фото: цвет работает и у категорий с картинкой. */}
      {hasColor && showImage && (
        <span aria-hidden className={cn('absolute inset-0 ring-2 ring-(--cat) ring-inset', s.box)} />
      )}
    </span>
  );
}
