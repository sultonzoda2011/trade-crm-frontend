export type MetricTone = 'default' | 'success' | 'warning' | 'danger';

export const METRIC_TONE_CLASS: Record<MetricTone, string> = {
  default: '',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-destructive',
};
