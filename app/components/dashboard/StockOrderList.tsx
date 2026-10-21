import { CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { StockRow } from '~/components/dashboard/StockRow';
import { Panel } from '~/components/layout/Panel';
import { PanelViewAll } from '~/components/shared/PanelViewAll';
import { STOCK_ANALYSIS_DAYS } from '~/config/dashboard';
import type { OverviewData } from '~/types/dashboard';

interface StockOrderListProps {
  data: Pick<OverviewData, 'inventory' | 'products' | 'sales'>;
}

/**
 * "What to order" — the full version of the Overview's short stock card.
 *
 * The backend already filtered (only products with something to order) and sorted
 * (most urgent first) the list, but caps it at ten. When more products need an
 * order than are shown, the card says so and links to the product list filtered
 * the same way, instead of implying that ten is everything.
 *
 * Every row explains itself: how much is left, how long that lasts at the pace
 * measured over the window, how fast the product sells, and how long an order
 * would last. The advice is an estimate, and the card says that too.
 */
export function StockOrderList({ data }: StockOrderListProps) {
  const { t } = useTranslation('dashboard');
  const { inventory, products, sales } = data;
  const rows = products.reorder;
  const total = inventory.needsReorder;
  const noSalesInWindow = sales.transactionCount === 0;

  return (
    <Panel
      title={t('reorderCard.title')}
      bodyClassName="overflow-hidden p-0"
      actions={
        total > 0 ? <PanelViewAll to="/products?needsReorder=true" label={t('viewAll')} count={total} /> : undefined
      }>
      <div className="px-4 pt-3 pb-2">
        <p className="text-muted-foreground text-sm leading-snug">{t('stock.basis', { days: STOCK_ANALYSIS_DAYS })}</p>
        {noSalesInWindow && (
          <p className="text-warning mt-1 text-sm leading-snug">{t('stock.noSalesData', { days: STOCK_ANALYSIS_DAYS })}</p>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="border-border flex items-center gap-3 border-t px-4 py-4">
          <span className="bg-success/10 text-success flex size-10 shrink-0 items-center justify-center rounded-full">
            <CheckCircle2 className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-base leading-snug font-semibold">{t('stock.allGood')}</p>
            <p className="text-muted-foreground text-sm leading-snug">{t('stock.allGoodHint')}</p>
          </div>
        </div>
      ) : (
        <>
          <div className="divide-border border-border divide-y border-t">
            {rows.map((product) => (
              <StockRow key={product.id} product={product} detailed />
            ))}
          </div>

          <div className="border-border text-muted-foreground space-y-1 border-t px-4 py-3 text-sm leading-snug">
            {total > rows.length && <p>{t('reorderCard.shown', { shown: rows.length, total })}</p>}
            <p>{t('stock.orderNote')}</p>
          </div>
        </>
      )}
    </Panel>
  );
}
