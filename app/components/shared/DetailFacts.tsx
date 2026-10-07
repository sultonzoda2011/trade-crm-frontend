import type { ReactNode } from 'react';
import { ListGroup, ListRow } from '~/components/shared/ListGroup';

export interface Fact {
  label: ReactNode;
  value?: ReactNode;
  /** Значение — ссылка на другую страницу: строка получает шеврон. */
  to?: string;
  state?: unknown;
  /** Длинный текст (описание, заметка): идёт второй строкой под подписью, а не справа. */
  long?: boolean;
  valueClassName?: string;
  /** `false` — строку не рисовать. Удобно для `condition && …` без отдельных тернарников. */
  show?: boolean;
}

interface DetailFactsProps {
  title?: ReactNode;
  action?: ReactNode;
  footer?: ReactNode;
  facts: Fact[];
}

/**
 * «Подпись — значение» в виде сгруппированного списка iOS. Заменяет сетку
 * `InfoItem`, которая на телефоне превращалась в длинную колонку блоков
 * с разной высотой, а на десктопе плыла по ширине.
 */
export function DetailFacts({ title, action, footer, facts }: DetailFactsProps) {
  const rows = facts.filter((fact) => fact.show !== false);
  if (rows.length === 0) return null;

  return (
    <ListGroup title={title} action={action} footer={footer}>
      {rows.map((fact, index) => (
        <ListRow
          key={index}
          title={fact.label}
          subtitle={fact.long ? fact.value : undefined}
          value={fact.long ? undefined : fact.value}
          valueClassName={fact.valueClassName}
          to={fact.to}
          state={fact.state}
        />
      ))}
    </ListGroup>
  );
}
