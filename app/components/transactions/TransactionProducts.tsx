import type { TFunction } from 'i18next';
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from '~/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';

/** Минимум, который нужен для отрисовки — подходит и списочному item, и detail-item. */
export interface TransactionProductLike {
  productName: string;
  quantity: number;
  product?: { name?: string; image?: string | null } | null;
}

interface TransactionProductsProps {
  items: TransactionProductLike[];
  /** Сколько аватарок показать до сворачивания в "+N". */
  max?: number;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

/**
 * Аватарки товаров транзакции вместо непонятного #id: сразу видно, что продано.
 * Картинка товара, при отсутствии — первая буква названия. Overflow → "+N",
 * полный список позиций — в тултипе.
 */
export function TransactionProducts({ items, max = 4, size = 'sm', className }: TransactionProductsProps) {
  if (!items || items.length === 0) return null;

  const visible = items.slice(0, max);
  const rest = items.length - visible.length;
  const label = items
    .map((it) => {
      const name = it.productName || it.product?.name || '';
      return it.quantity ? `${name} × ${it.quantity}` : name;
    })
    .filter(Boolean)
    .join(', ');

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <AvatarGroup data-size={size} className={className}>
            {visible.map((it, i) => {
              const name = it.productName || it.product?.name || '?';
              return (
                <Avatar key={i} size={size}>
                  {it.product?.image ? <AvatarImage src={it.product.image} alt={name} /> : null}
                  <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              );
            })}
            {rest > 0 && <AvatarGroupCount>+{rest}</AvatarGroupCount>}
          </AvatarGroup>
        }
      />
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Понятная "подпись" транзакции вместо id: должник → покупатель → как крайний
 * случай тип сделки. Товары показываем отдельно аватарками, поэтому в подписи
 * их не дублируем. `skipDebtor` — для страниц самого должника, где имя и так ясно.
 */
export function getTransactionTitle(
  tx: {
    debtor?: { name?: string } | null;
    customerName?: string | null;
    type: string;
  },
  t: TFunction,
  opts?: { skipDebtor?: boolean }
): string {
  if (!opts?.skipDebtor && tx.debtor?.name) return tx.debtor.name;
  if (tx.customerName) return tx.customerName;
  return t(`type.${tx.type}`, { ns: 'transactions' });
}
