import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '~/components/layout/LanguageSwitcher';
import { ModeToggle } from '~/components/layout/ModeToggle';
import { CommandPalette } from '~/components/shared/CommandPalette';
import { SidebarTrigger } from '~/components/ui/sidebar';
import { UserNav } from './UserNav';

export default function Header() {
  const { t } = useTranslation('common');
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
    <header className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-30 flex h-14 w-full items-center gap-2 border-b px-2.5 backdrop-blur sm:px-3 lg:h-16 lg:px-5">
      <div className="flex min-w-0 flex-1 items-center gap-2 lg:gap-3">
        <SidebarTrigger className="shrink-0" />
        <div className="bg-border h-6 w-px shrink-0" aria-hidden="true" />
        <button
          type="button"
          aria-label={t('palette.trigger')}
          onClick={() => setPaletteOpen(true)}
          className="border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground flex h-9 w-9 items-center justify-center gap-2 rounded-lg border px-0 text-sm transition-colors xl:w-56 xl:justify-start xl:px-2.5 2xl:w-64">
          <Search className="size-4 shrink-0" />
          <span className="hidden flex-1 truncate text-left xl:inline">{t('palette.trigger')}...</span>
          <kbd className="bg-muted text-2xs pointer-events-none hidden h-5 items-center gap-0.5 rounded border px-1.5 font-mono font-medium xl:flex">
            Ctrl K
          </kbd>
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-1.5 lg:gap-2">
        <div className="hidden items-center gap-2 lg:flex">
          <ModeToggle />
          <div className="w-40 2xl:w-44">
            <LanguageSwitcher />
          </div>
        </div>

        <div className="bg-border h-6 w-px shrink-0" aria-hidden="true" />
        <UserNav />
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </header>
  );
}
