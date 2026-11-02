import type { ComponentProps } from 'react';
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

interface LanguageSwitcherProps {
  className?: string;
  variant?: ComponentProps<typeof Button>['variant'];
}

export function LanguageSwitcher({ className, variant = 'glass' }: LanguageSwitcherProps) {
  const { t } = useTranslation();
  const { currentLanguage, cycleLanguage } = useLanguageCycle();
  const icon = LANGUAGE_ICONS[currentLanguage.value] ?? RU;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant={variant}
            size="icon"
            className={className}
            onClick={cycleLanguage}
            aria-label={t('actions.changeLanguage')}>
            <img
              src={icon}
              alt={currentLanguage.value}
              className="size-6 rounded-full object-cover ring-1 ring-black/10 dark:ring-white/15"
            />
          </Button>
        }
      />
      <TooltipContent side="bottom">{t('actions.changeLanguage')}</TooltipContent>
    </Tooltip>
  );
}
