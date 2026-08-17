import Cookies from 'js-cookie';
import { Check, ChevronDown, LogOut, Moon, Sun, User } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
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
import { clearSession, getClientUser } from '~/lib/auth-utils';

const LANGUAGES = [
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
  { value: 'tg', label: 'Тоҷикӣ' },
];

export function UserNav() {
  const navigate = useNavigate();
  const { t } = useTranslation('auth');
  const { t: tc, i18n } = useTranslation('common');
  const { theme, setTheme, systemTheme } = useTheme();
  const userInfo = getClientUser();
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const currentLng = i18n.language?.split('-')[0];

  const changeLanguage = (lng: string) => {
    Cookies.set('lng', lng, { expires: 365 });
    void i18n.changeLanguage(lng);
  };

  const handleLogout = () => {
    clearSession();
    navigate('/login');
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
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button className="hover:bg-accent hover:text-accent-foreground hover:border-border group flex h-9 items-center gap-2 rounded-lg border border-transparent px-1.5 transition-all outline-none sm:px-2" />
        }>
        <Avatar className="h-8 w-8 border">
          {userInfo?.image ? <AvatarImage src={userInfo.image} alt={userInfo.name} /> : null}
          <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">{initials}</AvatarFallback>
        </Avatar>

        <div className="hidden max-w-40 min-w-0 flex-col items-start text-left xl:flex">
          <span className="max-w-full truncate text-sm leading-none font-semibold">{userInfo?.name}</span>
          <span className="text-muted-foreground mt-1 text-[10px] leading-none">{roleLabel}</span>
        </div>

        <ChevronDown className="text-muted-foreground hidden h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180 sm:block" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64 overflow-hidden p-0" sideOffset={8}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="bg-primary/3 flex flex-col space-y-3 border-b p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2">
                  {userInfo?.image ? <AvatarImage src={userInfo.image} alt={userInfo.name} /> : null}
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col">
                  <p className="truncate text-sm leading-none font-bold">{userInfo?.name}</p>
                  <p className="text-muted-foreground mt-1 text-xs leading-none">{roleLabel}</p>
                </div>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="mx-0" />

        <DropdownMenuGroup className="p-1.5">
          <DropdownMenuItem
            closeOnClick={false}
            onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')}
            className="focus:bg-primary/5 cursor-pointer rounded-md px-3 py-2">
            {currentTheme === 'dark' ? (
              <Sun className="text-muted-foreground mr-2 h-4 w-4" />
            ) : (
              <Moon className="text-muted-foreground mr-2 h-4 w-4" />
            )}
            <span className="text-sm">{tc('header.theme')}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              navigate('/profile');
            }}
            closeOnClick={false}
            className="focus:bg-primary/5 cursor-pointer rounded-md px-3 py-2">
            <User className="text-muted-foreground mr-2 h-4 w-4" />
            <span className="text-sm">{tc('header.profile')}</span>
          </DropdownMenuItem>
          <DropdownMenuLabel className="text-muted-foreground text-2xs px-3 pt-2 pb-1 font-semibold tracking-wider uppercase">
            {tc('header.language')}
          </DropdownMenuLabel>
          {LANGUAGES.map((lng) => (
            <DropdownMenuItem
              key={lng.value}
              onClick={() => changeLanguage(lng.value)}
              className="focus:bg-primary/5 cursor-pointer rounded-md px-3 py-2">
              <span className="mr-2 flex h-4 w-4 items-center justify-center">
                {currentLng === lng.value && <Check className="text-primary h-4 w-4" />}
              </span>
              <span className="text-sm">{lng.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="mx-0" />

        <DropdownMenuGroup className="p-1.5">
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-destructive focus:text-destructive focus:bg-destructive/5 cursor-pointer rounded-md px-3 py-2">
            <LogOut className="mr-2 h-4 w-4" />
            <span className="text-sm font-medium">{t('logout')}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
