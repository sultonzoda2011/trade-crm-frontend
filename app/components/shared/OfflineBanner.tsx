import { WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useOnlineStatus } from '~/hooks/useOnlineStatus';
import { cn } from '~/lib/utils';

/**
 * Тонкая полоса сверху экрана, когда нет сети. React Query в это время
 * продолжает отдавать данные из локального (персистентного) кэша —
 * баннер только объясняет пользователю, почему список может быть неактуальным.
 */
export default function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const { t } = useTranslation('common');

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'bg-destructive text-destructive-foreground flex items-center justify-center gap-2 overflow-hidden px-3 text-center text-xs font-medium transition-[max-height,opacity,padding] duration-300',
        isOnline ? 'max-h-0 py-0 opacity-0' : 'max-h-10 py-1.5 opacity-100'
      )}>
      <WifiOff className="h-3.5 w-3.5 shrink-0" />
      <span>{t('offline.banner')}</span>
    </div>
  );
}
