import type { LucideIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Badge } from '~/components/ui/badge';
import { cldThumb } from '~/lib/cloudinary';
import { cn } from '~/lib/utils';

export interface EntityMobileCardStat {
  icon?: LucideIcon;
  label: string;
  value: ReactNode;
  valueClassName?: string;
}

export interface EntityMobileCardBadge {
  label: ReactNode;
  className?: string;
}

interface EntityMobileCardProps {
  /** Фото/лого сущности. Нет или не загрузилось — плитка с fallbackIcon. */
  image?: string | null;
  fallbackIcon: LucideIcon;
  title: string;
  subtitle?: string | null;
  /** Компактные бейджи под подзаголовком (роль, статус, счётчики). */
  badges?: EntityMobileCardBadge[];
  /** Показатели одной мелкой строкой под подзаголовком: «Количество 24 шт · Запас 12 дн». */
  stats?: EntityMobileCardStat[];
  /** Главное число строки справа (цена товара, баланс): жирным, без подписи. */
  trailing?: ReactNode;
  /** Ячейка действий (⋮). */
  actionsCell?: ReactNode;
  /** Оставлено для совместимости вызовов; в строке списка не используется. */
  media?: ReactNode;
}

/**
 * Строка списка в стиле iOS (как в «Контактах»/«Настройках»): миниатюра слева,
 * заголовок и пояснение, справа — главное число. Без собственной рамки и фона —
 * строки собирает в одну сгруппированную карточку DataTable, а тап по всей
 * строке (оверлей-ссылка) ведёт на страницу сущности.
 */
export function EntityMobileCard({
  image,
  fallbackIcon: FallbackIcon,
  title,
  subtitle,
  badges,
  stats,
  trailing,
  actionsCell,
}: EntityMobileCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = !!image && !imageFailed;

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="bg-muted flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[10px]">
        {showImage ? (
          <img
            src={cldThumb(image, { w: 96, h: 96 })}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="size-full object-cover"
          />
        ) : (
          <FallbackIcon className="text-muted-foreground size-5" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-base leading-snug font-semibold">{title}</p>
        {subtitle && <p className="text-muted-foreground break-words text-sm leading-snug">{subtitle}</p>}
        {stats && stats.length > 0 && (
          <p className="text-muted-foreground mt-0.5 break-words text-sm leading-snug">
            {stats.map((s, i) => (
              <span key={s.label}>
                {i > 0 && ' · '}
                {s.label} <span className={cn('text-foreground font-medium', s.valueClassName)}>{s.value}</span>
              </span>
            ))}
          </p>
        )}
        {badges && badges.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {badges.map((b, i) => (
              <Badge key={i} variant="secondary" className={cn('min-h-5 px-1.5 text-2xs', b.className)}>
                {b.label}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {trailing && <div className="shrink-0 text-right text-base leading-snug font-semibold tabular-nums">{trailing}</div>}
      {actionsCell && <div className="relative z-2 -mr-1.5 shrink-0">{actionsCell}</div>}
    </div>
  );
}
