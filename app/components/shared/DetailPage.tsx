import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { Reveal } from '~/components/shared/Reveal';
import BreadCrumbs from '~/components/ui/bread-crumb';

interface DetailPageProps {
  crumbs: { label: string; link?: string }[];
  /** Карточка-шапка (`DetailHero`) — всегда на всю ширину над колонками. */
  hero: ReactNode;
  /** Боковая колонка на широком экране; на телефоне идёт сразу под основной. */
  aside?: ReactNode;
  children?: ReactNode;
}

/** `<>…</>` внутри `aside`/children — это несколько секций, а не одна: раскрываем, чтобы каждая получила свой отступ и появление. */
function sections(node: ReactNode): ReactNode[] {
  return Children.toArray(node).flatMap((child) =>
    isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment
      ? sections(child.props.children)
      : [child]
  );
}

/**
 * Каркас страницы «по id»: цепочка «назад», герой, затем секции.
 *
 * Все семь детальных страниц собирали это руками — каждая со своей сеткой,
 * шириной и отступами, поэтому открытая подряд пара страниц «прыгала». Здесь
 * один ритм: на телефоне одна колонка с равными промежутками, на десктопе —
 * основная колонка и боковая. Секции появляются каскадом, как строки списка.
 */
export function DetailPage({ crumbs, hero, aside, children }: DetailPageProps) {
  const main = sections(children);
  const side = sections(aside);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 pb-6">
      <BreadCrumbs items={crumbs} />

      <Reveal>{hero}</Reveal>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-5">
          {/* `empty:hidden`: секция вроде истории возвратов может вернуть null — пустая обёртка не должна оставлять зазор. */}
          {main.map((child, index) => (
            <Reveal key={index} index={index + 1} className="empty:hidden">
              {child}
            </Reveal>
          ))}
        </div>

        {side.length > 0 && (
          <div className="flex min-w-0 flex-col gap-5">
            {side.map((child, index) => (
              <Reveal key={index} index={main.length + index + 1} className="empty:hidden">
                {child}
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
