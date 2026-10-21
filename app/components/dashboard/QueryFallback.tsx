import { AlertTriangle, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Button } from '~/components/ui/button';

interface QueryFallbackProps {
  /** The request failed and there is nothing saved to show instead. */
  isError: boolean;
  /** No connection and no saved copy of this view: a spinner would never end. */
  isOffline: boolean;
  onRetry: () => void;
}

/**
 * What a dashboard tab shows when it has no data at all: the load failed, or the
 * phone is offline and this view was never saved. Offline is told apart from
 * "slow" on purpose — an endless spinner reads as a broken app, while "no
 * internet, nothing saved yet, here is where to sync" tells the owner what to do.
 */
export function QueryFallback({ isError, isOffline, onRetry }: QueryFallbackProps) {
  const { t } = useTranslation(['dashboard', 'common', 'sync']);

  if (isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
        <AlertTriangle className="text-destructive size-8" />
        <p className="font-medium">{t('loadError', { ns: 'dashboard' })}</p>
        <Button variant="outline" onClick={onRetry}>
          {t('actions.retry', { ns: 'common' })}
        </Button>
      </div>
    );
  }

  if (isOffline) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
        <WifiOff className="text-muted-foreground/50 size-8" />
        <p className="text-muted-foreground max-w-xs text-sm">{t('offline.noCachedData', { ns: 'common' })}</p>
        <Link to="/sync" className="text-primary flex min-h-11 items-center text-sm font-medium">
          {t('offlineHint.action', { ns: 'sync' })}
        </Link>
      </div>
    );
  }

  return null;
}
