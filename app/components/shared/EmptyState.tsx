import { Inbox } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '~/lib/utils';

interface EmptyStateProps {
  message?: string;
  className?: string;
}

export function EmptyState({ message, className }: EmptyStateProps) {
  const { t } = useTranslation('common');
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16 text-center', className)}>
      <Inbox className="text-muted-foreground/30 h-10 w-10" />
      <p className="text-muted-foreground text-sm">{message ?? t('table.noData')}</p>
    </div>
  );
}
