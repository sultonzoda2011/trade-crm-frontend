import { Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PickerSheet } from '~/components/shared/PickerSheet';
import { cldThumb } from '~/lib/cloudinary';
import { fmtNum } from '~/lib/format';
import { cn } from '~/lib/utils';
import type { Product } from '~/types/products';

interface ProductPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Товары текущего поиска (options → byId из useAsyncSelectOptions). */
  items: Product[];
  loading: boolean;
  onSearch: (query: string) => void;
  onSelect: (productId: string) => void;
}

/** Выбор товара: фото, название, остаток и цена — видно, тот ли товар берёшь. */
export function ProductPickerSheet({ open, onOpenChange, items, loading, onSearch, onSelect }: ProductPickerSheetProps) {
  const { t } = useTranslation('transactions');

  return (
    <PickerSheet
      title={t('fields.product')}
      open={open}
      onOpenChange={onOpenChange}
      items={items}
      loading={loading}
      onSearch={onSearch}
      getKey={(p) => p.id}
      onSelect={(p) => onSelect(p.id)}
      renderItem={(product) => {
        const out = product.quantity <= 0;
        const low = product.quantity <= product.lowStockThreshold;
        return (
          <>
            <span className="bg-muted flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[10px]">
              {product.image ? (
                <img src={cldThumb(product.image, { w: 96, h: 96 })} alt="" className="size-full object-cover" />
              ) : (
                <Package className="text-muted-foreground size-5" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2 block text-base leading-snug font-semibold">{product.name}</span>
              <span
                className={cn(
                  'block text-sm leading-snug',
                  out ? 'text-destructive' : low ? 'text-warning' : 'text-muted-foreground'
                )}>
                {t('inStock')}: {product.quantity}
              </span>
            </span>
            <span className="shrink-0 font-mono text-base font-semibold">{fmtNum(product.price)}</span>
          </>
        );
      }}
    />
  );
}
