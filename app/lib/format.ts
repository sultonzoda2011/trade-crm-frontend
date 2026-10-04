import dayjs from 'dayjs';

/** Число с пробелами-разделителями без единицы — для плотных строк списка. */
export function fmtNum(v: number): string {
  return v.toLocaleString('ru-RU');
}

export function fmtTJS(v: number): string {
  return `${v.toLocaleString('ru-RU')} TJS`;
}

/** Компактная дата для строк списка: «21.09», а в другом году — «21.09.25». */
export function formatDateShort(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = dayjs(date);
  return d.format(d.year() === dayjs().year() ? 'DD.MM' : 'DD.MM.YY');
}

export function formatDate(date: string | Date | null | undefined, withTime = false): string {
  if (!date) return '—';
  const fmt = withTime ? 'DD.MM.YYYY HH:mm' : 'DD.MM.YYYY';
  return dayjs(date).format(fmt);
}
