import {
  CheckCircle2,
  HandCoins,
  Package,
  ReceiptText,
  Store,
  Tag,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ListGroup, ListRow } from '~/components/shared/ListGroup';
import { useCacheCoverage } from '~/hooks/useCacheCoverage';
import { fmtNum } from '~/lib/format';
import type { Entity } from '~/lib/query-keys';

const ICONS: Record<Entity, LucideIcon> = {
  transactions: ReceiptText,
  debtors: HandCoins,
  products: Package,
  categories: Tag,
  sellers: UserRound,
  markets: Store,
  users: Users,
};

/** Что из данных уже лежит на устройстве и откроется без интернета. */
export function CoverageSection() {
  const { t } = useTranslation('sync');
  const coverage = useCacheCoverage();

  if (coverage.length === 0) return null;

  return (
    <ListGroup title={t('data.title')} footer={t('data.footer')}>
      {coverage.map((item) => {
        const Icon = ICONS[item.entity];
        const complete = item.target !== null && item.details >= item.target && item.target > 0;

        // Рынок у владельца/продавца — одна своя запись без списка: «total» нет, есть только карточка.
        let value: string;
        if (item.target !== null) value = t('data.cards', { done: fmtNum(item.details), total: fmtNum(item.target) });
        else if (item.details > 0) value = t('data.cardsOnly', { count: item.details });
        else value = t('data.notLoaded');

        return (
          <ListRow
            key={item.entity}
            leading={
              <span className="bg-primary/12 text-primary flex size-10 items-center justify-center rounded-full">
                <Icon className="size-5" />
              </span>
            }
            title={t(`data.entities.${item.entity}`)}
            value={
              <span className="flex items-center gap-1.5">
                {complete && <CheckCircle2 className="text-success size-4" aria-hidden />}
                {value}
              </span>
            }
          />
        );
      })}
    </ListGroup>
  );
}
