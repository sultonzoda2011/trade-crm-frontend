import { useTranslation } from 'react-i18next';
import { categoryColorStyle, isCategoryColor } from '~/config/categoryColors';
import { cn } from '~/lib/utils';

export interface CategoryChip {
  id: string;
  name: string;
  color?: string | null;
}

interface CategoryChipsProps {
  categories: CategoryChip[];
  /** null — «Все». */
  value: string | null;
  onChange: (id: string | null) => void;
}

/**
 * Ряд чипсов категорий в порядке владельца («главные сверху» = слева). Один тап — и в выборе
 * товара остаются только эти товары: на прилавке так быстрее, чем набирать название.
 * Цвет категории — точка слева от названия.
 */
export function CategoryChips({ categories, value, onChange }: CategoryChipsProps) {
  const { t } = useTranslation('categories');
  if (categories.length === 0) return null;

  return (
    <div
      role="radiogroup"
      aria-label={t('title')}
      className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 [-webkit-overflow-scrolling:touch]">
      <Chip selected={value === null} onClick={() => onChange(null)}>
        {t('chips.all')}
      </Chip>
      {categories.map((c) => (
        <Chip key={c.id} selected={value === c.id} onClick={() => onChange(value === c.id ? null : c.id)}>
          {isCategoryColor(c.color) && (
            <span
              aria-hidden
              style={categoryColorStyle(c.color)}
              // На выбранном (синем) чипсе цветная точка тонет — рисуем её с белой каймой.
              className={cn(
                'cat-color size-2.5 shrink-0 rounded-full bg-(--cat)',
                value === c.id && 'ring-primary-foreground ring-2'
              )}
            />
          )}
          {c.name}
        </Chip>
      ))}
    </div>
  );
}

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        'flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium whitespace-nowrap transition-colors active:opacity-70',
        selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
      )}>
      {children}
    </button>
  );
}
