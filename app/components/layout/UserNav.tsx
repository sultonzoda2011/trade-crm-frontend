import Cookies from 'js-cookie';

import { useQueryClient } from '@tanstack/react-query';
import { ChevronDown, CloudDownload, Languages, LogOut, Moon, Sun, User } from 'lucide-react';
import { useState } from 'react';

import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { ConfirmDialog } from '~/components/shared/ConfirmDialog';
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
import { useOfflineQueue } from '~/hooks/useOfflineQueue';
import { clearSession } from '~/lib/auth-utils';
import { wipeOfflineData } from '~/lib/offline-session';

const LANGUAGES = [
  { value: 'ru', label: 'Русский', shortLabel: 'РУ' },
  { value: 'en', label: 'English', shortLabel: 'EN' },
  { value: 'tg', label: 'Тоҷикӣ', shortLabel: 'ТҶ' },
];

export function UserNav() {
  const navigate = useNavigate();

  const { t } = useTranslation('auth');
  const { t: tc, i18n } = useTranslation('common');
  const { t: ts } = useTranslation('sync');
  const queryClient = useQueryClient();
  const { total: queued } = useOfflineQueue();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const { theme, setTheme, systemTheme } = useTheme();

  const userInfo = useCurrentUser();

  const currentTheme = theme === 'system' ? systemTheme : theme;

  const currentLng = i18n.language?.split('-')[0] ?? 'ru';

  const currentLanguageIndex = LANGUAGES.findIndex((lng) => lng.value === currentLng);

  const currentLanguage = LANGUAGES[currentLanguageIndex] ?? LANGUAGES[0];

  const changeLanguage = () => {
    const nextLanguage = LANGUAGES[(currentLanguageIndex + 1) % LANGUAGES.length];

    Cookies.set('lng', nextLanguage.value, {
      expires: 365,
    });

    void i18n.changeLanguage(nextLanguage.value);
  };

  // Выход стирает офлайн-кеш и очередь (данные бизнеса не должны достаться следующему
  // человеку на этом телефоне). Неотправленные операции при этом пропали бы молча —
  // поэтому, если они есть, сначала спрашиваем.
  const logout = async () => {
    setConfirmLogout(false);
    clearSession();
    await wipeOfflineData(queryClient);
    navigate('/login');
  };

  const handleLogout = () => {
    if (queued > 0) setConfirmLogout(true);
    else void logout();
  };

  const initials = userInfo?.name
    ? userInfo.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'U';

  const roleLabel = userInfo?.role ? ROLE_CONFIG[userInfo.role]?.label(t) : '';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button className="glass-control group flex h-11 items-center gap-2 rounded-full p-1 transition-transform outline-none active:scale-95 sm:pr-2.5 md:h-10" />
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
              onClick={changeLanguage}
              className="focus:bg-primary/5 cursor-pointer rounded-xl px-3 py-2.5">
              <Languages className="text-muted-foreground mr-2 size-4" />

              <span className="flex-1 text-sm">{tc('header.language')}</span>

              <span className="text-muted-foreground text-xs font-medium">{currentLanguage.shortLabel}</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="mx-0" />

          <DropdownMenuGroup className="p-1.5">
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive focus:bg-destructive/5 cursor-pointer rounded-xl px-3 py-2.5">
              <LogOut className="mr-2 size-4" />

              <span className="text-sm font-medium">{t('logout')}</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmLogout}
        onOpenChange={setConfirmLogout}
        onConfirm={() => void logout()}
        type="danger"
        title={ts('logout.title')}
        description={ts('logout.description', { count: queued })}
        confirmText={ts('logout.confirm')}
      />
    </>
  );
}
