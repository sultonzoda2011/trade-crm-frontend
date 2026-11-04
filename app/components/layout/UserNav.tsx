import { ChevronDown, CloudDownload, Languages, LogOut, Moon, Sun, User } from 'lucide-react';

import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';

import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';

import { ROLE_CONFIG } from '~/config/enumOptions';
import { useCurrentUser } from '~/hooks/useCurrentUser';
import { useLanguageCycle } from '~/hooks/useLanguageCycle';
import { useIsMobile } from '~/hooks/use-mobile';
import { useLogout } from '~/hooks/useLogout';

export function UserNav() {
  const navigate = useNavigate();

  const { t } = useTranslation('auth');
  const { t: tc } = useTranslation('common');
  const { t: ts } = useTranslation('sync');
  const { requestLogout, logoutDialog } = useLogout();
  const isMobile = useIsMobile();

  const { theme, setTheme, systemTheme } = useTheme();
  const { currentLanguage, cycleLanguage } = useLanguageCycle();
  const userInfo = useCurrentUser();

  const currentTheme = theme === 'system' ? systemTheme : theme;

  const initials = userInfo?.name
    ? userInfo.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'U';

  const roleLabel = userInfo?.role ? ROLE_CONFIG[userInfo.role]?.label(t) : '';

  // На телефоне всё, что было в меню (тема, язык, синхронизация, выход), живёт на экране
  // профиля, поэтому аватар ведёт прямо туда — одним тапом, без промежуточного меню.
  if (isMobile) {
    return (
      <Link
        to="/profile"
        aria-label={tc('header.profile')}
        className="glass-control flex size-11 items-center justify-center rounded-full transition-[transform,opacity] duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)] outline-none active:scale-[0.97] active:opacity-70">
        <Avatar className="size-9">
          {userInfo?.image ? <AvatarImage src={userInfo.image} alt={userInfo.name} className="object-cover" /> : null}
          <AvatarFallback className="bg-primary/10 text-primary text-2xs font-bold">{initials}</AvatarFallback>
        </Avatar>
      </Link>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button className="glass-control group flex h-11 items-center gap-2 rounded-full p-1 transition-[transform,opacity] duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)] outline-none active:scale-[0.97] active:opacity-70 sm:pr-2.5 md:h-10" />
          }>
          <Avatar className="size-9">
            {userInfo?.image ? <AvatarImage src={userInfo.image} alt={userInfo.name} className="object-cover" /> : null}

            <AvatarFallback className="bg-primary/10 text-primary text-2xs font-bold">{initials}</AvatarFallback>
          </Avatar>

          <div className="hidden max-w-40 min-w-0 flex-col items-start text-left xl:flex">
            <span className="max-w-full text-sm leading-none font-semibold break-words">{userInfo?.name}</span>

            <span className="text-muted-foreground text-2xs mt-1 leading-none">{roleLabel}</span>
          </div>

          <ChevronDown className="text-muted-foreground hidden size-4 transition-transform duration-200 group-data-[state=open]:rotate-180 sm:block" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64 overflow-hidden p-0" sideOffset={8}>
          <DropdownMenuGroup>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="bg-primary/3 flex flex-col space-y-3 border-b p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="size-12">
                    {userInfo?.image ? (
                      <AvatarImage src={userInfo.image} alt={userInfo.name} className="object-cover" />
                    ) : null}

                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex min-w-0 flex-col">
                    <p className="text-sm leading-none font-bold break-words">{userInfo?.name}</p>

                    <p className="text-muted-foreground mt-1 text-xs leading-none">{roleLabel}</p>
                  </div>
                </div>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="mx-0" />

          <DropdownMenuGroup className="p-1.5">
            {/* Profile */}
            <DropdownMenuItem
              onClick={() => {
                navigate('/profile');
              }}
              closeOnClick={false}
              className="focus:bg-primary/5 cursor-pointer rounded-xl px-3 py-2.5">
              <User className="text-muted-foreground mr-2 size-4" />

              <span className="text-sm">{tc('header.profile')}</span>
            </DropdownMenuItem>
            {/* Sync */}
            <DropdownMenuItem
              onClick={() => navigate('/sync')}
              closeOnClick={false}
              className="focus:bg-primary/5 cursor-pointer rounded-xl px-3 py-2.5">
              <CloudDownload className="text-muted-foreground mr-2 size-4" />

              <span className="text-sm">{ts('title')}</span>
            </DropdownMenuItem>
            {/* Theme */}
            <DropdownMenuItem
              closeOnClick={false}
              onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')}
              className="focus:bg-primary/5 cursor-pointer rounded-xl px-3 py-2.5">
              {currentTheme === 'dark' ? (
                <Sun className="text-muted-foreground mr-2 size-4" />
              ) : (
                <Moon className="text-muted-foreground mr-2 size-4" />
              )}

              <span className="text-sm">{tc('header.theme')}</span>
            </DropdownMenuItem>

            {/* Language */}
            <DropdownMenuItem
              closeOnClick={false}
              onClick={cycleLanguage}
              className="focus:bg-primary/5 cursor-pointer rounded-xl px-3 py-2.5">
              <Languages className="text-muted-foreground mr-2 size-4" />

              <span className="flex-1 text-sm">{tc('header.language')}</span>

              <span className="text-muted-foreground text-xs font-medium">{currentLanguage.shortLabel}</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="mx-0" />

          <DropdownMenuGroup className="p-1.5">
            <DropdownMenuItem
              onClick={requestLogout}
              className="text-destructive focus:text-destructive focus:bg-destructive/5 cursor-pointer rounded-xl px-3 py-2.5">
              <LogOut className="mr-2 size-4" />

              <span className="text-sm font-medium">{t('logout')}</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {logoutDialog}
    </>
  );
}
