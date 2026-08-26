import Cookies from 'js-cookie';
import { useTranslation } from 'react-i18next';

import EN from '/locales/icons/en.png';
import RU from '/locales/icons/ru.png';
import TJ from '/locales/icons/tj.png';

import { Button } from '~/components/ui/button';
import { type SupportedLng } from '~/lib/i18n';

const languages: {
  value: SupportedLng;
  icon: string;
}[] = [
  {
    value: 'ru',
    icon: RU,
  },
  {
    value: 'en',
    icon: EN,
  },
  {
    value: 'tg',
    icon: TJ,
  },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const currentLanguage = (i18n.language?.split('-')[0] as SupportedLng) ?? 'ru';

  const handleChange = () => {
    const currentIndex = languages.findIndex((language) => language.value === currentLanguage);

    const nextLanguage = languages[(currentIndex + 1) % languages.length];

    Cookies.set('lng', nextLanguage.value, {
      expires: 365,
    });

    void i18n.changeLanguage(nextLanguage.value);
  };

  const currentLanguageItem = languages.find((language) => language.value === currentLanguage) ?? languages[0];

  return (
    <Button type="button" variant="outline" size="icon" onClick={handleChange} aria-label="Change language">
      <img src={currentLanguageItem.icon} alt={currentLanguageItem.value} className="h-6 w-6 rounded-sm object-cover" />
    </Button>
  );
}
