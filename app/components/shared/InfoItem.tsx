import type { ReactNode } from 'react';
import { cn } from '~/lib/utils';

/**
 * Пара «подпись → значение» в карточках деталей.
 *
 * `min-w-0` обязателен: элемент grid по умолчанию `min-width: auto`, поэтому
 * неразрывная строка (email, длинный адрес) раздвигала колонку и вся сетка
 * выходила за пределы карточки — на 360px это давало горизонтальный скролл и
 * обрезанный email.
 *
 * Значение — `div`, а не `p`: `value` это `ReactNode`, и часть вызовов передаёт
 * туда блочную разметку (аватарка + текст во flex-контейнере). `<p><div/></p>`
 * React отрендерит, но это невалидный HTML — предупреждение `validateDOMNesting`
 * в dev и поломка при переходе на SSR.
 *
 * `[overflow-wrap:anywhere]`, а не `truncate`: значения бывают многострочными
 * (адрес, описание), полный обрез там вреден — достаточно ломать длинные токены.
 */
export function InfoItem({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0 space-y-1.5', className)}>
      <p className="text-muted-foreground truncate text-xs font-medium tracking-wider uppercase">{label}</p>
      <div className="min-w-0 text-sm font-semibold [overflow-wrap:anywhere]">{value}</div>
    </div>
  );
}
