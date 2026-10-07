import dayjs, { type Dayjs } from 'dayjs';

import customParseFormat from 'dayjs/plugin/customParseFormat';
import isoWeek from 'dayjs/plugin/isoWeek';

import type { Period } from '~/config/period';

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
 * Today's calendar date **as the backend sees it**.
 *
 * `resolvePeriod` on the server cuts every window on UTC midnights, so a phone
 * in UTC+5 at 02:00 on the 5th is still "the 4th" for the dashboard. Building
 * the header label and the drill-down links from the local clock made them
 * disagree with the numbers right next to them for those hours. The result is a
 * local-midnight Dayjs carrying the UTC calendar date, so `format`/`formatDate`
 * print the right day in any time zone.
 */
function backendToday(): Dayjs {
  const now = new Date();
  return dayjs(new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Returns the period range used by the dashboard header.
 *
 * The header displays the beginning of the selected period first
 * and the current date second:
 *
 * today → 24.08.2026
 * week  → 24.08.2026 - 30.08.2026 (Monday → today; same window the backend sums)
 * month → 01.08.2026 - 24.08.2026
 * year  → 01.01.2026 - 24.08.2026
 *
 * Week starts on Monday (isoWeek), exactly like `buildCurrentRange` in the backend —
 * it used to be "the last 7 days", so the label promised a window the figures
 * did not use.
 */
export function getPeriodRange(period: Period): { from: Dayjs; to?: Dayjs } {
  const today = backendToday();

  switch (period) {
    case 'today':
      return { from: today };

    case 'week':
      return { from: today.startOf('isoWeek'), to: today };

    case 'month':
      return { from: today.startOf('month'), to: today };

    case 'year':
      return { from: today.startOf('year'), to: today };
  }
}

/**
 * The same window as `getPeriodRange`, as the `YYYY-MM-DD` pair list pages
 * understand (`dateFrom` / `dateTo`). Both ends are inclusive days; `api/crud`
 * turns the `dateTo` day into end-of-day. Used by dashboard drill-down links so
 * "42 transactions" on a card and 42 rows in the list are the same set.
 */
export function getPeriodDateParams(period: Period): { dateFrom: string; dateTo: string } {
  const { from, to } = getPeriodRange(period);
  return { dateFrom: from.format('YYYY-MM-DD'), dateTo: (to ?? from).format('YYYY-MM-DD') };
}
