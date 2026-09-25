import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';

import { marketsApi } from '~/api/markets';

import { MarketDetailView } from '~/components/markets/MarketDetailView';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { NotFoundBlock } from '~/components/shared/NotFoundBlock';

import { useCan } from '~/hooks/useCan';

export default function MarketDetailPage() {
  const { t } = useTranslation(['markets', 'common']);
  const { id } = useParams<{ id: string }>();

  const navigate = useNavigate();
  const { user } = useCan();

  const { data: response, isLoading } = useQuery({
    queryKey: ['market-full', id],
    queryFn: () => marketsApi.getFull(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });

  const market = response?.data?.market;

  // Товары/должники/сделки отдаются только по своему рынку — для чужого
  // маркета бэкенд возвращает null и запросов внутри не делает.
  const isOwnMarket = Boolean(user?.marketId) && user?.marketId === id;

  if (isLoading) {
    return <ByIdSkeleton />;
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
    <div className="flex flex-1 flex-col space-y-4 pb-6">
      <MarketDetailView
        market={market}
        isOwnMarket={isOwnMarket}
        previews={{
          products: response?.data?.products?.data ?? [],
          debtors: response?.data?.debtors?.data ?? [],
          transactions: response?.data?.transactions?.data ?? [],
        }}
      />
    </div>
  );
}
