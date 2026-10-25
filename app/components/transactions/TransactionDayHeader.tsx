import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { toDayjs } from '~/lib/date';
import { fmtNum } from '~/lib/format';

/** Таджикский есть не в каждом WebView — тогда дата пишется по-русски, а не по-английски. */
function resolveLocale(lng: string): string {
  const base = lng.split('-')[0];
  try {
    return Intl.DateTimeFormat.supportedLocalesOf([base]).length > 0 ? base : 'ru';
  } catch {
    return 'ru';
  }
}

function dayLabels(dayKey: string, lng: string, t: TFunction): { primary: string; secondary: string } {
  const day = toDayjs(dayKey);
  if (!day) return { primary: '—', secondary: '' };
  const locale = resolveLocale(lng);
  const date = day.toDate();
  const dayMonth = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }).format(date);

  const today = toDayjs(new Date())!.startOf('day');
  const diff = today.diff(day.startOf('day'), 'day');
  if (diff === 0) return { primary: t('list.day.today'), secondary: dayMonth };
  if (diff === 1) return { primary: t('list.day.yesterday'), secondary: dayMonth };

  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date);
  return { primary: dayMonth, secondary: weekday };
}

interface TransactionDayHeaderProps {
  dayKey: string;
  /** Итог дня; `null` — день не помещается на страницу целиком, итог не показываем. */
  net: number | null;
}

/** Заголовок дня над карточкой: «Сегодня · 24 октября» и справа итог за день. */
export function TransactionDayHeader({ dayKey, net }: TransactionDayHeaderProps) {
  const { t, i18n } = useTranslation('transactions');
  const { primary, secondary } = dayLabels(dayKey, i18n.language, t);
  const amount = net == null ? null : `${net < 0 ? '−' : ''}${fmtNum(Math.abs(net))}`;

  return (
    <div className="flex items-baseline justify-between gap-3 px-4 pb-1.5">
      <h2 className="min-w-0 truncate text-sm">
        <span className="text-foreground font-semibold">{primary}</span>
        {secondary && <span className="text-muted-foreground"> · {secondary}</span>}
      </h2>
      {amount && (
        <span className="text-muted-foreground shrink-0 text-sm font-medium tabular-nums">
          {t('list.day.total', { amount })}
        </span>
      )}
    </div>
  );
}
