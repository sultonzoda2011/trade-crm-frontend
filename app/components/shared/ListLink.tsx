import type { ComponentProps } from 'react';
import { Link } from 'react-router';
import { cn } from '~/lib/utils';

/**
 * Строка-ссылка внутри панели (товар, должник, сотрудник в превью-списке).
 *
 * Вертикальный размер задан здесь, а не в вызовах: раньше компонент не задавал
 * паддинг вовсе, и каждое место лепило своё — `py-1`, `py-1.5`, `py-2`,
 * `py-2.5`, `py-3`. В одном табстрипе `/my-market` соседние вкладки давали
 * строки разной высоты, а `py-1` (4px) — зону касания ~28px, вдвое меньше нормы.
 * `min-h-11` = 44px, тот же порог, что и у touch-правила для кнопок.
 */
export function ListLink({ className, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      className={cn(
        'hover:bg-muted/40 -mx-2 flex min-h-11 items-center justify-between gap-3 rounded-md px-2 py-2 transition-colors',
        className
      )}
    />
  );
}
