import type { TFunction } from 'i18next';
import { Pencil, Trash2 } from 'lucide-react';
import type { SwipeAction } from '~/components/shared/SwipeableRow';

interface RowSwipeOptions {
  /** `t` страницы: подписи берутся из `common`, поэтому неймспейс сущности не важен. */
  t: TFunction;
  /** Действия сущности, которые идут первыми (оплата и т.п.). */
  leading?: SwipeAction[];
  /** Не передавайте, если у роли нет права или правка для этой строки не имеет смысла. */
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * Свайп-действия мобильной строки списка: «Изменить» и «Удалить» одинаковы у всех
 * сущностей, меняется только то, что идёт перед ними.
 *
 * Порядок всегда один — [специфичные…, изменить, удалить]: удаление с краю, там, где
 * палец заканчивает жест, но случайно его не нажать — ширина кнопки 76px и подтверждение.
 * Строку открывает тап (страница «по id»), правка — только через свайп: так «открыть»
 * и «изменить» не путаются.
 */
export function buildRowSwipeActions({ t, leading = [], onEdit, onDelete }: RowSwipeOptions): SwipeAction[] {
  const actions = [...leading];
  if (onEdit) {
    actions.push({
      key: 'edit',
      label: t('swipe.edit', { ns: 'common' }),
      icon: Pencil,
      tone: 'primary',
      onSelect: onEdit,
    });
  }
  if (onDelete) {
    actions.push({
      key: 'delete',
      label: t('swipe.delete', { ns: 'common' }),
      icon: Trash2,
      tone: 'destructive',
      onSelect: onDelete,
    });
  }
  return actions;
}
