import { AlertTriangle, Check, Clock, RefreshCw, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '~/lib/utils';
import type { PendingEffects, PendingMeta, PendingStatus } from '~/types/pending';

const STYLE: Record<PendingStatus, { icon: LucideIcon; className: string; spin?: boolean }> = {
  waiting: { icon: Clock, className: 'bg-muted text-muted-foreground' },
  sending: { icon: RefreshCw, className: 'bg-primary/12 text-primary', spin: true },
  retrying: { icon: RefreshCw, className: 'bg-warning/15 text-warning', spin: true },
  failed: { icon: AlertTriangle, className: 'bg-destructive/12 text-destructive' },
  sent: { icon: Check, className: 'bg-success/12 text-success' },
};

/** Метка строки, которой ещё нет на сервере: ждёт связи / отправляется / не отправилась. */
export function PendingBadge({ pending, className }: { pending: PendingMeta; className?: string }) {
  const { t } = useTranslation('sync');
  const { icon: Icon, className: tone, spin } = STYLE[pending.status];

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs leading-none font-medium whitespace-nowrap',
        tone,
        className
      )}>
      <Icon className={cn('size-3', spin && 'animate-spin')} aria-hidden />
      {t(`pending.${pending.status}`)}
    </span>
  );
}

/**
 * Что в очереди у уже существующей строки: оплата, новый долг, возврат. Цифры в строке
 * уже пересчитаны с их учётом — метка объясняет, почему они отличаются от сервера.
 */
export function PendingEffectsNote({ effects, className }: { effects?: PendingEffects; className?: string }) {
  const { t } = useTranslation('sync');
  if (!effects || (!effects.pay && !effects.debt && !effects.refund)) return null;

  const parts = [
    effects.pay ? t('pending.payQueued') : null,
    effects.debt ? t('pending.debtQueued') : null,
    effects.refund ? t('pending.refundQueued') : null,
  ].filter(Boolean);

  return (
    <span className={cn('text-muted-foreground inline-flex items-center gap-1 text-xs leading-snug', className)}>
      <Clock className="size-3 shrink-0" aria-hidden />
      {parts.join(' · ')}
    </span>
  );
}
