import { WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Button } from '~/components/ui/button';

interface OfflineBlockProps {
  label: string;
  onBack: () => void;
  backLabel?: string;
}

/**
 * Показывается вместо NotFoundBlock, когда карточка ещё ни разу не
 * загружалась и устройство сейчас офлайн (см. fetchStatus === 'paused' в
 * вызывающей странице) — чтобы "нет сети" не выглядело как "не найдено".
 */
export function OfflineBlock({ label, onBack, backLabel }: OfflineBlockProps) {
  const { t } = useTranslation('sync');
  return (
    <div className="flex h-100 flex-col items-center justify-center space-y-4 text-center">
      <WifiOff className="text-muted-foreground/40 size-10" />
      <p className="text-muted-foreground max-w-xs text-sm">{label}</p>
      <Link to="/sync" className="text-primary flex min-h-11 items-center text-sm font-medium">
        {t('offlineHint.action')}
      </Link>
      <Button variant="outline" onClick={onBack}>
        {backLabel}
      </Button>
    </div>
  );
}
