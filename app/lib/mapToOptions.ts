/**
 * Converts an array of objects to `{ value, label }` options for selects.
 *
 * @example
 * mapToOptions(centers, 'id', 'name')
 * // → [{ value: 1, label: 'Main Office' }, ...]
 */
export function mapToOptions<T extends object, K extends keyof T>(
  data: T[],
  valueKey: K,
  labelKey: keyof T
): Array<{ value: T[K]; label: string }> {
  return data.map((item) => ({
    value: item[valueKey],
    label: String(item[labelKey]),
  }));
}
