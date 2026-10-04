import type { Row } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { InitialAvatar } from '~/components/shared/InitialAvatar';
import { fmtNum } from '~/lib/format';
import { cn } from '~/lib/utils';
import type { Debtor } from '~/types/debtors';

interface DebtorMobileCardProps {
  row: Row<Debtor>;
  t: TFunction;
  actionsCell?: React.ReactNode;
}

const RISK_TEXT = { HIGH: 'text-destructive', MEDIUM: 'text-warning', LOW: 'text-success' } as const;

/**
 * Строка должника: имя и телефон слева, справа — сколько должен и почему это
 * важно (просрочка или риск). Список нужен, чтобы сразу видеть, к кому идти
 * первым — поэтому цвет несёт только риск, остальное нейтральное.
 */
export function DebtorMobileCard({ row, t, actionsCell }: DebtorMobileCardProps) {
  const d = row.original;
  const hasDebt = d.totalDebtAmount > 0;
  const note =
    d.overdueAmount > 0
      ? { text: t('profile.overdueAmount'), className: 'text-destructive' }
      : hasDebt && d.risk !== 'LOW'
        ? { text: t(`risk.${d.risk}`), className: RISK_TEXT[d.risk] }
        : null;

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <InitialAvatar name={d.name} />

      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-base leading-snug font-semibold">{d.name}</p>
        <p className="text-muted-foreground break-words text-sm leading-snug">{d.phone}</p>
      </div>

      <div className="shrink-0 text-right">
        <p
          className={cn(
            'font-mono text-base leading-snug font-semibold',
            !hasDebt ? 'text-muted-foreground' : d.overdueAmount > 0 ? 'text-destructive' : 'text-foreground'
          )}>
          {hasDebt ? fmtNum(d.totalDebtAmount) : t('noDebt')}
        </p>
        {note && <p className={cn('text-xs leading-snug font-medium', note.className)}>{note.text}</p>}
      </div>
      {actionsCell && <div className="relative z-2 -mr-1.5 shrink-0">{actionsCell}</div>}
    </div>
  );
}
