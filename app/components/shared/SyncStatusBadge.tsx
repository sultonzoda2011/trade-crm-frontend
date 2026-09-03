import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { CloudOff, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '~/hooks/useOnlineStatus';
import { useSyncStore } from '~/store/useSyncStore';
import { Badge } from '~/components/ui/badge';

export default function SyncStatusBadge() {
  const { t } = useTranslation('sync');
  const online = useOnlineStatus();
  const pendingCount = useSyncStore((s) => s.pendingCount);
  const refreshOutbox = useSyncStore((s) => s.refreshOutbox);

  useEffect(() => {
    refreshOutbox();
  }, [refreshOutbox]);

  if (!online) {
    return (
      <Link to="/sync">
        <Badge variant="destructive" className="gap-1">
          <CloudOff className="h-3 w-3" />
          {t('offline')}
        </Badge>
      </Link>
    );
  }

  if (pendingCount > 0) {
    return (
      <Link to="/sync">
        <Badge variant="secondary" className="gap-1">
          <RefreshCw className="h-3 w-3" />
          {pendingCount}
        </Badge>
      </Link>
    );
  }

  return null;
}
