import type { TFunction } from 'i18next';
import { AlertTriangle, ChevronRight, Package, SlidersHorizontal, Trash2 } from 'lucide-react';
import type { Control } from 'react-hook-form';
import { QuantityStepper } from '~/components/transactions/QuantityStepper';
import { FormInput } from '~/components/ui/form/FormInput';
import { cldThumb } from '~/lib/cloudinary';
import { fmtNum } from '~/lib/format';
import type { Product } from '~/types/products';
import { isOverStock, type CreateTransactionInput, type CreateTransactionItemInput } from '~/validations/transactions';

interface TransactionItemCardProps {
  index: number;
  canRemove: boolean;
  item: CreateTransactionItemInput | undefined;
  product: Product | undefined;
  itemTotal: number;
  productError?: string;
  isExpanded: boolean;
  control: Control<CreateTransactionInput>;
  t: TFunction;
  onOpenPicker: () => void;
  onRemove: () => void;
  onExpandAdjustments: () => void;
}

/**
 * Карточка одной товарной позиции на экране создания продажи/долга.
 */
export function TransactionItemCard({
  index,
  canRemove,
  item,
  product,
  itemTotal,
  productError,
  isExpanded,
  control,
  t,
  onOpenPicker,
  onRemove,
  onExpandAdjustments,
}: TransactionItemCardProps) {
  const overStock = isOverStock(item?.quantity, product?.quantity);

  return (
    <div className="bg-card divide-border divide-y overflow-hidden rounded-2xl">
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={onOpenPicker}
          className="active:bg-muted/70 flex min-h-16 min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left transition-colors">
          <span className="bg-muted flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[10px]">
            {product?.image ? (
              <img src={cldThumb(product.image, { w: 96, h: 96 })} alt="" className="size-full object-cover" />
            ) : (
              <Package className="text-muted-foreground size-5" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            {product ? (
              <>
                <span className="line-clamp-2 block text-base leading-snug font-semibold">{product.name}</span>
                <span className="text-muted-foreground block text-sm leading-snug">
                  {fmtNum(product.price)} TJS · {t('inStock')} {product.quantity}
                </span>
              </>
            ) : (
              <span className="text-primary block text-base font-medium">{t('fields.pickProduct')}</span>
            )}
          </span>
          <ChevronRight className="text-muted-foreground/50 size-5 shrink-0" />
        </button>
        {canRemove && (
          <button
            type="button"
            aria-label={t('actions.delete', { ns: 'common' })}
            onClick={onRemove}
            className="text-destructive active:bg-destructive/10 flex w-12 shrink-0 items-center justify-center border-l">
            <Trash2 className="size-5" />
          </button>
        )}
      </div>

      {productError && <p className="text-destructive px-4 py-2 text-sm">{productError}</p>}

      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <QuantityStepper control={control} name={`items.${index}.quantity`} />
        <span className="font-mono text-xl font-semibold">{fmtNum(itemTotal)}</span>
      </div>

      {overStock && (
        <p className="text-destructive flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium">
          <AlertTriangle className="size-4 shrink-0" />
          {t('stockError')}
        </p>
      )}

      {isExpanded ? (
        <div className="grid grid-cols-2 gap-3 px-3 py-3">
          <FormInput
            control={control}
            label={t('fields.discount')}
            name={`items.${index}.discount`}
            type="number"
            inputMode="decimal"
            min={0}
            placeholder="0"
          />
          <FormInput
            control={control}
            label={t('fields.markup')}
            name={`items.${index}.markup`}
            type="number"
            inputMode="decimal"
            min={0}
            placeholder="0"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={onExpandAdjustments}
          className="text-primary active:bg-muted/70 flex min-h-11 w-full items-center gap-2 px-4 text-sm font-medium">
          <SlidersHorizontal className="size-4" />
          {t('fields.discount')} / {t('fields.markup')}
        </button>
      )}
    </div>
  );
}
