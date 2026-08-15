export type Period = 'today' | 'week' | 'month' | 'year';

/**
 * Shared period selector used by the dashboard, the sellers report and the
 * product list. Labels live in `common` and are addressed with an explicit
 * namespace, so the options read the same no matter which namespace the
 * calling screen loaded.
 */
export const PERIOD_OPTIONS: ReadonlyArray<{ value: Period; labelKey: string }> = [
  { value: 'today', labelKey: 'common:period.today' },
  { value: 'week', labelKey: 'common:period.week' },
  { value: 'month', labelKey: 'common:period.month' },
  { value: 'year', labelKey: 'common:period.year' },
];
