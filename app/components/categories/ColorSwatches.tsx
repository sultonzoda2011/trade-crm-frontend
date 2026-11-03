import { Check, Ban } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Label } from '~/components/ui/label';
import { CATEGORY_COLOR_KEYS, categoryColorStyle, type CategoryColorKey } from '~/config/categoryColors';
import { cn } from '~/lib/utils';

interface ColorSwatchesProps {
  value: string | null | undefined;
  onChange: (value: CategoryColorKey | '') => void;
  label?: string;
  className?: string;
}

/**
 * Выбор цвета категории: 10 кружков из палитры + «без цвета». Кружок 44px — по нему
 * попадает палец; выбранный отмечен галочкой, а не только рамкой (видно и без различения цветов).
 */
export function ColorSwatches({ value, onChange, label, className }: ColorSwatchesProps) {
  const { t } = useTranslation('categories');
  const current = value ?? '';

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && <Label>{label}</Label>}
      <div role="radiogroup" aria-label={label ?? t('fields.color')} className="flex flex-wrap gap-2.5">
        <button
          type="button"
          role="radio"
          aria-checked={current === ''}
          aria-label={t('colors.none')}
          onClick={() => onChange('')}
          className={cn(
            'bg-muted text-muted-foreground flex size-11 items-center justify-center rounded-full transition-transform active:scale-90',
            current === '' && 'ring-foreground/70 ring-2 ring-offset-2 ring-offset-(--card,var(--background))'
          )}>
          <Ban className="size-5" strokeWidth={1.75} />
        </button>
        {CATEGORY_COLOR_KEYS.map((key) => {
          const selected = current === key;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={t(`colors.${key}`)}
              onClick={() => onChange(key)}
              style={categoryColorStyle(key)}
              className={cn(
                'cat-color flex size-11 items-center justify-center rounded-full bg-(--cat) text-white transition-transform active:scale-90',
                selected && 'ring-2 ring-(--cat) ring-offset-2 ring-offset-(--card,var(--background))'
              )}>
              {selected && <Check className="size-5" strokeWidth={3} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
