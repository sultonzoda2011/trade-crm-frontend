import flatpickr from 'flatpickr';
import type { Instance } from 'flatpickr/dist/types/instance';
import monthSelectPlugin from 'flatpickr/dist/plugins/monthSelect';
import { Russian } from 'flatpickr/dist/l10n/ru.js';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarIcon, X } from 'lucide-react';
import { cn } from '~/lib/utils';

export interface MonthPickerProps {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
  className?: string;
  placeholder?: string;
}

function getLocale(lang: string) {
  if (lang === 'ru' || lang === 'tg') return Russian;
  return 'default';
}

export function MonthPicker({ year, month, onChange, className, placeholder }: MonthPickerProps) {
  const { i18n, t } = useTranslation('common');
  const effectivePlaceholder = placeholder ?? t('monthPicker.placeholder');
  const inputRef = useRef<HTMLInputElement>(null);
  const fpRef = useRef<Instance | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; });

  useEffect(() => {
    if (!inputRef.current) return;

    const fp = flatpickr(inputRef.current, {
      plugins: [
        monthSelectPlugin({
          shorthand: false,
          dateFormat: 'Y-m',
          altFormat: 'F Y',
        }),
      ],
      locale: getLocale(i18n.language),
      defaultDate: new Date(year, month - 1, 1),
      disableMobile: true,
      maxDate: new Date(),
      onChange: ([date]) => {
        if (date) onChangeRef.current(date.getFullYear(), date.getMonth() + 1);
      },
    });

    fpRef.current = Array.isArray(fp) ? fp[0] : fp;
    return () => fpRef.current?.destroy();
    // onChange captured via ref — no stale closure, safe with empty deps
  }, []);

  useEffect(() => {
    fpRef.current?.set('locale', getLocale(i18n.language));
  }, [i18n.language]);

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChangeRef.current(new Date().getFullYear(), new Date().getMonth() + 1);
  }

  const hasValue = !!year && !!month;

  return (
    <div className={cn('relative', className)}>
      <input
        ref={inputRef}
        readOnly
        placeholder={effectivePlaceholder}
        className={cn(
          'h-9 w-full cursor-pointer rounded-lg border border-border bg-transparent px-3 py-1 pr-16 text-sm',
          'placeholder:text-muted-foreground outline-none transition-colors',
          'focus:border-ring focus:ring-2 focus:ring-ring/50',
          'dark:bg-input/30',
        )}
      />

      {hasValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-7 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      <CalendarIcon className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
