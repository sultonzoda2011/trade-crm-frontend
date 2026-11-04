import { useTranslation } from 'react-i18next';

import { DashboardSuccessState } from '~/components/dashboard/DashboardSuccessState';
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
      {noSalesInWindow && (
        <div className="px-4 pt-3 pb-2">
          <p className="text-warning text-sm leading-snug">{t('stock.noSalesData', { days: STOCK_ANALYSIS_DAYS })}</p>
        </div>
      )}

      {rows.length === 0 ? (
        <DashboardSuccessState
          title={t('stock.allGood')}
          hint={t('stock.allGoodHint')}
          className="px-4 py-4"
        />
      ) : (
        <>
          <div className="divide-border divide-y">
            {rows.map((product) => (
              <StockRow key={product.id} product={product} detailed />
            ))}
          </div>

          {total > rows.length && (
            <div className="border-border text-muted-foreground border-t px-4 py-3 text-sm leading-snug">
              <p>{t('reorderCard.shown', { shown: rows.length, total })}</p>
            </div>
          )}
        </>
      )}
    </Panel>
  );
}
