import type { TFunction } from 'i18next';
import { Package } from 'lucide-react';
import { Link } from 'react-router';
import { ListGroup } from '~/components/shared/ListGroup';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { cldThumb } from '~/lib/cloudinary';
import { fmtNum, fmtTJS } from '~/lib/format';
import type { TransactionDetailItem } from '~/types/transactions';

interface TransactionItemsSectionProps {
  items: TransactionDetailItem[];
  totalAmount: number;
  t: TFunction;
}

/**
 * Позиции транзакции на детальной странице: мобильные карточки и десктопная таблица.
 */
export function TransactionItemsSection({ items, totalAmount, t }: TransactionItemsSectionProps) {
  return (
    <ListGroup title={`${t('fields.items')} · ${items?.length ?? 0}`}>
      {items.map((item) => (
        <Link
          key={item.id}
          to={`/products/${item.productId}`}
          className="active:bg-muted/70 flex min-h-16 items-center gap-3 px-4 py-3 md:hidden">
          <span className="bg-muted flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-[10px]">
            {item.product?.image ? (
              <img src={cldThumb(item.product.image, { w: 88, h: 88 })} alt="" className="size-full object-cover" />
            ) : (
              <Package className="text-muted-foreground size-5" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="line-clamp-2 block text-base leading-snug font-semibold">
              {item.productName || item.product?.name || item.productId}
            </span>
            <span className="text-muted-foreground block text-sm leading-snug">
              {fmtNum(item.price)} × {item.quantity}
              {item.refundedQuantity > 0 && (
                <span className="text-destructive font-medium">
                  {' '}
                  · −{item.refundedQuantity} {t('fieldsRefund.refundedQuantity')}
                </span>
              )}
            </span>
          </span>
          <span className="shrink-0 font-mono text-base font-semibold">
            {fmtNum(item.totalPrice || item.price * item.quantity)}
          </span>
        </Link>
      ))}
      <div className="flex min-h-12 items-center justify-between px-4 py-2.5 md:hidden">
        <span className="text-muted-foreground text-base">{t('fields.totalPrice')}</span>
        <span className="font-mono text-lg font-bold">{fmtTJS(totalAmount)}</span>
      </div>

      <div className="scrollbar-thin hidden max-h-72 overflow-x-auto overflow-y-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="text-muted-foreground bg-card sticky top-0 z-10 border-b text-xs">
            <tr>
              <th className="px-4 py-2.5 font-medium">{t('fields.product')}</th>
              <th className="px-3 py-2.5 text-right font-medium">{t('fields.price')}</th>
              <th className="px-3 py-2.5 text-center font-medium">{t('fields.quantity')}</th>
              <th className="px-3 py-2.5 text-center font-medium">{t('fieldsRefund.refundedQuantity')}</th>
              <th className="px-4 py-2.5 text-right font-medium">{t('fields.totalPrice')}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-2.5 font-medium">
                  <span className="flex items-center gap-2">
                    <Avatar size="sm" className="shrink-0">
                      {item.product?.image ? <AvatarImage src={item.product.image} alt={item.productName} /> : null}
                      <AvatarFallback>
                        {(item.productName || item.product?.name || '?').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Link to={`/products/${item.productId}`} className="text-primary hover:underline">
                      {item.productName || item.product?.name || item.productId}
                    </Link>
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right font-mono">{fmtTJS(item.price)}</td>
                <td className="px-3 py-2.5 text-center font-mono">{item.quantity}</td>
                <td className="px-3 py-2.5 text-center font-mono">
                  {item.refundedQuantity > 0 ? (
                    <span className="text-destructive font-semibold">−{item.refundedQuantity}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right font-mono font-semibold">
                  {fmtTJS(item.totalPrice || item.price * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-border border-t">
            <tr>
              <td colSpan={4} className="text-muted-foreground px-4 py-2.5 text-right text-xs font-medium">
                {t('fields.totalPrice')}
              </td>
              <td className="px-4 py-2.5 text-right font-mono text-sm font-semibold">
                {fmtTJS(totalAmount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </ListGroup>
  );
}
