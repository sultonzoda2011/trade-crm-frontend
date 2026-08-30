import { ChevronRight, type LucideIcon, User } from 'lucide-react';
import { Link } from 'react-router';
import { Panel } from '~/components/layout/Panel';
import { UserAvatar } from '~/components/shared/UserAvatar';
import { Button } from '~/components/ui/button';

interface EntityCardProps {
  title: string;
  fullName: string;
  subInfo?: string;
  imagePath?: string;
  viewTo: string;
  viewLabel: string;
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
  viewLabel,
  viewState,
  viewIcon: ViewIcon = User,
  className,
}: EntityCardProps) {
  return (
    <Panel title={title} className={className}>
      <div className="space-y-4">
        <UserAvatar fullName={fullName} subInfo={subInfo} imagePath={imagePath} />
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-between gap-2"
          render={<Link to={viewTo} state={viewState} />}>
          <span className="flex min-w-0 items-center gap-2">
            <ViewIcon className="size-3.5 shrink-0" />
            <span className="truncate">{viewLabel}</span>
          </span>
          <ChevronRight className="text-muted-foreground size-3.5 shrink-0" />
        </Button>
      </div>
    </Panel>
  );
}
