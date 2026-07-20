import type { TFunction } from 'i18next';
import { z } from 'zod';
import { toDayjs } from '~/lib/date';

/**
 * Reusable DateOnly field schemas.
 *
 * Date pickers (`DateInputField` / `DateRangePicker`) emit a canonical
 * `'YYYY-MM-DD'` string, but a field value may also arrive as a `Date`, an ISO
 * datetime, or a `'DD-MM-YYYY'` string (legacy / backend). These helpers accept
 * any of those and validate that the value is a real, parseable date — use them
 * instead of `z.date()`, which rejects the string the pickers produce.
 */
const isParseable = (v: unknown) => toDayjs(v as Date | string) !== null;

/** Optional DateOnly field (e.g. birthday, contract end date). */
export const optionalDate = (t: TFunction) =>
  z
    .union([z.string(), z.date()])
    .nullable()
    .optional()
    .refine((v) => v == null || v === '' || isParseable(v), {
      message: t('invalidDate', { ns: 'validation' }),
    });

/** Required DateOnly field (e.g. group start/end date, transaction date). */
export const requiredDate = (t: TFunction) =>
  z
    .union([z.string(), z.date()])
    .nullable()
    .optional()
    .refine((v) => v != null && v !== '' && isParseable(v), {
      message: t('required', { ns: 'validation' }),
    });
