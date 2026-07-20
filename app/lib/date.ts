import dayjs, { Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

/**
 * Backend is migrating DateTime → DateOnly, so date fields may arrive as a Date
 * instance, an ISO datetime, 'YYYY-MM-DD', or 'DD-MM-YYYY' (DateInputField output).
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
