import dayjs, { type Dayjs } from 'dayjs';

import customParseFormat from 'dayjs/plugin/customParseFormat';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(customParseFormat);
dayjs.extend(isoWeek);

/**
 * Backend is migrating DateTime → DateOnly, so date fields may arrive as a Date
 * instance, an ISO datetime, 'YYYY-MM-DD', or 'DD-MM-YYYY' (DateInputField output).
 *
 * Always go through these helpers — `dayjs('11-06-2026')` alone falls back to the
 * native Date parser and silently reads day-first strings as month-first.
 */
export type DateValue = Date | string | null | undefined;

export function toDayjs(value: DateValue): Dayjs | null {
  if (value == null || value === '') return null;

  if (value instanceof Date) return dayjs(value);

  const dayFirst = dayjs(value, ['DD-MM-YYYY', 'DD.MM.YYYY'], true);

  if (dayFirst.isValid()) return dayFirst;

  const parsed = dayjs(value);

  return parsed.isValid() ? parsed : null;
}

export function toDate(value: DateValue): Date | null {
  return toDayjs(value)?.toDate() ?? null;
}

/**
 * Returns the period range used by the dashboard header.
 *
 * The header displays the beginning of the selected period first
 * and the current date second:
 *
 * today → 24.08.2026
 * week  → 17.08.2026 - 24.08.2026
 * month → 01.08.2026 - 24.08.2026
 * year  → 01.01.2026 - 24.08.2026
 *
 * Week starts on Monday (isoWeek).
 */
export function getPeriodRange(period: 'today' | 'week' | 'month' | 'year'): { from: Dayjs; to?: Dayjs } {
  const now = dayjs();

  switch (period) {
    case 'today':
      return {
        from: now,
      };

    case 'week':
      return {
        from: now.subtract(7, 'day'),
        to: now,
      };

    case 'month':
      return {
        from: now.startOf('month'),
        to: now,
      };

    case 'year':
      return {
        from: now.startOf('year'),
        to: now,
      };
  }
}
