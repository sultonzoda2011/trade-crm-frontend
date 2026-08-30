import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Panel } from '~/components/layout/Panel';
import { Button } from '~/components/ui/button';
import { fmtTJS } from '~/lib/format';
import type { ProductLeaderRow } from '~/types/dashboard';

/**
 * Топ товаров периода: чистые единицы и чистая выручка, уже за вычетом
 * возвратов — иначе «лидер продаж» мог бы оказаться товаром, который
 * массово возвращают.
 */
export function TopProducts({ products, title }: { products: ProductLeaderRow[]; title: string }) {
  const { t } = useTranslation('dashboard');

  return (
    <Panel
      title={title}
      bodyClassName="p-0"
      actions={
        <Button variant="ghost" size="sm" className="gap-1 text-xs" render={<Link to="/products" />}>
          {t('viewAll')} <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      }>
      {products.length === 0 ? (
        <p className="text-muted-foreground px-4 py-6 text-sm">{t('empty')}</p>
      ) : (
        <div className="divide-border divide-y">
          {products.map((product, index) => (
            <Link
              key={product.productId}
              to={`/products/${product.productId}`}
              className="hover:bg-muted/40 flex items-center justify-between gap-3 px-4 py-2.5 transition-colors">
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="text-muted-foreground w-4 shrink-0 font-mono text-xs">
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{product.productName}</span>
                  <span className="text-muted-foreground block text-xs">
                    {t('products.netUnits', { count: product.netUnits })}
                    {product.refundedUnits > 0 && (
                      <span className="text-destructive ml-1.5">
                        −{product.refundedUnits} {t('products.returned')}
                      </span>
                    )}
                  </span>
                </span>
              </span>
              <span className="shrink-0 font-mono text-sm font-semibold">
                {fmtTJS(product.netRevenue)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </Panel>
  );
}
