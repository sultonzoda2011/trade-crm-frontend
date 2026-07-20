import { useQueryClient } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import { Check, ChevronDown, LogOut, Moon, Settings, Sun, User as UserIcon } from 'lucide-react';
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
import { Skeleton } from '~/components/ui/skeleton';
import { useIsMobile } from '~/hooks/use-mobile';
import { useUser } from '~/hooks/useUser';

const LANGUAGES = [
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
  { value: 'tg', label: 'Тоҷикӣ' },
];

export function UserNav() {
  const { data: userResponse, isLoading } = useUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation('auth');
  const { t: tc, i18n } = useTranslation('common');
  const { theme, setTheme, systemTheme } = useTheme();

  const user = userResponse?.data;
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const currentLng = i18n.language?.split('-')[0];

  const isMobile = useIsMobile();
  const changeLanguage = (lng: string) => {
    Cookies.set('lng', lng, { expires: 365 });
    void i18n.changeLanguage(lng);
  };

  const handleLogout = () => {
    Cookies.remove('token');
    queryClient.removeQueries({ queryKey: ['user-me'] });
    navigate('/login');
  };

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button className="hover:bg-accent hover:text-accent-foreground hover:border-border group flex h-9 items-center gap-2 rounded-lg border border-transparent px-1.5 transition-all outline-none sm:px-2" />
        }>
        {isLoading ? (
          <Skeleton className="h-8 w-8 rounded-full" />
        ) : (
          <Avatar className="h-8 w-8 border">
            <AvatarImage src={import.meta.env.VITE_API_URL + user?.image} alt={user?.fullName} className="grayscale" />
            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">{initials}</AvatarFallback>
          </Avatar>
        )}

        <div className="hidden max-w-40 min-w-0 flex-col items-start text-left xl:flex">
          {isLoading ? (
            <>
              <Skeleton className="mb-1 h-3 w-20" />
              <Skeleton className="h-2 w-24" />
            </>
          ) : (
            <>
              <span className="max-w-full truncate text-sm leading-none font-semibold">{user?.fullName}</span>
              <span className="text-muted-foreground mt-1 text-[10px] leading-none">{user?.role}</span>
            </>
          )}
        </div>

        <ChevronDown className="text-muted-foreground hidden h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180 sm:block" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64 overflow-hidden p-0" sideOffset={8}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="bg-primary/3 flex flex-col space-y-3 border-b p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2">
                  <AvatarImage
                    className="object-cover"
                    src={import.meta.env.VITE_API_URL + user?.image}
                    alt={user?.fullName}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col">
                  <p className="truncate text-sm leading-none font-bold">{user?.fullName}</p>
                  <p className="text-muted-foreground mt-1 text-xs leading-none">{user?.role}</p>
                </div>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        {isMobile && (
          <DropdownMenuGroup className="p-1.5">
            <DropdownMenuItem className="focus:bg-primary/5 cursor-pointer rounded-md px-3 py-2">
              <Link to="/profile" className="flex items-center">
                <UserIcon className="text-muted-foreground mr-2 h-4 w-4" />
                <span className="text-sm">{t('myAccount')}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-primary/5 cursor-pointer rounded-md px-3 py-2">
              <Link to="/settings" className="flex items-center">
                <Settings className="text-muted-foreground mr-2 h-4 w-4" />
                <span className="text-sm">{t('settings')}</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        )}

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
