export interface ActiveFilter {
  key: string;
  value: unknown;
}

export interface BaseFilterConfig {
  key: string;
  label: string;
}

export interface InputFilterConfig extends BaseFilterConfig {
  type: 'input';
  placeholder?: string;
}

export interface SelectFilterConfig extends BaseFilterConfig {
  type: 'select';
  options: { value: unknown; label: string }[];
  placeholder?: string;
}

export interface NumberRangeFilterConfig {
  type: 'number-range';
  key?: string;
  keyFrom: string;
  keyTo: string;
  label: string;
  placeholderFrom?: string;
  placeholderTo?: string;
}

export interface DateFilterConfig extends BaseFilterConfig {
  type: 'date';
  placeholder?: string;
}

export interface DateRangeFilterConfig {
  type: 'date-range';
  key?: string;
  keyFrom: string;
  keyTo: string;
  label: string;
  placeholderFrom?: string;
  placeholderTo?: string;
}

export interface BooleanFilterConfig {
  type: 'boolean';
  key: string;
  label: string;
  trueLabel?: string;
  falseLabel?: string;
}

export type FilterConfig =
  | InputFilterConfig
  | SelectFilterConfig
  | NumberRangeFilterConfig
  | DateFilterConfig
  | DateRangeFilterConfig
  | BooleanFilterConfig;
