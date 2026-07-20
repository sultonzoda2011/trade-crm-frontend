import dayjs from 'dayjs';

export function fmtTJS(v: number): string {
  return `${v.toLocaleString('ru-RU')} TJS`;
}

export function fmtTime(s: string): string {
  return s.slice(0, 5);
}
export function formatDate(date: string | Date | null | undefined, withTime = false): string {
  if (!date) return '—';
  const fmt = withTime ? 'DD.MM.YYYY HH:mm' : 'DD.MM.YYYY';
  return dayjs(date).format(fmt);
}
