export const defaultNS = 'common';
export const fallbackLng = 'ru';
export const supportedLngs = ['ru', 'en', 'tg'] as const;

export type SupportedLng = (typeof supportedLngs)[number];

export const i18nConfig = {
  supportedLngs,
  fallbackLng,
  defaultNS,
  fallbackNS: 'common',
  ns: [
    'common',
    'auth',
    'validation',
    'users',
    'sellers',
    'products',
    'debtors',
    'transactions',
    'dashboard',
    'markets',
    'categories',
    'profile',
    'guide',
  ],
};
