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
    <div
      className={cn(
        // Телефон: строка списка iOS (подпись слева, значение справа, линия между строками).
        // sm+: прежняя пара «подпись → значение» в колонках карточки.
        'border-border flex min-w-0 items-center justify-between gap-4 border-b py-3 last:border-b-0 sm:block sm:space-y-1.5 sm:border-b-0 sm:py-0',
        className
      )}>
      <p className="shrink-0 text-base sm:break-words sm:text-xs sm:font-medium sm:text-muted-foreground">{label}</p>
      <div className="text-muted-foreground min-w-0 text-right text-base [overflow-wrap:anywhere] sm:text-foreground sm:text-left sm:text-sm sm:font-semibold">
        {value}
      </div>
    </div>
  );
}
