import Cookies from 'js-cookie';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { SupportedLng } from '~/lib/i18n';

export interface LanguageItem {
  value: SupportedLng;
  label: string;
  shortLabel: string;
}

export const LANGUAGE_ITEMS: LanguageItem[] = [
  { value: 'ru', label: 'Русский', shortLabel: 'РУ' },
  { value: 'en', label: 'English', shortLabel: 'EN' },
  { value: 'tg', label: 'Тоҷикӣ', shortLabel: 'ТҶ' },
];

export function useLanguageCycle() {
  const { i18n } = useTranslation();
  const currentCode = (i18n.language?.split('-')[0] as SupportedLng) ?? 'ru';
  const currentIndex = LANGUAGE_ITEMS.findIndex((item) => item.value === currentCode);
  const currentLanguage = LANGUAGE_ITEMS[currentIndex] ?? LANGUAGE_ITEMS[0];

  const cycleLanguage = useCallback(() => {
    const idx = currentIndex >= 0 ? currentIndex : 0;
    const nextLanguage = LANGUAGE_ITEMS[(idx + 1) % LANGUAGE_ITEMS.length];
    Cookies.set('lng', nextLanguage.value, { expires: 365 });
    void i18n.changeLanguage(nextLanguage.value);
  }, [currentIndex, i18n]);

  return { currentLanguage, cycleLanguage };
}
