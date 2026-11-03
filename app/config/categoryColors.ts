import type { CSSProperties } from 'react';

/**
 * Цвет категории — 10 ключей палитры. Бэкенд хранит только ключ (`CATEGORY_COLORS` в
 * `src/categories/category-colors.ts`), а оттенки живут здесь: так тёмная тема и редизайн
 * не требуют миграций. Список ключей должен совпадать с бэкендом.
 */
export const CATEGORY_COLOR_KEYS = [
  'blue',
  'green',
  'orange',
  'red',
  'purple',
  'pink',
  'teal',
  'indigo',
  'yellow',
  'gray',
] as const;

export type CategoryColorKey = (typeof CATEGORY_COLOR_KEYS)[number];

// Оттенки — системные цвета iOS (светлая / тёмная тема).
const SHADES: Record<CategoryColorKey, { light: string; dark: string }> = {
  blue: { light: '#007AFF', dark: '#0A84FF' },
  green: { light: '#34C759', dark: '#30D158' },
  orange: { light: '#FF9500', dark: '#FF9F0A' },
  red: { light: '#FF3B30', dark: '#FF453A' },
  purple: { light: '#AF52DE', dark: '#BF5AF2' },
  pink: { light: '#FF2D55', dark: '#FF375F' },
  teal: { light: '#30B0C7', dark: '#40C8E0' },
  indigo: { light: '#5856D6', dark: '#5E5CE6' },
  yellow: { light: '#FFCC00', dark: '#FFD60A' },
  gray: { light: '#8E8E93', dark: '#98989D' },
};

export function isCategoryColor(value: unknown): value is CategoryColorKey {
  return typeof value === 'string' && (CATEGORY_COLOR_KEYS as readonly string[]).includes(value);
}

/**
 * Цвет через CSS-переменные: класс `cat-color` (global.css) выбирает `--cat` по теме,
 * поэтому компонентам не нужно знать, какая тема сейчас включена. Использовать: `className="cat-color" style={…}`,
 * дальше `bg-(--cat)`.
 */
export function categoryColorStyle(color: string | null | undefined): CSSProperties | undefined {
  if (!isCategoryColor(color)) return undefined;
  const { light, dark } = SHADES[color];
  return { '--cat-light': light, '--cat-dark': dark } as React.CSSProperties;
}
