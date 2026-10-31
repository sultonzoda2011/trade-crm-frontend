import { fmtNum } from '~/lib/format';
import { cn } from '~/lib/utils';

interface StockSummaryProps {
  currentLabel: string;
  afterLabel: string;
  current: number;
  /** Остаток после операции; `null` — пока число не введено. */
  after: number | null;
  unit: string;
  /** Цвет итога: растёт — success, падает/уходит в минус — destructive. */
  tone?: 'success' | 'destructive' | 'neutral';
}

/** Блок «сейчас → станет» для окон остатка: человек видит итог до нажатия кнопки. */
export function StockSummary({ currentLabel, afterLabel, current, after, unit, tone = 'neutral' }: StockSummaryProps) {
  return (
    <div className="bg-muted mb-4 space-y-2 rounded-xl p-3 text-base">
      <div className="flex justify-between">
        <span className="text-muted-foreground">{currentLabel}:</span>
        <span className="font-mono font-medium">
          {fmtNum(current)} {unit}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">{afterLabel}:</span>
        <span
          className={cn(
            'font-mono font-bold',
            after != null && tone === 'success' && 'text-success',
            after != null && tone === 'destructive' && 'text-destructive'
          )}>
          {after == null ? '—' : `${fmtNum(after)} ${unit}`}
        </span>
      </div>
    </div>
  );
}
