import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Panel } from '~/components/layout/Panel';
import { LEADERS_VISIBLE } from '~/config/dashboard';
import { fmtTJS } from '~/lib/format';
import type { ProductLeaderRow } from '~/types/dashboard';

interface BestSellersProps {
  products: ProductLeaderRow[];
  /** The products tab of the dashboard, carrying the same period and seller. */
  detailsTo: string;
}

/**
 * The few products that earned the most in the period. Figures are net of
 * returns (the backend subtracts them), so a product people keep bringing back
 * cannot sit at the top.
 */
export function BestSellers({ products, detailsTo }: BestSellersProps) {
  const { t } = useTranslation('dashboard');
  const rows = products.slice(0, LEADERS_VISIBLE);

  return (
    <Panel
      title={t('leaders.title')}
      bodyClassName="overflow-hidden p-0"
      actions={
        rows.length > 0 ? (
          <Link
            to={detailsTo}
            className="text-primary relative inline-flex items-center text-sm font-medium before:absolute before:-inset-x-2 before:-inset-y-3 active:opacity-60">
            {t('leaders.more')}
            <ChevronRight className="-mr-1 size-4" />
          </Link>
        ) : undefined
      }>
      {rows.length === 0 ? (
        <p className="text-muted-foreground px-4 py-5 text-sm">{t('leaders.empty')}</p>
      ) : (
        <div className="divide-border divide-y">
          {rows.map((product, index) => (
            <Link
              key={product.productId}
              to={`/products/${product.productId}`}
              className="active:bg-muted/70 flex min-h-14 items-center gap-3 px-4 py-2.5 transition-colors">
              <span className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-sm font-semibold">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base leading-snug font-semibold break-words">{product.productName}</span>
                <span className="text-muted-foreground block text-sm leading-snug">
                  {t('leaders.units', { count: product.netUnits })}
                  {product.refundedUnits > 0 && (
                    <span className="text-destructive ml-1.5">{t('leaders.returned', { count: product.refundedUnits })}</span>
                  )}
                </span>
              </span>
              <span className="shrink-0 font-mono text-base font-semibold tabular-nums">{fmtTJS(product.netRevenue)}</span>
            </Link>
          ))}
        </div>
      )}
    </Panel>
  );
}
