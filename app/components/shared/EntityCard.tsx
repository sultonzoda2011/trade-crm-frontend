import { ChevronRight, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import { UserAvatar } from '~/components/shared/UserAvatar';

interface EntityCardProps {
  title: string;
  fullName: string;
  subInfo?: string;
  imagePath?: string;
  viewTo: string;
  viewLabel?: string;
  viewState?: unknown;
  /** Ведущая иконка строки перехода — по смыслу сущности (владелец, товар, рынок). */
  viewIcon?: LucideIcon;
  className?: string;
}

/**
 * Карточка связанной сущности (владелец рынка, продавец сделки) с одной строкой
 * перехода.
 *
 * Иконка перехода — `ChevronRight`, а не `ArrowUpRight`: правило по приложению —
 * `ChevronRight` это навигация внутри приложения, `ArrowUpRight` — «уйти в
 * другой раздел» (`InfoLink`, `PanelViewAll`). На `/my-market` эта карточка
 * стоит прямо над `QuickActions`, и раньше получалась строка «↗» над строками
 * «>» — теперь это одна серия строк.
 *
 * `variant="ghost"` и ведущая иконка — оттуда же, из `QuickActions`. Ручной
 * `h-9` убран: он спорил с `size="sm"` (`h-8`) и всё равно перекрывался
 * touch-правилом на телефоне.
 */
export function EntityCard({
  title,
  fullName,
  subInfo,
  imagePath,
  viewTo,
  viewState,
  className,
}: EntityCardProps) {
  return (
    <section className={className}>
      <h3 className="text-muted-foreground px-4 pb-1.5 text-xs font-medium tracking-wide uppercase">{title}</h3>
      <Link
        to={viewTo}
        state={viewState}
        className="bg-card active:bg-muted/70 flex min-h-16 items-center gap-3 rounded-2xl px-4 py-3 transition-colors">
        <UserAvatar fullName={fullName} subInfo={subInfo} imagePath={imagePath} />
        <ChevronRight className="text-muted-foreground/50 ml-auto size-5 shrink-0" />
      </Link>
    </section>
  );
}
