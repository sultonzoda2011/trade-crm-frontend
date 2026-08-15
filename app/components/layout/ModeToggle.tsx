import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { Button } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';

export function ModeToggle() {
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
          <Button variant="outline" size="icon" onClick={toggle}>
            <Sun className="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        }
      />
      <TooltipContent side="bottom">{t('actions.toggleTheme')}</TooltipContent>
    </Tooltip>
  );
}
