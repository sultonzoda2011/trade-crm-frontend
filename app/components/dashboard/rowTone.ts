/**
 * Colour of the round icon and of the amount in a dashboard row.
 * `danger` — needs action now, `warning` — soon, `neutral` — for information.
 * Shared by the debts card and the stock health list so one tone looks the same everywhere.
 */
export const ROW_TONE = {
  danger: { badge: 'bg-destructive/10 text-destructive', amount: 'text-destructive' },
  warning: { badge: 'bg-warning/10 text-warning', amount: 'text-warning' },
  neutral: { badge: 'bg-muted text-muted-foreground', amount: 'text-foreground' },
} as const;

export type RowTone = keyof typeof ROW_TONE;
