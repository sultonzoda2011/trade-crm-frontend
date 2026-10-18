import type { Row } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { Package } from 'lucide-react';
import { useState } from 'react';
import { cldThumb } from '~/lib/cloudinary';
import { fmtNum } from '~/lib/format';
import { getProductStatus, type ProductStatus } from '~/lib/product-status';
import { cn } from '~/lib/utils';
import type { Product } from '~/types/products';

interface ProductRowProps {
  row: Row<Product>;
  t: TFunction;
}

function formatDays(status: ProductStatus, t: TFunction): string | null {
  if (status.days == null) return null;
  return status.overYear ? t('status.overYear') : t('status.daysShort', { count: status.days });
}

/** Правая колонка под ценой: исключение — чипом, норма — тихой точкой с днями. */
function StatusLine({ status, t }: { status: ProductStatus; t: TFunction }) {
  const days = formatDays(status, t);

  switch (status.kind) {
    case 'out':
      return <Chip tone="destructive">{t('status.out')}</Chip>;
    case 'low':
      return <Chip tone="destructive">{days ? `${t('status.low')} · ${days}` : t('status.low')}</Chip>;
    case 'soon':
      return <Chip tone="warning">{days ? `${t('status.soon')} · ${days}` : t('status.soon')}</Chip>;
    case 'returns':
      return <Chip tone="warning">{t('status.returns')}</Chip>;
    case 'slow':
      return <span className="text-muted-foreground text-xs">{t('status.slow')}</span>;
    default:
      return days ? (
        <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs tabular-nums">
          <span aria-hidden className="bg-success size-1.5 rounded-full" />
          {days}
        </span>
      ) : null;
  }
}

function Chip({ tone, children }: { tone: 'destructive' | 'warning'; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center rounded-full px-2 text-xs font-medium whitespace-nowrap tabular-nums',
        tone === 'destructive' ? 'bg-destructive/15 text-destructive' : 'bg-warning/15 text-warning'
      )}>
      {children}
    </span>
  );
}

/**
 * Мобильная строка товара (~72px): плитка 48px, название в одну строку,
 * «категория · остаток», справа цена и один статус. Нормальный запас — тихая
 * точка, красный/жёлтый чип появляется только когда с товаром что-то не так.
 * Действия (изменить/удалить) живут в свайпе строки, а не в «⋮».
 */
export function ProductRow({ row, t }: ProductRowProps) {
  const product = row.original;
  const [imageFailed, setImageFailed] = useState(false);
  const status = getProductStatus(product);
  const showImage = !!product.image && !imageFailed;
  const qty = `${product.quantity} ${t(`unit.${product.unit}`)}`;

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="bg-muted flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[10px]">
        {showImage ? (
          <img
            src={cldThumb(product.image, { w: 96, h: 96 })}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="size-full object-cover"
          />
        ) : (
          <Package className="text-muted-foreground size-5" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-base leading-snug font-semibold">{product.name}</p>
        <p className="text-muted-foreground truncate text-sm leading-snug">
          {product.category?.name ? `${product.category.name} · ` : ''}
          <span className={cn(status.kind === 'out' && 'text-destructive')}>{qty}</span>
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-base leading-snug font-semibold tabular-nums">{fmtNum(product.price)}</span>
        <StatusLine status={status} t={t} />
      </div>
    </div>
  );
}
