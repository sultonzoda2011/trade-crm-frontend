import type { TFunction } from 'i18next';
import { CategoryTile } from '~/components/categories/CategoryTile';
import { fmtNum } from '~/lib/format';
import { cn } from '~/lib/utils';
import type { Category } from '~/types/products';

interface CategoryRowProps {
  category: Category;
  t: TFunction;
}

/**
 * Мобильная строка категории (~72px): плитка с цветом, название, «N товаров · сумма»
 * (сумма — только владельцу и админу, у продавца её просто нет), справа — что требует
 * внимания: «нет в наличии» красным, «мало» жёлтым. Спокойная категория — без значков.
 */
export function CategoryRow({ category, t }: CategoryRowProps) {
  const count = category._count.products;
  const hasValue = category.stockValue !== undefined;

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <CategoryTile image={category.image} color={category.color} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-base leading-snug font-semibold">{category.name}</p>
        <p className="text-muted-foreground truncate text-sm leading-snug tabular-nums">
          {count === 0 ? t('row.empty') : t('row.products', { count })}
          {hasValue && count > 0 && <> · {fmtNum(category.stockValue!)}</>}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        {category.outOfStockCount > 0 && (
          <Chip tone="destructive">{t('row.outOfStock', { count: category.outOfStockCount })}</Chip>
        )}
        {category.lowStockCount > 0 && <Chip tone="warning">{t('row.lowStock', { count: category.lowStockCount })}</Chip>}
      </div>
    </div>
  );
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
