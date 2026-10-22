import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Panel } from '~/components/layout/Panel';
import { fmtNum, fmtTJS } from '~/lib/format';
import type { ProductLeaderRow } from '~/types/dashboard';

interface ProductLeadersProps {
  /** What the list is sorted by: the money the product brought, or how many units went. */
  metric: 'revenue' | 'units';
  products: ProductLeaderRow[];
  /** Net revenue of the whole period (same scope), to say what share each product is. */
  totalRevenue: number;
  /** Shown under the list when the backend's own limits make it incomplete. */
  note?: string;
}

/**
 * The top products of the period, net of returns, in one of two orders.
 *
 * The two orders answer different questions: a sack of flour tops the money list,
 * a pack of gum tops the units list. Each row says what the list does not sort by
 * as well, so the owner sees both sides of the same product.
 *
 * Revenue is revenue, not profit — the product has a selling price and no purchase
 * price — and the hint under the title says so. The share of all sales is shown only
 * when the period has sales to take a share of.
 */
export function ProductLeaders({ metric, products, totalRevenue, note }: ProductLeadersProps) {
  const { t } = useTranslation('dashboard');
  const key = metric === 'revenue' ? 'topRevenue' : 'topUnits';

  return (
    <Panel
      title={t(`productsTab.${key}.title`)}
      bodyClassName="overflow-hidden p-0"
      actions={
        products.length > 0 ? (
          <Link
            to="/products"
            className="text-primary relative inline-flex items-center text-sm font-medium before:absolute before:-inset-x-2 before:-inset-y-3 active:opacity-60">
            {t('leaders.more')}
            <ChevronRight className="-mr-1 size-4" />
          </Link>
        ) : undefined
      }>
      <p className="text-muted-foreground px-4 pt-3 pb-2 text-sm leading-snug">{t(`productsTab.${key}.hint`)}</p>

      {products.length === 0 ? (
        <p className="text-muted-foreground border-border border-t px-4 py-4 text-sm leading-snug">{t('leaders.empty')}</p>
      ) : (
        <div className="divide-border border-border divide-y border-t">
          {products.map((product, index) => {
            const share = totalRevenue > 0 ? (product.netRevenue / totalRevenue) * 100 : null;

            return (
              <Link
                key={product.productId}
                to={`/products/${product.productId}`}
                className="active:bg-muted/70 flex min-h-16 items-center gap-3 px-4 py-3 transition-colors">
                <span className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-sm font-semibold">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base leading-snug font-semibold break-words">{product.productName}</span>
                  <span className="text-muted-foreground block text-sm leading-snug">
                    {metric === 'revenue'
                      ? t('leaders.units', { count: product.netUnits })
                      : t('productsTab.brought', { amount: fmtTJS(product.netRevenue) })}
                    {product.refundedUnits > 0 && (
                      <span className="text-destructive ml-1.5">{t('leaders.returned', { count: product.refundedUnits })}</span>
                    )}
                  </span>
                  {metric === 'revenue' && share !== null && (
                    <span className="text-muted-foreground block text-sm leading-snug">
                      {share < 1 ? t('productsTab.shareLow') : t('productsTab.share', { percent: Math.round(share) })}
                    </span>
                  )}
                </span>
                <span className="shrink-0 font-mono text-base font-semibold tabular-nums">
                  {metric === 'revenue' ? fmtTJS(product.netRevenue) : fmtNum(product.netUnits)}
                </span>
                <ChevronRight className="text-muted-foreground/60 -mr-1 size-4 shrink-0" />
              </Link>
            );
          })}
        </div>
      )}

      {note && products.length > 0 && (
        <p className="text-muted-foreground border-border border-t px-4 py-3 text-sm leading-snug">{note}</p>
      )}
    </Panel>
  );
}
