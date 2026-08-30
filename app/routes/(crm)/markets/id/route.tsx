import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';

import { debtorsApi } from '~/api/debtors';
import { marketsApi } from '~/api/markets';
import { productsApi } from '~/api/products';
import { transactionsApi } from '~/api/transactions';

import { MARKET_PREVIEW_LIMIT, MarketDetailView } from '~/components/markets/MarketDetailView';
import { EditMarketModal } from '~/components/modals/EditMarketModal';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { NotFoundBlock } from '~/components/shared/NotFoundBlock';

import { useCan } from '~/hooks/useCan';

export default function MarketDetailPage() {
  const { t } = useTranslation(['markets', 'common']);
  const { id } = useParams<{ id: string }>();

  const navigate = useNavigate();
  const { user } = useCan();

  const { data: marketResponse, isLoading } = useQuery({
    queryKey: ['market', id],
    queryFn: () => marketsApi.getById(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });

  const market = marketResponse?.data;

  // Товары/должники/сделки отдаются только по своему рынку — для чужого
  // запросы не отправляем, и вид покажет одну вкладку с сотрудниками.
  const isOwnMarket = Boolean(user?.marketId) && user?.marketId === id;
  const previewsEnabled = Boolean(id) && isOwnMarket;

  const { data: productsResponse } = useQuery({
    queryKey: ['products', 'market-preview', id],
    queryFn: () => productsApi.getAll(1, MARKET_PREVIEW_LIMIT),
    enabled: previewsEnabled,
    staleTime: 30_000,
  });

  const { data: debtorsResponse } = useQuery({
    queryKey: ['debtors', 'market-preview', id],
    queryFn: () => debtorsApi.getAll(1, MARKET_PREVIEW_LIMIT),
    enabled: previewsEnabled,
    staleTime: 30_000,
  });

  const { data: transactionsResponse } = useQuery({
    queryKey: ['transactions', 'market-preview', id],
    queryFn: () => transactionsApi.getAll(1, MARKET_PREVIEW_LIMIT),
    enabled: previewsEnabled,
    staleTime: 30_000,
  });

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
          products: productsResponse?.data?.data ?? [],
          debtors: debtorsResponse?.data?.data ?? [],
          transactions: transactionsResponse?.data?.data ?? [],
        }}
      />

      <EditMarketModal />
    </div>
  );
}
