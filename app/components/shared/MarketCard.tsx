import type { TFunction } from 'i18next';
import { EntityCard } from '~/components/shared/EntityCard';

interface MarketCardMarket {
  id: string;
  name: string;
  address?: string | null;
  image?: string | null;
}

interface MarketCardProps {
  market: MarketCardMarket;
  t: TFunction;
  viewState?: unknown;
  className?: string;
}

/**
 * Раньше карточка «Рынок» (аватар + название + адрес + ссылка) собиралась
 * заново на каждой детальной странице — у продукта, должника, продавца,
 * пользователя, транзакции, категории — с чуть разной вёрсткой в каждом
 * месте. Теперь один компонент, один источник истины по внешнему виду.
 */
export function MarketCard({ market, t, viewState, className }: MarketCardProps) {
  return (
    <EntityCard
      title={t('fields.market', { ns: 'common' })}
      fullName={market.name}
      subInfo={market.address ?? undefined}
      imagePath={market.image ?? undefined}
      viewTo={`/markets/${market.id}`}
      viewLabel={t('actions.view', { ns: 'common' })}
      viewState={viewState}
      className={className}
    />
  );
}
