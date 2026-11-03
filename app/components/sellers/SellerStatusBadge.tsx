import { useTranslation } from 'react-i18next';
import { Badge } from '~/components/ui/badge';

/** Значок «Отключён» — у работающего продавца значка нет: норма не должна шуметь. */
export function SellerStatusBadge({ isActive, className }: { isActive: boolean; className?: string }) {
  const { t } = useTranslation('sellers');
  if (isActive) return null;
  return (
    <Badge variant="secondary" className={className}>
      {t('status.disabledBadge')}
    </Badge>
  );
}
