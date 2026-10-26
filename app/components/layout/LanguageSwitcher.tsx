import { useTranslation } from 'react-i18next';

import EN from '/locales/icons/en.png';
import RU from '/locales/icons/ru.png';
import TJ from '/locales/icons/tj.png';

import { Button } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { useLanguageCycle } from '~/hooks/useLanguageCycle';
import { type SupportedLng } from '~/lib/i18n';

const LANGUAGE_ICONS: Record<SupportedLng, string> = {
  ru: RU,
  en: EN,
  tg: TJ,
};

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const { currentLanguage, cycleLanguage } = useLanguageCycle();
  const icon = LANGUAGE_ICONS[currentLanguage.value] ?? RU;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button type="button" variant="glass" size="icon" onClick={cycleLanguage} aria-label="Change language">
            <img src={icon} alt={currentLanguage.value} className="size-6 rounded-sm object-cover" />
          </Button>
        }
      />
      <TooltipContent side="bottom">{t('actions.changeLanguage')}</TooltipContent>
    </Tooltip>
  );
}
