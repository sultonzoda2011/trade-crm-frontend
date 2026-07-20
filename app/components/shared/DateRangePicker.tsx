import dayjs from 'dayjs';
import flatpickr from 'flatpickr';
import type { Instance } from 'flatpickr/dist/types/instance';
import { Russian } from 'flatpickr/dist/l10n/ru.js';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarIcon, X } from 'lucide-react';
import { toDate } from '~/lib/date';
import { cn } from '~/lib/utils';

export interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
  className?: string;
  placeholder?: string;
}

function getLocale(lang: string) {
  if (lang === 'ru' || lang === 'tg') return Russian;
  return 'default';
}

function toDateOnly(date: Date) {
  return dayjs(date).format('YYYY-MM-DD');
}

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  className,
  placeholder,
}: DateRangePickerProps) {
  const { i18n, t } = useTranslation('common');
  const effectivePlaceholder = placeholder ?? t('dateRangePicker.placeholder');
  const inputRef = useRef<HTMLInputElement>(null);
  const fpRef = useRef<Instance | null>(null);

  useEffect(() => {
    if (!inputRef.current) return;

    const defaultDates =
      startDate && endDate ? [toDate(startDate)!, toDate(endDate)!] : undefined;

    const fp = flatpickr(inputRef.current, {
      mode: 'range',
      locale: getLocale(i18n.language),
      dateFormat: 'd.m.Y',
      defaultDate: defaultDates,
      disableMobile: true,
      allowInput: false,
      onChange: (dates) => {
        if (dates.length === 2) {
          onChange(toDateOnly(dates[0]), toDateOnly(dates[1]));
        }
      },
    });

    fpRef.current = Array.isArray(fp) ? fp[0] : fp;
    return () => fpRef.current?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fpRef.current?.set('locale', getLocale(i18n.language));
  }, [i18n.language]);

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    fpRef.current?.clear();
  }

  const hasValue = !!startDate && !!endDate;

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
