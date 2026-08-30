import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge } from '~/components/ui/badge';
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
  /** Ссылка на фото/лого сущности. Если нет (или не загрузилось) — показываем fallbackIcon на градиенте. */
  image?: string | null;
  /** Иконка-заглушка, когда нет фото. */
  fallbackIcon: LucideIcon;
  title: string;
  subtitle?: string | null;
  /** Компактные бейджи под заголовком (счётчики, роль, статус и т.п.). */
  badges?: EntityMobileCardBadge[];
  /** Показатели снизу карточки — сеткой по 2 в ряд. */
  stats?: EntityMobileCardStat[];
  /** Ячейка действий (⋮), рендерится поверх шапки полупрозрачной кнопкой. */
  actionsCell?: ReactNode;
  /**
   * Медиа слева от заголовка в шапке — например аватарки товаров транзакции.
   * Нужен там, где у сущности нет одного фото, но есть набор связанных
   * (транзакция: `TransactionProducts`).
   */
  media?: ReactNode;
}

/**
 * Единая мобильная карточка для списков CRM (рынки, продавцы, пользователи,
 * категории, должники, товары — везде, где список сущностей с фото/лого и
 * парой характеристик). Раньше на мобилке был generic-рендер DataTable —
 * заголовок + плоский список чипов, тесно и без акцента на главном. Здесь
 * фото — фон шапки с деградацией на градиент+иконку, если фото нет, а
 * показатели вынесены в отдельную читаемую сетку.
 *
 * Конкретные страницы (products/markets/debtors/…) собирают под неё свои
 * badges/stats из своих колонок — сам компонент не знает про типы сущностей.
 */
export function EntityMobileCard({
  image,
  fallbackIcon: FallbackIcon,
  title,
  subtitle,
  badges,
  stats,
  actionsCell,
  media,
}: EntityMobileCardProps) {
  return (
    <div className="bg-card overflow-hidden rounded-2xl border shadow-sm">
      <div
        className={cn(
          'relative flex h-35 items-end overflow-hidden p-3',
          // Раньше фолбэк-градиент (primary/15) в тёмной теме был почти
          // неотличим от фона карточки — сущности без фото (должники,
          // категории без картинки) визуально выглядели как старый
          // generic-рендер, будто новый компонент карточки вообще не
          // применялся. Делаем фолбэк однозначно узнаваемым: более
          // контрастный градиент + крупный полупрозрачный контурный значок,
          // а не почти невидимая иконка на фоне.
          image ? 'bg-muted bg-cover bg-center' : 'from-primary/25 via-primary/10 to-muted bg-linear-to-br'
        )}
        style={image ? { backgroundImage: `url(${image})` } : undefined}>
        {!image && (
          <FallbackIcon
            strokeWidth={1.25}
            className="text-primary/30 pointer-events-none absolute -top-2 -right-2 h-24 w-24 rotate-12"
          />
        )}
        {image && <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/10 to-transparent" />}
        {media && <div className="relative mr-2.5 shrink-0">{media}</div>}
        <div className={cn('relative min-w-0 flex-1', image ? 'text-white' : 'text-foreground')}>
          <p className="truncate text-sm leading-tight font-semibold">{title}</p>
          {subtitle && (
            <p className={cn('truncate text-xs leading-tight', image ? 'text-white/80' : 'text-muted-foreground')}>
              {subtitle}
            </p>
          )}
        </div>
        {actionsCell && (
          <div
            className={cn(
              // z-2 — карточка целиком может быть накрыта оверлей-ссылкой
              // (см. getRowLink в DataTable); без слоя тап по ⋮ уходил в
              // переход на страницу деталей вместо открытия меню.
              'relative z-2 shrink-0',
              image
                ? '[&_button]:bg-black/30 [&_button]:text-white [&_button]:backdrop-blur-sm [&_button]:hover:bg-black/50'
                : '[&_button]:bg-background/60 [&_button]:backdrop-blur-sm'
            )}
            onClick={(e) => e.stopPropagation()}>
            {actionsCell}
          </div>
        )}
      </div>
      {!image && <div className="border-border/60 border-b" />}

      {(badges?.length || stats?.length) && (
        <div className="space-y-2 p-3">
          {badges && badges.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {badges.map((b, i) => (
                <Badge key={i} variant="secondary" className={cn('font-mono', b.className)}>
                  {b.label}
                </Badge>
              ))}
            </div>
          )}
          {stats && stats.length > 0 && (
            // Нечётное число карточек оставляло пустую ячейку справа в
            // последней строке (grid-cols-2) — выглядело как сломанная
            // вёрстка. Последний элемент при нечётном count растягиваем на
            // всю ширину.
            <div className="grid grid-cols-2 gap-2">
              {stats.map((s, i) => {
                const Icon = s.icon;
                // "Рынок" + значение "Рынок Восточный" визуально дублировало
                // слово — если значение уже само начинается с текста лейбла
                // (частый случай для названий рынков), не повторяем лейбл,
                // иконки достаточно для контекста.
                const valueStartsWithLabel =
                  typeof s.value === 'string' && s.value.toLowerCase().startsWith(s.label.toLowerCase());
                const isLastOdd = stats.length % 2 === 1 && i === stats.length - 1;
                return (
                  <div
                    key={i}
                    className={cn(
                      'bg-muted/50 flex min-w-0 items-center justify-between gap-1.5 rounded-lg px-2.5 py-1.5',
                      isLastOdd && 'col-span-2'
                    )}>
                    {/*
                      Без min-w-0/truncate ячейка (≈152px при 360px экрана) не могла
                      сжаться: длинные названия рынков переносились на вторую строку,
                      а денежное значение рядом с ними выдавливало содержимое за
                      границу. Подпись сжимается и режется многоточием, значение
                      держит ширину (shrink-0) — кроме случая, когда значение и есть
                      единственный текст в ячейке, тогда режется оно.
                    */}
                    {!valueStartsWithLabel && (
                      <span className="text-muted-foreground flex min-w-0 items-center gap-1 text-xs">
                        {Icon && <Icon className="size-3.5 shrink-0" />}
                        <span className="truncate">{s.label}</span>
                      </span>
                    )}
                    <span
                      className={cn(
                        'flex items-center gap-1 font-mono text-sm font-semibold',
                        valueStartsWithLabel ? 'text-muted-foreground min-w-0 text-xs font-normal' : 'shrink-0',
                        s.valueClassName
                      )}>
                      {valueStartsWithLabel && Icon && <Icon className="size-3.5 shrink-0" />}
                      <span className="truncate">{s.value}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
