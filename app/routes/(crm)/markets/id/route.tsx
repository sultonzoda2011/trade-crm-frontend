import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';

import { marketsApi } from '~/api/markets';

import { MarketOverviewView } from '~/components/markets/MarketOverviewView';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import { NotFoundBlock } from '~/components/shared/NotFoundBlock';
import { OfflineBlock } from '~/components/shared/OfflineBlock';

import { queryKeys } from '~/lib/query-keys';

export default function MarketDetailPage() {
  const { t } = useTranslation(['markets', 'common']);
  const { id } = useParams<{ id: string }>();

  const navigate = useNavigate();

  const {
    data: response,
    isLoading,
    isFetching,
    fetchStatus,
  } = useQuery({
    queryKey: queryKeys.full('markets', id),
    queryFn: () => marketsApi.getOverview(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });

  // До редизайна здесь лежал другой ответ (`/full`, без `summary`): сохранённая копия со старой формой
  // не годится, считаем её отсутствующей и ждём свежий ответ, а не рисуем экран из пустых полей.
  const overview = response?.data?.summary ? response.data : undefined;
  const market = overview?.market;
  // Карточка ни разу не грузилась и сейчас на паузе из-за офлайна — отличаем
  // от "не найдено" (см. app/lib/network-status.ts).
  const isOfflineEmpty = fetchStatus === 'paused' && !market;

  if (isLoading || (!overview && isFetching)) {
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

  return <MarketOverviewView overview={overview!} />;
}
