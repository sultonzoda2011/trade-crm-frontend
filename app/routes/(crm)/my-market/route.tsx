import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { debtorsApi } from '~/api/debtors';
import { marketsApi } from '~/api/markets';
import { productsApi } from '~/api/products';
import { transactionsApi } from '~/api/transactions';

import { MARKET_PREVIEW_LIMIT, MarketDetailView } from '~/components/markets/MarketDetailView';
import { EditMarketModal } from '~/components/modals/EditMarketModal';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { NotFoundBlock } from '~/components/shared/NotFoundBlock';

import { getClientUser } from '~/lib/auth-utils';

export default function MyMarketPage() {
  const { t } = useTranslation(['markets', 'common']);
  const navigate = useNavigate();

  const { marketId } = getClientUser() || {};

  const { data: response, isLoading } = useQuery({
    queryKey: ['market', marketId],
    queryFn: () => marketsApi.getById(marketId!),
    enabled: Boolean(marketId),
    staleTime: 30_000,
  });

  const market = response?.data;

  // Это всегда свой рынок, поэтому превью грузим без условий.
  const { data: marketProductsResponse } = useQuery({
    queryKey: ['my-market-products-preview'],
    queryFn: () => productsApi.getAll(1, MARKET_PREVIEW_LIMIT, {}, []),
    staleTime: 30_000,
  });

  const { data: marketDebtorsResponse } = useQuery({
    queryKey: ['my-market-debtors-preview'],
    queryFn: () => debtorsApi.getAll(1, MARKET_PREVIEW_LIMIT, {}, []),
    staleTime: 30_000,
  });

  const { data: marketTransactionsResponse } = useQuery({
    queryKey: ['my-market-transactions-preview'],
    queryFn: () => transactionsApi.getAll(1, MARKET_PREVIEW_LIMIT, {}, []),
    staleTime: 30_000,
  });

  if (isLoading) {
    return <ByIdSkeleton />;
  }

  if (!market) {
    return (
      <NotFoundBlock
        label={t('notFound')}
        onBack={() => navigate('/')}
        backLabel={t('actions.back', { ns: 'common' })}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col space-y-4 pb-6">
      <MarketDetailView
        market={market}
        isOwnMarket
        previews={{
          products: marketProductsResponse?.data?.data ?? [],
          debtors: marketDebtorsResponse?.data?.data ?? [],
          transactions: marketTransactionsResponse?.data?.data ?? [],
        }}
      />

      <EditMarketModal />
    </div>
  );
}
