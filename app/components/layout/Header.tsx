import { HelpCircle, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { LanguageSwitcher } from '~/components/layout/LanguageSwitcher';
import { ModeToggle } from '~/components/layout/ModeToggle';
import { UserNav } from '~/components/layout/UserNav';
import { CommandPalette } from '~/components/shared/CommandPalette';
import { Button } from '~/components/ui/button';
import { SidebarTrigger } from '~/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';

export default function Header() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <header className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-30 flex min-h-14 w-full items-center gap-2 border-b px-2.5 pt-[env(safe-area-inset-top)] backdrop-blur sm:px-3 lg:min-h-16 lg:px-5">
      <div className="flex min-w-0 flex-1 items-center gap-2 lg:gap-3">
        <SidebarTrigger className="shrink-0" />
        <div className="bg-border h-6 w-px shrink-0" aria-hidden="true" />
        {/*
          Раньше здесь был руками собранный <button>: без data-slot="button" он не
          попадал под touch-правило и стоял 36px рядом с 44px соседями, а его
          классы дублировали variant="outline" size="icon" из cva. Адаптивную
          ширину (на xl кнопка превращается в широкую строку поиска) сохраняем.
        */}
        <Button
          variant="outline"
          size="icon"
          aria-label={t('palette.trigger')}
          onClick={() => setPaletteOpen(true)}
          className="text-muted-foreground xl:h-9 xl:w-56 xl:justify-start xl:gap-2 xl:px-2.5 2xl:w-64">
          <Search className="size-4 shrink-0" />
          <span className="hidden flex-1 truncate text-left xl:inline">{t('palette.trigger')}...</span>
          <kbd className="bg-muted text-2xs pointer-events-none hidden h-5 items-center gap-0.5 rounded border px-1.5 font-mono font-medium xl:flex">
            Ctrl K
          </kbd>
        </Button>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-1.5 lg:gap-2">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                aria-label={t('navigation.guide')}
                onClick={() => navigate('/guide')}>
                <HelpCircle className="h-4 w-4" />
              </Button>
            }
          />
          <TooltipContent side="bottom">{t('navigation.guide')}</TooltipContent>
        </Tooltip>

        {/* На <lg скрыто не просто так: тема и язык уже переключаются внутри
            UserNav (см. app/components/layout/UserNav.tsx) — на мобильном
            это дублирующие контролы, функциональность не теряется. */}
        <div className="hidden items-center gap-2 lg:flex">
          <ModeToggle />
          <LanguageSwitcher />
        </div>

        <div className="bg-border h-6 w-px shrink-0" aria-hidden="true" />
        <UserNav />
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </header>
  );
}
