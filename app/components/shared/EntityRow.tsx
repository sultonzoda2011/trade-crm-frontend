import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { EntityAvatar } from '~/components/shared/EntityAvatar';
import { ListRow } from '~/components/shared/ListGroup';

interface EntityRowProps {
  name: string;
  subtitle?: ReactNode;
  image?: string | null;
  shape?: 'circle' | 'square';
  icon?: LucideIcon;
  to?: string;
  state?: unknown;
  /** Справа: цена, количество, сумма. */
  value?: ReactNode;
  valueClassName?: string;
}

/**
 * Связанная сущность одной строкой — «Магазин», «Продавец», «Товар в категории».
 * Заменяет `MarketCard`/`EntityCard` (отдельную карточку на каждую связь) и
 * ручные `ListLink` с аватаром: один вид строки на всех страницах.
 */
export function EntityRow({ name, subtitle, image, shape = 'circle', icon, to, state, value, valueClassName }: EntityRowProps) {
  return (
    <ListRow
      leading={<EntityAvatar name={name} image={image} shape={shape} icon={icon} size="sm" />}
      title={<span className="font-medium break-words">{name}</span>}
      subtitle={subtitle}
      value={value}
      valueClassName={valueClassName}
      to={to}
      state={state}
    />
  );
}
