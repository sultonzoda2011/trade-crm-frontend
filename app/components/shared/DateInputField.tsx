import dayjs from 'dayjs';
import flatpickr from 'flatpickr';
import { Russian } from 'flatpickr/dist/l10n/ru.js';
import { CalendarIcon, X } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFlatpickr } from '~/hooks/useFlatpickr';
import { Label } from '~/components/ui/label';
import { toDate } from '~/lib/date';
import { cn } from '~/lib/utils';

export interface DateInputFieldProps {
  value: Date | string | null | undefined;
  onChange: (date: string | null) => void;
  onBlur?: () => void;
  error?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  minDate?: Date | string;
  maxDate?: Date | string;
  className?: string;
}

const Tajik: flatpickr.CustomLocale = {
  weekdays: {
    shorthand: ['Як', 'Дш', 'Сш', 'Чш', 'Пш', 'Ҷм', 'Шн'],
    longhand: ['Якшанбе', 'Душанбе', 'Сешанбе', 'Чоршанбе', 'Панҷшанбе', 'Ҷумъа', 'Шанбе'],
  },
  months: {
    shorthand: ['Янв', 'Фев', 'Март', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
    longhand: [
      'Январ',
      'Феврал',
      'Март',
      'Апрел',
      'Май',
      'Июн',
      'Июл',
      'Август',
      'Сентябр',
      'Октябр',
      'Ноябр',
      'Декабр',
    ],
  },
  firstDayOfWeek: 1,
  rangeSeparator: ' — ',
  weekAbbreviation: 'Ҳафт.',
  scrollTitle: 'Барои калон кардан гардонед',
  toggleTitle: 'Барои иваз кардан пахш кунед',
  amPM: ['ПЧ', 'БЧ'],
  yearAriaLabel: 'Сол',
  time_24hr: true,
};

function getLocale(lang: string) {
  if (lang === 'ru') return Russian;
  if (lang === 'tg') return Tajik;
  return 'default';
}

export function DateInputField({
  value,
  onChange,
  onBlur,
  error,
  label,
  placeholder,
  required,
  minDate,
  maxDate,
  className,
}: DateInputFieldProps) {
  const { i18n } = useTranslation();
  const { inputRef, fpRef } = useFlatpickr({
    locale: getLocale(i18n.language),
    dateFormat: 'd.m.Y',
    defaultDate: toDate(value) ?? undefined,
    minDate: minDate ?? undefined,
    maxDate: maxDate ?? undefined,
    disableMobile: true,
    allowInput: false,
    onChange: ([date]) => onChange(date ? dayjs(date).format('YYYY-MM-DD') : null),
    onClose: () => onBlur?.(),
  });

  // Sync locale when language changes
  useEffect(() => {
    fpRef.current?.set('locale', getLocale(i18n.language));
  }, [i18n.language]);

  // Sync minDate / maxDate from props
  useEffect(() => {
    fpRef.current?.set('minDate', minDate ?? undefined);
  }, [minDate]);

  useEffect(() => {
    fpRef.current?.set('maxDate', maxDate ?? undefined);
  }, [maxDate]);

  // Sync value when changed externally (form.reset, setValue)
  useEffect(() => {
    const fp = fpRef.current;
    if (!fp) return;
    const parsed = toDate(value);
    if (parsed) {
      fp.setDate(parsed, false);
    } else {
      fp.clear(false);
    }
  }, [value]);

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    fpRef.current?.clear();
    onChange(null);
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          readOnly
          placeholder={placeholder}
          aria-invalid={!!error}
          className={cn(
            // mirrors shadcn Input styles
            'border-border h-8 w-full cursor-pointer rounded-lg border bg-background px-2.5 py-1 pr-16 text-sm',
            'placeholder:text-muted-foreground transition-colors outline-none',
            'focus:border-ring focus:ring-ring/50 focus:ring-3',
            'aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-invalid:ring-3',
            'dark:bg-input/30'
          )}
        />

        {/* Clear button — only shown when there's a value */}
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-7 -translate-y-1/2 transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        <CalendarIcon className="text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2" />
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
