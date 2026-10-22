import { HandCoins, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { ComparisonIndicator } from '~/components/dashboard/ComparisonIndicator';
import { Panel } from '~/components/layout/Panel';
import { AnimatedNumber } from '~/components/shared/AnimatedNumber';
import type { Period } from '~/config/period';
import { fmtTJS } from '~/lib/format';
import type { SellersTotals } from '~/lib/seller-report';
import { cn } from '~/lib/utils';

interface SellersSummaryProps {
  totals: SellersTotals;
  period: Period;
  /** The window is long enough to compare with the previous one. */
  comparable: boolean;
}

const ROW_TONE = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
} as const;

interface PartRowProps {
  icon: LucideIcon;
  tone: keyof typeof ROW_TONE;
  label: string;
  value: number;
}

function PartRow({ icon: Icon, tone, label, value }: PartRowProps) {
  return (
    <div className="flex min-h-14 items-center gap-3 px-4 py-3">
      <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-full', ROW_TONE[tone])}>
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1 text-base leading-snug font-semibold">{label}</span>
      <span
        className={cn(
          'shrink-0 font-mono text-base font-semibold tabular-nums',
          value === 0 && 'text-muted-foreground'
        )}>
        {fmtTJS(value)}
      </span>
    </div>
  );
}

/**
 * The total of the sellers below: how much they sold together and what it is made of.
 *
 * It is the Overview's "Sold" figure counted from the per-seller rows — cash and
 * card sales net of returns, plus goods given on credit — so with no seller picked
 * the two tabs show the same number. The comparison follows the Overview's rule: a
 * window of a day or two is not compared with the previous one (a partial "today"
 * set against a whole yesterday always looks like a collapse), the previous figure
 * is shown instead.
 */
export function SellersSummary({ totals, period, comparable }: SellersSummaryProps) {
  const { t } = useTranslation('dashboard');
  const { comparison } = totals;

  let trend: ReactNode = null;
  if (!totals.hasSales) {
    trend = <span className="text-muted-foreground">{t(`summary.noSales.${period}`)}</span>;
  } else if (comparison) {
    if (comparable) {
      trend = <ComparisonIndicator comparison={comparison} vsLabel={t(`summary.vs.${period}`)} className="text-sm" />;
    } else if (comparison.previous > 0) {
      trend = (
        <span className="text-muted-foreground">
          {t(`summary.previousWas.${period}`, { amount: fmtTJS(comparison.previous) })}
        </span>
      );
    } else {
      trend = <span className="text-muted-foreground">{t(`summary.previousNone.${period}`)}</span>;
    }
  }

  return (
    <Panel className="overflow-hidden" bodyClassName="p-0">
      <div className="px-4 pt-4 pb-3">
        <p className="text-muted-foreground text-sm font-medium">{t(`summary.sold.${period}`)}</p>

        <p className="mt-1 font-mono text-3xl leading-tight font-bold break-words tabular-nums md:text-4xl">
          <AnimatedNumber value={totals.sold} format={fmtTJS} />
        </p>

        <p className="mt-1.5 min-h-5 text-sm">{trend}</p>
      </div>

      <div className="divide-border border-border divide-y border-t">
        <PartRow icon={Wallet} tone="success" label={t('sellersTab.cash')} value={totals.cash} />
        <PartRow icon={HandCoins} tone="warning" label={t('sellersTab.credit')} value={totals.credit} />
      </div>

      {totals.refunds > 0 && (
        <p className="text-muted-foreground border-border border-t px-4 py-3 text-sm leading-snug">
          {t('summary.returnsNote', { amount: fmtTJS(totals.refunds) })}
        </p>
      )}
    </Panel>
  );
}
