import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';

interface ModeToggleProps {
  className?: string;
  variant?: ComponentProps<typeof Button>['variant'];
}

export function ModeToggle({ className, variant = 'glass' }: ModeToggleProps) {
  const { t } = useTranslation('common');
  const { theme, setTheme, systemTheme } = useTheme();

  const current = theme === 'system' ? systemTheme : theme;

  function toggle() {
    setTheme(current === 'dark' ? 'light' : 'dark');
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant={variant}
            size="icon"
            className={className}
            onClick={toggle}
            aria-label={t('actions.toggleTheme')}>
            <Sun className="size-[18px] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute size-[18px] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
            <span className="sr-only">{t('actions.toggleTheme')}</span>
          </Button>
        }
      />
      <TooltipContent side="bottom">{t('actions.toggleTheme')}</TooltipContent>
    </Tooltip>
  );
}
