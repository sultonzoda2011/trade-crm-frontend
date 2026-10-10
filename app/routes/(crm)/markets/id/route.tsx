import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';

import { marketsApi } from '~/api/markets';

import { MarketDetailView } from '~/components/markets/MarketDetailView';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { NotFoundBlock } from '~/components/shared/NotFoundBlock';
import { OfflineBlock } from '~/components/shared/OfflineBlock';

import { useCan } from '~/hooks/useCan';
import { queryKeys } from '~/lib/query-keys';

export default function MarketDetailPage() {
  const { t } = useTranslation(['markets', 'common']);
  const { id } = useParams<{ id: string }>();

  const navigate = useNavigate();
  const { user } = useCan();

  const {
    data: response,
    isLoading,
    fetchStatus,
  } = useQuery({
    queryKey: queryKeys.full('markets', id),
    queryFn: () => marketsApi.getFull(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });

  const market = response?.data?.market;

  const isOwnMarket = Boolean(user?.marketId) && user?.marketId === id;
  // Карточка ни разу не грузилась и сейчас на паузе из-за офлайна — отличаем
  // от "не найдено" (см. app/lib/network-status.ts).
  const isOfflineEmpty = fetchStatus === 'paused' && !market;

  if (isLoading) {
    return <ByIdSkeleton />;
  }

  if (isOfflineEmpty) {
    return (
      <OfflineBlock
        label={t('offline.noCachedData', { ns: 'common' })}
        onBack={() => navigate('/markets')}
        backLabel={t('actions.back', { ns: 'common' })}
      />
    );
  }

  if (!market) {
    return (
      <NotFoundBlock
        label={t('notFound')}
        onBack={() => navigate('/markets')}
        backLabel={t('actions.back', { ns: 'common' })}
      />
    );
  }

  return (
    <MarketDetailView
      market={market}
      isOwnMarket={isOwnMarket}
      previews={{
        products: response?.data?.products?.data ?? [],
        debtors: response?.data?.debtors?.data ?? [],
        transactions: response?.data?.transactions?.data ?? [],
      }}
    />
  );
}
